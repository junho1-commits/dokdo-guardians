"""타임라인 → 사람이 읽는 대본(Markdown)"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = {"title": "오프닝", "map": "지도", "photo": "사진", "timeline": "연표", "dokdoday": "독도의 날", "list": "실천 목록",
         "quiz": "퀴즈", "ending": "마무리", "chapter": "장 구분", "facts": "숫자 카드", "currents": "해류 지도"}
def mmss(t): return f"{int(t//60)}:{int(t%60):02d}"
for ver, fname in [("lower", "대본_저학년.md"), ("upper", "대본_고학년.md")]:
    tl = json.load(open(os.path.join(ROOT, "content", ver + ".timeline.json"), encoding="utf-8"))
    out = [f"# {tl['title']} — {tl['subtitle']}", "",
           f"- 대상: {tl['audience']}", f"- 길이: 약 {mmss(tl['duration'])}",
           f"- 목소리(Typecast): 나리 = {tl['voices']['N']['voice']}, 산이 = {tl['voices']['S']['voice']}", ""]
    for i, s in enumerate(tl["scenes"], 1):
        head = s.get("heading") or {"title": "오프닝", "dokdoday": "10월 25일 독도의 날", "ending": "마무리"}.get(s["type"], "")
        out += [f"## 장면 {i}. {head}  `{NAMES.get(s['type'], s['type'])} · {mmss(s['start'])}`", ""]
        for L in s["lines"]:
            extra = f"  _(화면: {L['caption']})_" if L.get("caption") else ""
            out.append(f"- **{tl['voices'][L['who']]['name']}**: {L['text']}{extra}")
        out.append("")
    open(os.path.join(ROOT, fname), "w", encoding="utf-8").write("\n".join(out))
    print(fname, len(out))
