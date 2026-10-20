"""음성 트랙 + 배경음악(말할 때 자동으로 작아짐) → audio/<ver>/mix.m4a"""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ver = sys.argv[1]
tl = json.load(open(os.path.join(ROOT, "content", ver + ".timeline.json"), encoding="utf-8"))
D = tl["duration"]; vol = tl.get("bgmVolume", 0.12)
fc = (f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume={vol},atrim=0:{D},"
      f"afade=t=in:d=2,afade=t=out:st={D-4}:d=4[b];"
      f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit[v][sc];"
      f"[b][sc]sidechaincompress=threshold=0.02:ratio=5:attack=80:release=700[bd];"
      f"[v][bd]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "audio", ver, "voice.wav"),
                "-stream_loop", "-1", "-i", os.path.join(ROOT, "assets", "bgm", tl["bgm"]),
                "-filter_complex", fc, "-map", "[out]", "-t", str(D), "-c:a", "aac", "-b:a", "192k",
                os.path.join(ROOT, "audio", ver, "mix.m4a")], check=True)
print("mix ok", ver, D)
