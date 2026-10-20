from pathlib import Path
import io, json, zipfile, math
from PIL import Image
import pypdfium2 as pdfium
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / '생성기록.json').read_text(encoding='utf-8'))['designs']
for sub in ['완성58mm_PNG', '재단70mm_PNG', '검수']:
    (ROOT / sub).mkdir(exist_ok=True)
pdfmetrics.registerFont(TTFont('Korean', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KoreanBold', 'C:/Windows/Fonts/malgunbd.ttf'))
INK = '#123454'
COLORS = {}
for item in DATA:
    im = Image.open(ROOT / '원본' / f"{item['id']}_원본.png").convert('RGB')
    pts = [(5,5),(im.width-6,5),(5,im.height-6),(im.width-6,im.height-6)]
    COLORS[item['id']] = tuple(sum(im.getpixel(p)[k] for p in pts)/len(pts)/255 for k in range(3))

def text(c, s, x, y, size=9, bold=False, color=INK, center=False):
    c.setFillColor(color)
    c.setFont('KoreanBold' if bold else 'Korean', size)
    (c.drawCentredString if center else c.drawString)(x, y, s)

def badge(c, item, cx, cy, diameter=58, cutline=False):
    c.saveState()
    radius=diameter*mm/2
    c.setFillColorRGB(*COLORS[item['id']])
    c.circle(cx,cy,radius,stroke=0,fill=1)
    # Prepress layout: 54 mm artwork with 2 mm face margin and 6 mm wrap margin.
    artwork=54*mm
    path=c.beginPath(); path.circle(cx,cy,artwork/2)
    c.clipPath(path,stroke=0,fill=0)
    c.drawImage(str(ROOT/'원본'/f"{item['id']}_원본.png"),cx-artwork/2,cy-artwork/2,artwork,artwork)
    c.restoreState()
    if cutline:
        c.saveState(); c.setStrokeColorRGB(.35,.4,.45); c.setLineWidth(.16*mm)
        c.setDash(1.3*mm,.9*mm); c.circle(cx,cy,radius-.08*mm,stroke=1,fill=0); c.restoreState()

def render_bytes(buf, target, dpi=450, alpha=False):
    doc=pdfium.PdfDocument(buf)
    page=doc[0]
    bitmap=page.render(scale=dpi/72, fill_color=(255,255,255,0 if alpha else 255))
    bitmap.to_pil().save(target,dpi=(dpi,dpi))
    bitmap.close(); page.close(); doc.close()

for item in DATA:
    slug=item['words'].replace('\n','_').replace(' ','')
    for diameter,folder,line in [(58,'완성58mm_PNG',False),(70,'재단70mm_PNG',True)]:
        buf=io.BytesIO(); c=canvas.Canvas(buf,pagesize=(diameter*mm,diameter*mm))
        badge(c,item,diameter*mm/2,diameter*mm/2,diameter,line); c.showPage(); c.save()
        render_bytes(buf.getvalue(),ROOT/folder/f"{item['id']}_{slug}_{diameter}mm.png",alpha=True)

def heading(c, page, pages, subtitle):
    text(c,'독도 사랑 · 58mm 버튼 도안',15*mm,282*mm,16,True)
    text(c,subtitle,15*mm,275*mm,8)
    text(c,'완성 58mm / 점선 재단 70mm / 실제 크기 100% 인쇄',15*mm,269*mm,8)
    c.setStrokeColorRGB(.8,.85,.89); c.setLineWidth(.4); c.line(15*mm,265*mm,195*mm,265*mm)
    # Calibration line has exactly 50 mm between the two ticks.
    c.setStrokeColorRGB(.1,.2,.3); c.setLineWidth(.6)
    c.line(15*mm,15*mm,65*mm,15*mm)
    for x in [15,65]: c.line(x*mm,13.5*mm,x*mm,16.5*mm)
    text(c,'출력 후 자로 확인: 이 선의 길이 50mm',15*mm,9*mm,7)
    text(c,f'{page} / {pages}',195*mm,10*mm,8,center=True)

positions=[(60,225),(150,225),(60,144),(150,144),(60,63),(150,63)]
def print_pdf(path, pages, subtitle):
    c=canvas.Canvas(str(path),pagesize=A4,pageCompression=1)
    c.setTitle('독도 사랑 58mm 버튼 도안 10종')
    c.setAuthor('독도 알림 행사')
    for p, items in enumerate(pages,1):
        heading(c,p,len(pages),subtitle)
        for item,(x,y) in zip(items,positions):
            badge(c,item,x*mm,y*mm,70,True)
            text(c,f"{item['id']}  {item['words'].replace(chr(10),' ')}",x*mm,(y-39)*mm,8,True,center=True)
        c.showPage()
    c.save()

print_pdf(ROOT/'A4_10종모음_70mm재단_2쪽.pdf',[DATA[:6],DATA[6:]],'10종 모음: 각 도안 1개씩 / 전체 2쪽')
print_pdf(ROOT/'A4_같은도안6개씩_10쪽.pdf',[[item]*6 for item in DATA],'도안별 대량 제작: 한 쪽에 같은 도안 6개 / 전체 10쪽')

# Overview is a layout of the finished circular designs, not an altered illustration.
buf=io.BytesIO(); W,H=310*mm,166*mm
c=canvas.Canvas(buf,pagesize=(W,H))
c.setFillColorRGB(.96,.975,.985); c.rect(0,0,W,H,stroke=0,fill=1)
text(c,'독도 사랑, 마음에 달아요',W/2,151*mm,22,True,center=True)
text(c,'초등학교 독도 알림 행사 · 58mm 버튼 도안 10종',W/2,141*mm,10,center=True)
for i,item in enumerate(DATA):
    x=(35+(i%5)*60)*mm; y=(105-(i//5)*64)*mm
    c.saveState(); c.translate(x,y); c.scale(48/58,48/58); badge(c,item,0,0,58); c.restoreState()
    text(c,f"{item['id']}  {item['words'].replace(chr(10),' ')}",x,y-29*mm,8,True,center=True)
c.showPage(); c.save()
render_bytes(buf.getvalue(),ROOT/'도안10종_모아보기.png',dpi=160)

# Render every delivered PDF page for visual review.
for path in ROOT.glob('*.pdf'):
    doc=pdfium.PdfDocument(str(path))
    for i in range(len(doc)):
        page=doc[i]; bmp=page.render(scale=110/72)
        bmp.to_pil().save(ROOT/'검수'/f'{path.stem}_{i+1:02}.png')
        bmp.close(); page.close()
    doc.close()
    reader=PdfReader(path)
    expected=2 if '2쪽' in path.name else 10
    assert len(reader.pages)==expected
    for page in reader.pages:
        assert abs(float(page.mediabox.width)-A4[0])<.01
        assert abs(float(page.mediabox.height)-A4[1])<.01

instructions='''# 독도 58mm 버튼 도안 10종

초등학교 독도 알림 행사 기념품용 새 도안 10종입니다.
기존 폴더의 도안 4종은 변경하지 않았습니다.

## 먼저 열 파일
- 도안10종_모아보기.png: 완성 정면 모습 비교
- A4_10종모음_70mm재단_2쪽.pdf: 10종 각 1개씩, 총 2쪽
- A4_같은도안6개씩_10쪽.pdf: 같은 도안 6개씩, 도안별 1쪽, 총 10쪽
- 완성58mm_PNG: 완성 지름 58mm 원형 PNG 10개, 450dpi, 바깥 투명
- 재단70mm_PNG: 접힘 여유를 포함한 지름 70mm 원형 PNG 10개, 450dpi
- 원본: 이미지 생성 도구의 원본 10개

## 인쇄 및 제작
1. A4 PDF를 열고 용지 A4, 배율 '실제 크기' 또는 '100%'로 출력합니다.
2. '페이지에 맞춤'을 끕니다. 페이지 아래 기준선이 정확히 50mm인지 자로 확인합니다.
3. 외곽 점선 지름 70mm를 따라 오립니다. 정면 완성 크기는 58mm입니다.
4. 글자와 주요 그림은 중앙에 배치했으며, 58mm 정면 바깥의 6mm는 접힘 여유입니다.
5. 기존 프로젝트의 70mm 재단 규격을 적용했습니다. 보유 커터/금형의 종이 재단 지름이 다르면 그 규격에 맞춰야 합니다. 먼저 1개를 시험 제작하세요.
6. 완성58mm_PNG는 정면 확인·편집용입니다. 프레스용 출력에는 재단70mm_PNG 또는 A4 PDF를 사용하세요.

## 도안 문구
'''
for item in DATA: instructions+=f"- {item['id']}: {item['words'].replace(chr(10),' ')}\n"
instructions+='''
## 제작 기록
내장 image_gen 도구로 각 도안을 독립 생성했습니다.
최종 프롬프트 10개는 생성기록.json에 보관했습니다.
PDF에는 지름 54mm의 그림, 58mm 완성 정면, 70mm 재단 원을 배치했습니다.
원본 그림을 유지한 채 인쇄용 원형 클리핑과 치수 배치만 적용했습니다.
그림은 어린이용으로 단순화한 일러스트이며 지리 도면이 아닙니다.
독도 동도·서도 및 등대의 기본 정보 참고: https://dokdo.mofa.go.kr/kor/introduce/facility.jsp
'''
(ROOT/'인쇄안내.md').write_text(instructions,encoding='utf-8')
archive=ROOT.parent/'독도_58mm_버튼도안_10종_전체.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in ROOT.rglob('*'):
        if p.is_file() and '검수' not in p.parts and p.suffix!='.py':
            z.write(p,p.relative_to(ROOT.parent))
print(json.dumps({'design_count':len(DATA),'face_mm':58,'cut_mm':70,'art_mm':54,'png_dpi':450,'pdf_pages':[2,10],'zip':str(archive)},ensure_ascii=False))
