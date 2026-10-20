import sys, glob, os, re
from PIL import Image, ImageDraw, ImageFont
pat, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(pat), key=lambda f: float(re.findall(r'_([\d.]+)\.jpg', f)[0]))
W, H, cols = 800, 450, 2
rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (W * cols, (H + 30) * rows), 'white'); d = ImageDraw.Draw(sh)
f = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 20)
for i, fn in enumerate(fs):
    im = Image.open(fn).resize((W, H)); x, y = (i % cols) * W, (i // cols) * (H + 30)
    sh.paste(im, (x, y)); d.text((x + 6, y + H + 2), os.path.basename(fn), fill='black', font=f)
sh.save(out, quality=88)
