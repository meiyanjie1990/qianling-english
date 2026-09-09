# 生成 PWA 图标：暖橙圆角方块 + 白色"谦"字
from PIL import Image, ImageDraw, ImageFont

def make(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size // 5
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(255, 140, 26, 255))
    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", int(size * 0.55))
    except OSError:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), "谦", font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    d.text((x, y), "谦", font=font, fill=(255, 255, 255, 255))
    img.save(path)

make(192, "icon-192.png")
make(512, "icon-512.png")
make(180, "apple-touch-icon.png")
print("icons done")
