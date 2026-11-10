/**
 * Kiểm thử toàn diện: quét tất cả route của web + đảm bảo API trả dữ liệu.
 * Chạy: node scripts/test-web.js
 */
const WEB = process.env.WEB_BASE || 'http://127.0.0.1:5173';
const API = process.env.API_BASE || 'http://127.0.0.1:4000';

const WEB_ROUTES = [
  '/', '/gioi-thieu', '/lien-he', '/chinh-sach',
  '/dich-vu', '/bang-gia', '/dao-tao',
  '/album-anh', '/khong-gian', '/nail-hottrend', '/tin-tuc',
  '/admin/login', '/admin', '/admin/news', '/admin/photo', '/admin/static',
  '/admin/settings', '/admin/contact', '/admin/seo',
  '/khong-ton-tai-abc',
];

const API_ROUTES = [
  ['GET', '/api/health'],
  ['GET', '/api/news?limit=3'],
  ['GET', '/api/news?type=dich-vu'],
  ['GET', '/api/news?type=bang-gia'],
  ['GET', '/api/news?type=tin-tuc'],
  ['GET', '/api/news?type=dao-tao'],
  ['GET', '/api/news?type=feedback'],
  ['GET', '/api/news?type=tieu-chi'],
  ['GET', '/api/photo?limit=5'],
  ['GET', '/api/photo/types'],
  ['GET', '/api/static'],
  ['GET', '/api/static/gioi-thieu'],
  ['GET', '/api/settings'],
  ['GET', '/api/seo'],
];

let pass = 0, fail = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(`${name} ${detail}`); console.log(`  ✗ ${name} ${detail}`); }
}

(async () => {
  console.log('\n=== WEB ROUTES (SPA) ===');
  for (const route of WEB_ROUTES) {
    try {
      const res = await fetch(`${WEB}${route}`, { redirect: 'manual' });
      const text = await res.text();
      const hasRoot = text.includes('id="root"');
      const noError = !text.includes('Vite Error');
      check(`${route.padEnd(22)} → ${res.status}`, res.status === 200 && hasRoot && noError, `status=${res.status}`);
    } catch (e) {
      check(`${route.padEnd(22)} → lỗi`, false, e.message);
    }
  }

  console.log('\n=== API ROUTES ===');
  for (const [method, route] of API_ROUTES) {
    try {
      const res = await fetch(`${API}${route}`);
      const json = await res.json().catch(() => ({}));
      check(`${method} ${route.padEnd(32)} → ${res.status}`, res.status === 200 && json.status === 'success', `status=${res.status}`);
    } catch (e) {
      check(`${method} ${route.padEnd(32)} → lỗi`, false, e.message);
    }
  }

  console.log('\n=== ASSET CHECK ===');
  const newsRes = await fetch(`${API}/api/news?limit=3`);
  const newsJson = await newsRes.json();
  const photos = (newsJson.data?.items || []).map((i) => i.photo).filter(Boolean);
  if (photos.length) {
    const p = photos[0];
    const res = await fetch(`${WEB}${p}`);
    check(`ảnh "${p.slice(-28)}" tải được`, res.status === 200, `status=${res.status}`);
  } else {
    console.log('  · không có ảnh để kiểm tra');
  }

  console.log('\n=== BUILD OUTPUT ===');
  try {
    const fs = await import('node:fs');
    const dist = '../web/dist';
    const hasIndex = fs.existsSync(`${dist}/index.html`);
    const hasAssets = fs.existsSync(`${dist}/assets`);
    check('web/dist/index.html tồn tại', hasIndex);
    check('web/dist/assets tồn tại', hasAssets);
  } catch (e) {
    console.log('  · bỏ qua: ' + e.message);
  }

  console.log(`\n${'='.repeat(52)}`);
  console.log(`KẾT QUẢ:  ${pass} pass / ${fail} fail`);
  if (failures.length) {
    console.log('\nLỗi:');
    failures.forEach((f) => console.log('  - ' + f));
  }
  console.log('='.repeat(52));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('LỖI:', e); process.exit(1); });