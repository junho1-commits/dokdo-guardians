// player.html 을 헤드리스 Chrome 으로 한 프레임씩 그려 MP4 로 만든다.
// 사용법:
//   node tools/render.cjs lower            → output/<이름>.mp4
//   node tools/render.cjs lower --snap 5,30 → output/snap/lower_5.png ... (확인용 정지 화면)
// 필요: Playwright 패키지(PLAYWRIGHT_PATH), Chrome, ffmpeg
const path = require('path'), fs = require('fs'), http = require('http'), { spawn } = require('child_process');
const PW = process.env.PLAYWRIGHT_PATH || path.join(process.env.LOCALAPPDATA, 'ms-playwright-go', '1.57.0', 'package');
const { chromium } = require(PW);
const ROOT = path.resolve(__dirname, '..');
const FPS = 30, WORKERS = Number(process.env.WORKERS || 4);
const NAMES = { lower: '독도_모션그래픽_저학년', upper: '독도_모션그래픽_고학년' };

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function openPage(browser, port, ver) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${port}/player.html?render&v=${ver}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  return page;
}

function run(cmd, args) {
  return new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] }); p.on('exit', (c) => (c ? rej(new Error(cmd + ' ' + c)) : res())); });
}

(async () => {
  const ver = process.argv[2] || 'lower';
  const snapIdx = process.argv.indexOf('--snap');
  const srv = await serve(); const port = srv.address().port;
  const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu-vsync'] });
  const outDir = path.join(ROOT, 'output'); fs.mkdirSync(outDir, { recursive: true });

  if (snapIdx > 0) {
    const page = await openPage(browser, port, ver);
    fs.mkdirSync(path.join(outDir, 'snap'), { recursive: true });
    for (const t of process.argv[snapIdx + 1].split(',').map(Number)) {
      const b64 = await page.evaluate((t) => { renderAt(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.85).split(',')[1]; }, t);
      fs.writeFileSync(path.join(outDir, 'snap', `${ver}_${t}.jpg`), Buffer.from(b64, 'base64'));
    }
    await browser.close(); srv.close(); return;
  }

  const probe = await openPage(browser, port, ver);
  const duration = await probe.evaluate((v) => durationOf(v), ver); await probe.close();
  const total = Math.ceil(duration * FPS);
  const tmp = path.join(outDir, 'tmp_' + ver); fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(total / WORKERS);
  const t0 = Date.now(); let done = 0;
  await Promise.all([...Array(WORKERS).keys()].map(async (w) => {
    const a = w * per, b = Math.min(total, a + per);
    const page = await openPage(browser, port, ver);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(tmp, `seg${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((r) => ff.on('exit', r));
    for (let f = a; f < b; f++) {
      const b64 = await page.evaluate((t) => { renderAt(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.93).split(',')[1]; }, f / FPS);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      done++;
      if (done % 300 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${ver}: ${done}/${total} 프레임 (${(done / el).toFixed(1)} fps, 남은 시간 약 ${Math.round((total - done) / (done / el))}초)`); }
    }
    ff.stdin.end(); await closed; await page.close();
  }));
  await browser.close(); srv.close();
  const listFile = path.join(tmp, 'list.txt');
  fs.writeFileSync(listFile, [...Array(WORKERS).keys()].map((w) => `file 'seg${w}.mp4'`).join('\n'));
  const out = path.join(outDir, `${NAMES[ver]}.mp4`);
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-i', path.join(ROOT, 'audio', ver, 'mix.m4a'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('완료:', out, `(${((Date.now() - t0) / 60000).toFixed(1)}분)`);
})().catch((e) => { console.error(e); process.exit(1); });
