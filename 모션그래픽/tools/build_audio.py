"""대본(content/*.json) → Typecast 음성 생성 → 타임라인(JSON) + 음성 트랙(WAV) + 자막(SRT) + 대본(MD).

사용법: python tools/build_audio.py lower|upper
환경변수 TYPECAST_API_KEY 필요. 같은 문장·목소리·감정은 audio/cache 에 저장되어 다시 받지 않는다.
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = {  # Typecast ssfm-v30 어린이 목소리
    "N": {"name": "나리", "voice_id": "tc_6699eb5749dfac016c29445c", "voice": "Sua"},
    "S": {"name": "산이", "voice_id": "tc_6699eb3849dfac016c29444c", "voice": "Siwoo"},
}
SR = 24000
FPS = 30
GAP = 0.45          # 대사 사이 쉼
SCENE_HEAD = 0.9    # 장면 시작 후 첫 대사까지 (전환 효과 시간)
SCENE_TAIL = 0.9
TITLE_INTRO = 3.2   # 타이틀 애니메이션
CREDITS = 9.0       # 마지막 출처 화면


def tts(voice_id, text, emotion, tempo, out):
    body = {"voice_id": voice_id, "text": text, "model": "ssfm-v30", "language": "kor",
            "prompt": {"emotion_type": "preset", "emotion_preset": emotion, "emotion_intensity": 1.0},
            "output": {"audio_format": "wav", "audio_tempo": tempo, "volume": 100}}
    req = urllib.request.Request("https://api.typecast.ai/v1/text-to-speech",
                                 data=json.dumps(body).encode("utf-8"),
                                 headers={"X-API-KEY": os.environ["TYPECAST_API_KEY"],
                                          "Content-Type": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")
            if e.code in (429, 500, 502, 503) and attempt < 4:
                time.sleep(5 * (attempt + 1)); continue
            raise RuntimeError(f"Typecast {e.code}: {msg}")
    with open(out, "wb") as f:
        f.write(data)


def load_pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim(x, thr=0.01):
    idx = np.nonzero(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.03 * SR)); b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]


def envelope(x):
    hop = SR // FPS
    n = int(np.ceil(len(x) / hop))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    if e.max() > 0:
        e = e / np.percentile(e, 95)
    return [round(float(min(1.0, v)), 2) for v in e]


def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main(which):
    doc = json.load(open(os.path.join(ROOT, "content", which + ".json"), encoding="utf-8"))
    cache = os.path.join(ROOT, "audio", "cache"); os.makedirs(cache, exist_ok=True)
    tempo = doc.get("tempo", 1.0)
    t = 0.0
    clips = []
    timeline = {k: v for k, v in doc.items() if k != "scenes"}
    timeline["voices"] = VOICES
    timeline["fps"] = FPS
    scenes = []
    for si, sc in enumerate(doc["scenes"]):
        s = dict(sc); s["start"] = t
        t += TITLE_INTRO if sc["type"] == "title" else SCENE_HEAD
        lines = []
        for li, ln in enumerate(sc["lines"]):
            v = VOICES[ln["who"]]
            say = ln.get("say", ln["text"])
            emo = ln.get("emo", "normal")
            key = hashlib.sha1(f'{v["voice_id"]}|{say}|{emo}|{tempo}|v30'.encode("utf-8")).hexdigest()[:16]
            path = os.path.join(cache, key + ".wav")
            if not os.path.exists(path):
                print(f"  TTS {v['name']}: {say[:40]}", flush=True)
                tts(v["voice_id"], say, emo, tempo, path)
            x = trim(load_pcm(path))
            dur = len(x) / SR
            L = dict(ln); L.update(start=round(t, 3), dur=round(dur, 3), env=envelope(x))
            lines.append(L); clips.append((t, x))
            t += dur + GAP + ln.get("pauseAfter", 0)
        t += SCENE_TAIL - GAP
        if sc["type"] == "ending":
            t += CREDITS
        s["lines"] = lines; s["end"] = round(t, 3)
        scenes.append(s)
    timeline["scenes"] = scenes
    timeline["duration"] = round(t, 3)

    out = os.path.join(ROOT, "audio", which); os.makedirs(out, exist_ok=True)
    buf = np.zeros(int((t + 1) * SR), dtype=np.float32)
    for st, x in clips:
        i = int(st * SR); buf[i:i + len(x)] += x
    peak = np.abs(buf).max()
    buf = buf / peak * 0.89 if peak > 0 else buf
    with wave.open(os.path.join(out, "voice.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    json.dump(timeline, open(os.path.join(ROOT, "content", which + ".timeline.json"), "w", encoding="utf-8"),
              ensure_ascii=False)
    with open(os.path.join(ROOT, "content", which + ".timeline.js"), "w", encoding="utf-8") as f:
        f.write(f"window.TIMELINES=window.TIMELINES||{{}};window.TIMELINES['{which}']=")
        json.dump(timeline, f, ensure_ascii=False); f.write(";\n")

    # 자막(SRT)
    n = 0
    with open(os.path.join(ROOT, "output", f"{which}.srt"), "w", encoding="utf-8") as f:
        for s in scenes:
            for L in s["lines"]:
                n += 1
                f.write(f"{n}\n{srt_time(L['start'])} --> {srt_time(L['start'] + L['dur'])}\n"
                        f"{VOICES[L['who']]['name']}: {L['text']}\n\n")
    print(f"{which}: {len(clips)} lines, {t:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
