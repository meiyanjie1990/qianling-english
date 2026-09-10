# 生成 PWA 图标：浅蓝渐变圆角方块 + 「灵」字
#
#   python tools/make-icons.py            生成正式图标（CHOSEN 方案）
#   python tools/make-icons.py options    另出三方案对比图 docs/icon-options.png
#
# 画法：先按 4 倍尺寸画好再缩小（超采样），边缘和字都更干净。
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SS = 4                 # 超采样倍数
RADIUS = 0.235         # 圆角占边长比例（squircle）
GLYPH_RATIO = 0.46     # 字高占边长比例（留白靠这个撑）

FONT_ROUND = r"C:\Windows\Fonts\SIMYOU.TTF"    # 幼圆：圆润、亲和
FONT_AMBER = r"C:\Windows\Fonts\STHUPO.TTF"    # 华文琥珀：圆胖、俏皮
FONT_FALLBACK = r"C:\Windows\Fonts\msyhbd.ttc" # 兜底：雅黑粗体

# A 浅天蓝渐变 + 白色幼圆（加白色描边变粗）—— 主推
# B 极浅冰蓝 + 深蓝字 —— 干净、反差清爽
# C 浅蓝渐变 + 白色琥珀 —— 更圆胖俏皮
VARIANTS = {
    "A": dict(top=(196, 226, 252), bottom=(122, 182, 238), font=FONT_ROUND,
              ink=(255, 255, 255), stroke=0.013, shadow=(26, 84, 152, 140)),
    "B": dict(top=(230, 245, 255), bottom=(152, 206, 246), font=FONT_ROUND,
              ink=(30, 96, 164), stroke=0.004, shadow=None),
    "C": dict(top=(196, 226, 252), bottom=(118, 178, 238), font=FONT_AMBER,
              ink=(255, 255, 255), stroke=0.0, shadow=(26, 84, 152, 140)),
}
CHOSEN = "A"
GLYPH = "灵"


def _font(path, target_h, text):
    """反推出恰好让这个字高等于 target_h 的字号"""
    probe = ImageFont.truetype(path, 100)
    box = probe.getbbox(text)
    h = max(1, box[3] - box[1])
    try:
        return ImageFont.truetype(path, max(1, round(100 * target_h / h)))
    except OSError:
        return ImageFont.load_default()


def build_icon(size, key=CHOSEN):
    v = VARIANTS[key]
    S = size * SS

    # 1) 竖向浅蓝渐变
    grad = Image.new("RGB", (S, S))
    px = grad.load()
    top, bottom = v["top"], v["bottom"]
    for y in range(S):
        t = y / (S - 1)
        row = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(S):
            px[x, y] = row
    bg = grad.convert("RGBA")

    # 2) 左上角柔光。只轻轻提一点，太强会把底色冲成白色、白字就糊了
    sheen = Image.new("L", (S, S), 0)
    r = int(S * 0.55)
    ImageDraw.Draw(sheen).ellipse([S * 0.26 - r, S * 0.16 - r, S * 0.26 + r, S * 0.16 + r], fill=26)
    sheen = sheen.filter(ImageFilter.GaussianBlur(S * 0.16))
    glow = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    glow.putalpha(sheen)
    bg.alpha_composite(glow)

    # 3) 圆角方形裁切
    rounded = Image.new("L", (S, S), 0)
    ImageDraw.Draw(rounded).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * RADIUS), fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(bg, (0, 0), rounded)

    # 4) 字（先画投影，再画字面）
    font = _font(v["font"], S * GLYPH_RATIO, GLYPH)
    box = font.getbbox(GLYPH)
    x = (S - (box[2] - box[0])) / 2 - box[0]
    y = (S - (box[3] - box[1])) / 2 - box[1]
    stroke = int(S * v["stroke"])

    if v["shadow"]:
        sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((x, y + S * 0.018), GLYPH, font=font,
                                fill=v["shadow"], stroke_width=stroke, stroke_fill=v["shadow"])
        out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S * 0.015)))

    ImageDraw.Draw(out).text((x, y), GLYPH, font=font, fill=v["ink"],
                             stroke_width=stroke, stroke_fill=v["ink"])

    return out.resize((size, size), Image.LANCZOS)


def make(size, path, key=CHOSEN):
    build_icon(size, key).save(path)


def options_sheet(path, size=256, gap=30, pad=34):
    keys = ["A", "B", "C"]
    W = pad * 2 + size * 3 + gap * 2
    H = pad * 2 + size + 52
    canvas = Image.new("RGB", (W, H), (247, 245, 241))
    d = ImageDraw.Draw(canvas)
    label = ImageFont.truetype(FONT_FALLBACK, 24)
    small = None
    for i, k in enumerate(keys):
        icon = build_icon(size, k)
        x = pad + i * (size + gap)
        canvas.paste(icon, (x, pad), icon)
        canvas.paste(icon.resize((64, 64), Image.LANCZOS), (x + size - 64, pad + size - 64), build_icon(64, k))
        tw = d.textlength(k, font=label)
        d.text((x + (size - tw) / 2, pad + size + 14), k, font=label, fill=(130, 126, 120))
    canvas.save(path)
    print("options ->", path)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "options":
        options_sheet("docs/icon-options.png")
    else:
        make(192, "icon-192.png")
        make(512, "icon-512.png")
        make(180, "apple-touch-icon.png")
        print("icons done:", CHOSEN)
