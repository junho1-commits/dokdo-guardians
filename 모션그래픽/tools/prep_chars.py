"""캐릭터 정면 이미지에서 눈·입을 지운 베이스 이미지를 만든다 (애니메이션으로 다시 그림)."""
import json, numpy as np
from PIL import Image, ImageFilter
SRC = "../캐릭터_다각도/"
CH = {
  "nari": dict(file="01_해바라기소녀_정면.png", skin=(248,211,192),
               eyes=[(374,516),(508,516)], eye_box=(17,21), mouth=(438,594), mouth_box=(64,22)),
  "sani": dict(file="02_산소년_정면.png", skin=(254,217,198),
               eyes=[(313,442),(443,442)], eye_box=(17,22), mouth=(377,520), mouth_box=(64,22)),
}
meta = {}
for name, c in CH.items():
    im = Image.open(SRC + c["file"]).convert("RGBA")
    a = np.array(im).astype(np.int32)
    rgb = a[..., :3]
    H, W = rgb.shape[:2]
    mask = np.zeros((H, W), bool)
    def region(cx, cy, rx, ry):
        ys, xs = np.ogrid[:H, :W]
        return ((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2 <= 1
    skin = np.array(c["skin"])
    regs = [(ex, ey, *c["eye_box"]) for ex, ey in c["eyes"]] + [(*c["mouth"], *c["mouth_box"])]
    for (cx, cy, rx, ry) in regs:
        ys, xs = np.ogrid[:H, :W]
        d = np.sqrt(((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2)
        ring = (d > 1.15) & (d < 1.6) & (np.abs(rgb - skin).sum(-1) < 30)
        col = np.median(rgb[ring], axis=0)
        w = np.clip((1.12 - d) / 0.12, 0, 1)[..., None]   # 가장자리 부드럽게
        a[..., :3] = (a[..., :3] * (1 - w) + col * w).astype(np.int32)
        c.setdefault("cols", []).append(col)
    mx, my = c["mouth"]
    out = Image.fromarray(a.astype(np.uint8))
    bbox = out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    out = out.crop(bbox)
    ox, oy = bbox[0], bbox[1]
    out.save(f"assets/chars/{name}_base.png")
    Image.open(SRC + c["file"]).crop(bbox).save(f"assets/chars/{name}_front.png")
    meta[name] = dict(w=out.width, h=out.height, skin="rgb(%d,%d,%d)" % c["skin"],
                      eyes=[[ex - ox, ey - oy] for ex, ey in c["eyes"]],
                      mouth=[mx - ox, my - oy])
for name, f in [("nari_45", "03_해바라기소녀_반측면45.png"), ("sani_45", "06_산소년_반측면45.png")]:
    im = Image.open(SRC + f).convert("RGBA")
    bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    im = im.crop(bbox); im.thumbnail((1000, 1500)); im.save(f"assets/chars/{name}.png")
    meta[name] = dict(w=im.width, h=im.height)
json.dump(meta, open("assets/chars/chars.json", "w"), indent=1)
print(json.dumps(meta, indent=1))

# 원본에 남아 있는 회색 체크무늬(불투명) 제거: 투명 배경과 이어진 무채색 밝은 픽셀을 투명 처리
from scipy import ndimage
def clean(path):
    a = np.array(Image.open(path)).astype(np.int32)
    rgb, al = a[..., :3], a[..., 3]
    sat = rgb.max(-1) - rgb.min(-1)
    cand = ((sat < 14) & (rgb.min(-1) > 140)) | (al < 250)
    lab, n = ndimage.label(cand)
    bgl = set(np.unique(lab[al < 10])) - {0}
    kill = np.isin(lab, list(bgl))
    a[kill, 3] = 0
    Image.fromarray(a.astype(np.uint8)).save(path)
    return int(kill.sum())
for f in ["nari_base", "sani_base"]:
    print(f, clean(f"assets/chars/{f}.png"))
