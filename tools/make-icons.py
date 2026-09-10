# 生成 PWA 图标：蓝色圆角方块 + 白色"灵"字
from PIL import Image, ImageDraw, ImageFont

FILL = (47, 111, 224, 255)    # 蓝底 #2F6FE0
INK = (255, 255, 255, 255)    # 白字

def make(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size // 5
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=FILL)
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", int(size * 0.55))
    except OSError:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), "灵", font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    d.text((x, y), "灵", font=font, fill=INK)
    img.save(path)

make(192, "icon-192.png")
make(512, "icon-512.png")
make(180, "apple-touch-icon.png")
print("icons done")
