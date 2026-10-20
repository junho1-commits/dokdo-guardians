# 독도 소개 모션그래픽 (나리 · 산이)

| 결과물 | 내용 |
|---|---|
| `output/독도_모션그래픽_저학년.mp4` | 1~3학년용, 약 3분 20초 (1920×1080, 30fps) |
| `output/독도_모션그래픽_고학년.mp4` | 4~6학년용, 약 5분 55초 |
| `output/lower.srt`, `output/upper.srt` | 자막 파일 (영상에는 자막이 이미 들어가 있음) |
| `대본_저학년.md`, `대본_고학년.md` | 장면별 대본 |
| `player.html` | 브라우저 미리보기 (음성 포함) |

## 고치고 다시 만드는 방법

1. 대본 수정: `content/lower.json`, `content/upper.json`
   - `text` = 화면 자막, `say` = 읽을 때 쓰는 글(숫자를 한글로 풀어 씀), `emo` = 감정(normal/happy/toneup/tonedown/sad)
2. 음성 생성(Typecast, 환경변수 `TYPECAST_API_KEY`): `python tools/build_audio.py lower`
   - 바뀐 문장만 새로 생성합니다(`audio/cache`).
3. 배경음악 섞기: `python tools/mix_audio.py lower`
4. 영상 출력: `node tools/render.cjs lower` (정지 화면 확인: `node tools/render.cjs lower --snap 10,30`)
5. 대본 문서 갱신: `python tools/make_script_md.py`

목소리를 바꾸려면 `tools/build_audio.py`의 `VOICES`에서 voice_id를 바꿉니다.

## 자료 출처

- 사진: Wikimedia Commons (저작자·라이선스는 `assets/photos/_meta.json`, 영상 마지막 출처 화면과 사진 오른쪽 아래에 표시)
  CC BY-SA 사진을 편집해 재배포하면 같은 조건(CC BY-SA)이 적용됩니다.
- 사료 이미지: 국사편찬위원회, 서울대학교 규장각한국학연구원 (`../assets/archive/출처와이용조건.md`)
- 지도: Natural Earth (퍼블릭 도메인), 글꼴: 주아·블랙한산스·고운돋움 (SIL OFL)
- 배경음악: 저학년 Pixabay(The Mountain), 고학년 Kevin MacLeod "Enchanted Journey" (CC BY)
- 음성: Typecast AI (나리 Sua, 산이 Siwoo) — 배포 전 Typecast 요금제의 이용 범위를 확인하세요.
