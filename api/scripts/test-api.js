/**
 * Kiểm thử tự động toàn bộ API (CRUD admin + public).
 * Chạy: node scripts/test-api.js
 */
const BASE = process.env.API_BASE || 'http://127.0.0.1:4000';

let token = '';
let pass = 0;
let fail = 0;
const failures = [];

async function call(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

function check(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(`${name} ${detail}`);
    console.log(`  ✗ ${name} ${detail}`);
  }
}

(async () => {
  console.log('\n=== 1. HEALTH ===');
  let r = await call('GET', '/api/health', null, false);
  check('health trả về success', r.json?.status === 'success', JSON.stringify(r.json).slice(0, 120));
  check('DB kết nối được', r.json?.data?.db === true);

  console.log('\n=== 2. AUTH ===');
  r = await call('POST', '/api/auth/login', { username: 'admin', password: 'Admin@2026' }, false);
  check('đăng nhập thành công', r.status === 200 && r.json?.data?.token, JSON.stringify(r.json).slice(0, 120));
  token = r.json?.data?.token || '';

  r = await call('POST', '/api/auth/login', { username: 'admin', password: 'sai-mat-khau' }, false);
  check('sai mật khẩu → 401', r.status === 401);

  r = await call('GET', '/api/news');
  check('news không cần auth', r.status === 200);

  // Kiểm tra route admin bị chặn khi không có token
  const savedToken = token;
  token = '';
  r = await call('GET', '/api/news/admin/list');
  check('news admin cần auth', r.status === 401, `status=${r.status}`);
  r = await call('GET', '/api/photo/admin/list');
  check('photo admin cần auth', r.status === 401, `status=${r.status}`);
  token = savedToken;

  r = await call('GET', '/api/news/admin/list');
  check('news admin có auth', r.status === 200 && Array.isArray(r.json?.data?.items));

  console.log('\n=== 3. NEWS CRUD ===');
  const uniq = Date.now();
  const payload = {
    type: 'tin-tuc',
    namevi: `Bài kiểm thử API ${uniq}`,
    nameen: `API test article ${uniq}`,
    descvi: 'Mô tả kiểm thử',
    contentvi: '<p>Nội dung kiểm thử</p>',
    slugvi: `api-test-${uniq}`,
    numb: 999,
  };

  r = await call('POST', '/api/news/admin', payload);
  const createdId = r.json?.data?.item?.id;
  check('THÊM news', r.status === 200 && createdId > 0, JSON.stringify(r.json).slice(0, 150));

  r = await call('GET', `/api/news/admin/${createdId}`);
  check('ĐỌC news vừa tạo', r.json?.data?.item?.namevi === payload.namevi);

  r = await call('PUT', `/api/news/admin/${createdId}`, { namevi: 'Đã sửa qua API', descvi: 'Desc mới' });
  check('SỬA news', r.status === 200 && r.json?.data?.item?.namevi === 'Đã sửa qua API', JSON.stringify(r.json).slice(0, 150));

  r = await call('GET', `/api/news/slug/${payload.slugvi}`);
  check('GET news theo slug (public)', r.status === 200 && r.json?.data?.item?.id === createdId);

  r = await call('DELETE', `/api/news/admin/${createdId}`);
  check('XOÁ news', r.status === 200, JSON.stringify(r.json).slice(0, 120));

  r = await call('GET', `/api/news/admin/${createdId}`);
  check('news đã xoá không còn', r.status === 404);

  console.log('\n=== 4. NEWS XOÁ NHIỀU ===');
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const rr = await call('POST', '/api/news/admin', { namevi: `bulk ${uniq}-${i}`, slugvi: `bulk-${uniq}-${i}`, type: 'tin-tuc' });
    if (rr.json?.data?.item?.id) ids.push(rr.json.data.item.id);
  }
  check('tạo 3 bản ghi để xoá hàng loạt', ids.length === 3);
  r = await call('POST', '/api/news/admin/delete-many', { ids });
  check('XOÁ NHIỀU news', r.status === 200 && r.json?.data?.count === 3, JSON.stringify(r.json).slice(0, 120));

  console.log('\n=== 5. PHOTO CRUD ===');
  r = await call('POST', '/api/photo/admin', { namevi: `Ảnh test ${uniq}`, type: 'menu', com: 'photo', photo: 'test/photo.jpg' });
  const photoId = r.json?.data?.item?.id;
  check('THÊM photo', r.status === 200 && photoId > 0, JSON.stringify(r.json).slice(0, 150));

  r = await call('PUT', `/api/photo/admin/${photoId}`, { namevi: 'Ảnh đã sửa' });
  check('SỬA photo', r.status === 200 && r.json?.data?.item?.namevi === 'Ảnh đã sửa');

  r = await call('DELETE', `/api/photo/admin/${photoId}`);
  check('XOÁ photo', r.status === 200);

  console.log('\n=== 6. STATIC / SETTINGS / SEO ===');
  r = await call('GET', '/api/static');
  check('GET static public', r.status === 200 && Array.isArray(r.json?.data));

  r = await call('GET', '/api/static/gioi-thieu');
  check('GET static theo type', r.status === 200 && r.json?.data?.item?.type === 'gioi-thieu');

  r = await call('GET', '/api/settings');
  check('GET settings public', r.status === 200 && r.json?.data?.options !== undefined);

  r = await call('GET', '/api/seo');
  check('GET seo pages', r.status === 200 && Array.isArray(r.json?.data));

  console.log('\n=== 7. UPLOAD / GALLERY ===');
  r = await call('GET', '/api/upload/signature');
  check('upload signature (chưa cấu hình Cloudinary → 503)', r.status === 503 || r.status === 200, `status=${r.status}`);

  r = await call('GET', '/api/upload/gallery');
  check('upload gallery', r.status === 200 && Array.isArray(r.json?.data?.items));

  console.log('\n=== 8. CONTACT ===');
  r = await call('POST', '/api/contact', { dataContact: { fullname: 'Người test', phone: '0900000000', content: 'Xin chào' } }, false);
  check('POST contact public', r.status === 200 && r.json?.data?.id > 0, JSON.stringify(r.json).slice(0, 120));

  r = await call('POST', '/api/contact', { dataContact: { phone: '0900000000' } }, false);
  check('contact thiếu họ tên → 422', r.status === 422);

  console.log('\n=== 9. 404 handling ===');
  r = await call('GET', '/api/khong-ton-tai', null, false);
  check('API route không tồn tại → 404 JSON', r.status === 404 && r.json?.status === 'error');

  console.log(`\n${'='.repeat(50)}`);
  console.log(`KẾT QUẢ:  ${pass} pass / ${fail} fail`);
  if (failures.length) {
    console.log('\nCác mục lỗi:');
    failures.forEach((f) => console.log('  - ' + f));
  }
  console.log('='.repeat(50));
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('LỖI:', e);
  process.exit(1);
});