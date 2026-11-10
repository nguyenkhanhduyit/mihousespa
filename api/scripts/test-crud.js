/**
 * test-crud.js — Kiểm thử CRUD toàn diện cho TỪNG module admin.
 *
 * Mục tiêu: chứng minh thêm / sửa / xoá chạy đúng trên:
 *   - News (bài viết & dịch vụ)
 *   - Photo (ảnh / album)
 *   - Static (trang tĩnh)
 *   - Settings (cấu hình)
 *   - SEO (trang SEO)
 *   - Contact (liên hệ / đặt lịch)
 *
 * Chạy: node scripts/test-crud.js
 */
import { query, execute, queryOne } from '../src/db.js';
import { closePool } from '../src/db.js';

const BASE = process.env.TEST_BASE || 'http://localhost:4000';
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || 'Admin@2026';

let pass = 0;
let fail = 0;
let token = '';
const created = { news: [], photo: [], static: [], seo: [] };

function check(label, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${extra ? ' → ' + extra : ''}`);
  }
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await res.json().catch(() => null) : null;
  return { status: res.status, body: payload };
}

const uniq = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function main() {
  console.log('\n=== 0. ĐĂNG NHẬP ADMIN ===');
  const login = await api('/auth/login', {
    method: 'POST',
    body: { username: USER, password: PASS },
    auth: false,
  });
  check('POST /auth/login → 200', login.status === 200, `status=${login.status}`);
  check('nhận về token', Boolean(login.body?.data?.token), JSON.stringify(login.body).slice(0, 120));
  token = login.body?.data?.token || '';
  if (!token) {
    console.log('\nKhông đăng nhập được — dừng.');
    await closePool();
    process.exit(1);
  }

  /* ---------------------------------------------------------------- *
   *  NEWS
   * ---------------------------------------------------------------- */
  console.log('\n=== 1. NEWS — Thêm / Sửa / Xoá ===');
  const nslug = `test-crud-${uniq()}`;
  const nCreate = await api('/news/admin', {
    method: 'POST',
    body: {
      namevi: 'Bài test CRUD',
      nameen: 'CRUD test',
      slugvi: nslug,
      descvi: 'Mô tả ban đầu',
      contentvi: '<p>Nội dung ban đầu</p>',
      type: 'tin-tuc',
      com: 'tin-tuc',
      is_show: 1,
    },
  });
  check('POST /news/admin (thêm) → 200', nCreate.status === 200, `status=${nCreate.status}`);
  const newsId = nCreate.body?.data?.item?.id;
  check('trả về id bản ghi mới', Boolean(newsId));
  if (newsId) created.news.push(newsId);

  const nList = await api('/news/admin/list', { params: '' });
  const nListItems = nList.body?.data?.items || [];
  check(
    'GET /news/admin/list chứa bản ghi vừa tạo',
    nListItems.some((x) => x.id === newsId)
  );

  const nGet = await api(`/news/admin/${newsId}`);
  check('GET /news/admin/:id trả nội dung đúng', nGet.body?.data?.item?.descvi === 'Mô tả ban đầu');

  const nUpdate = await api(`/news/admin/${newsId}`, {
    method: 'PUT',
    body: { namevi: 'Bài test CRUD (đã sửa)', descvi: 'Mô tả đã sửa' },
  });
  check('PUT /news/admin/:id (sửa) → 200', nUpdate.status === 200, `status=${nUpdate.status}`);
  check('tên đã cập nhật', nUpdate.body?.data?.item?.namevi === 'Bài test CRUD (đã sửa)');
  check('nội dung đã cập nhật', nUpdate.body?.data?.item?.descvi === 'Mô tả đã sửa');

  const nSlug = await api(`/news/slug/${nslug}`, { auth: false });
  check('GET /news/slug/:slug trả bản ghi (public)', nSlug.status === 200 && nSlug.body?.data?.item?.id === newsId);

  const nUpdate404 = await api('/news/admin/99999999', { method: 'PUT', body: { namevi: 'x' } });
  check('PUT id không tồn tại → 404', nUpdate404.status === 404, `status=${nUpdate404.status}`);

  const nDelete = await api(`/news/admin/${newsId}`, { method: 'DELETE' });
  check('DELETE /news/admin/:id (xoá) → 200', nDelete.status === 200, `status=${nDelete.status}`);
  const nAfter = await api(`/news/admin/${newsId}`);
  check('bản ghi đã bị xoá khỏi DB', nAfter.status === 404, `status=${nAfter.status}`);
  if (newsId) created.news = created.news.filter((x) => x !== newsId);

  /* ---------------------------------------------------------------- *
   *  PHOTO
   * ---------------------------------------------------------------- */
  console.log('\n=== 2. PHOTO — Thêm / Sửa / Xoá ===');
  const pCreate = await api('/photo/admin', {
    method: 'POST',
    body: {
      namevi: 'Ảnh test CRUD',
      nameen: 'Photo test',
      descvi: 'Mô tả ảnh',
      type: 'album',
      com: 'photo',
      photo: 'upload/test-crud.png',
      numb: 0,
    },
  });
  check('POST /photo/admin (thêm) → 200', pCreate.status === 200, `status=${pCreate.status}`);
  const photoId = pCreate.body?.data?.item?.id;
  check('trả về id ảnh mới', Boolean(photoId));
  if (photoId) created.photo.push(photoId);

  const pTypes = await api('/photo/types', { auth: false });
  check('GET /photo/types trả danh sách loại', pTypes.status === 200 && Array.isArray(pTypes.body?.data));

  const pUpdate = await api(`/photo/admin/${photoId}`, {
    method: 'PUT',
    body: { namevi: 'Ảnh test CRUD (đã sửa)', numb: 5 },
  });
  check('PUT /photo/admin/:id (sửa) → 200', pUpdate.status === 200, `status=${pUpdate.status}`);
  check('tên ảnh đã cập nhật', pUpdate.body?.data?.item?.namevi === 'Ảnh test CRUD (đã sửa)');
  check('thứ tự đã cập nhật', Number(pUpdate.body?.data?.item?.numb) === 5);

  const pReorder = await api('/photo/admin/reorder', {
    method: 'PUT',
    body: { items: [{ id: photoId, numb: 9 }] },
  });
  check('PUT /photo/admin/reorder → 200', pReorder.status === 200, `status=${pReorder.status}`);

  const pDelete = await api(`/photo/admin/${photoId}`, { method: 'DELETE' });
  check('DELETE /photo/admin/:id (xoá) → 200', pDelete.status === 200, `status=${pDelete.status}`);
  const pAfter = await api(`/photo/admin/${photoId}`);
  check('ảnh đã bị xoá', pAfter.status === 404, `status=${pAfter.status}`);
  if (photoId) created.photo = created.photo.filter((x) => x !== photoId);

  /* ---------------------------------------------------------------- *
   *  PHOTO delete-many
   * ---------------------------------------------------------------- */
  console.log('\n=== 3. PHOTO — Xoá nhiều ===');
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const r = await api('/photo/admin', {
      method: 'POST',
      body: { namevi: `Ảnh bulk ${i}`, type: 'other', com: 'photo', photo: `upload/bulk-${i}.png` },
    });
    if (r.body?.data?.item?.id) ids.push(r.body.data.item.id);
  }
  check('tạo được 3 ảnh để xoá hàng loạt', ids.length === 3, `ids=${ids.length}`);
  const pDelMany = await api('/photo/admin/delete-many', { method: 'POST', body: { ids } });
  check('POST /photo/admin/delete-many → 200', pDelMany.status === 200, `status=${pDelMany.status}`);
  let stillThere = 0;
  for (const id of ids) {
    const r = await api(`/photo/admin/${id}`);
    if (r.status !== 404) stillThere++;
  }
  check('cả 3 ảnh đã bị xoá', stillThere === 0, `còn lại=${stillThere}`);

  /* ---------------------------------------------------------------- *
   *  STATIC
   * ---------------------------------------------------------------- */
  console.log('\n=== 4. STATIC — Thêm / Sửa / Xoá ===');
  const sType = `test-crud-${uniq()}`;
  const sCreate = await api('/static/admin', {
    method: 'POST',
    body: {
      type: sType,
      namevi: 'Trang test CRUD',
      slugvi: sType,
      descvi: 'Mô tả trang',
      contentvi: '<p>Nội dung trang</p>',
      is_show: 1,
    },
  });
  check('POST /static/admin (thêm) → 200', sCreate.status === 200, `status=${sCreate.status}`);
  const staticId = sCreate.body?.data?.item?.id;
  check('trả về id trang mới', Boolean(staticId));
  if (staticId) created.static.push(staticId);

  const sByType = await api(`/static/${sType}`, { auth: false });
  check('GET /static/:type trả nội dung (public)', sByType.status === 200 && sByType.body?.data?.item?.id === staticId);

  const sUpdate = await api(`/static/admin/${staticId}`, {
    method: 'PUT',
    body: { namevi: 'Trang test CRUD (đã sửa)', is_show: 0 },
  });
  check('PUT /static/admin/:id (sửa) → 200', sUpdate.status === 200, `status=${sUpdate.status}`);
  check('tên trang đã cập nhật', sUpdate.body?.data?.item?.namevi === 'Trang test CRUD (đã sửa)');
  check('trạng thái hiển thị đã cập nhật', Number(sUpdate.body?.data?.item?.is_show) === 0);

  const sDelete = await api(`/static/admin/${staticId}`, { method: 'DELETE' });
  check('DELETE /static/admin/:id (xoá) → 200', sDelete.status === 200, `status=${sDelete.status}`);
  const sAfter = await api(`/static/${sType}`, { auth: false });
  check('trang đã bị xoá', sAfter.status === 404, `status=${sAfter.status}`);
  if (staticId) created.static = created.static.filter((x) => x !== staticId);

  /* ---------------------------------------------------------------- *
   *  SETTINGS
   * ---------------------------------------------------------------- */
  console.log('\n=== 5. SETTINGS — Đọc / Sửa ===');
  const sGet = await api('/settings', { auth: false });
  check('GET /settings → 200', sGet.status === 200, `status=${sGet.status}`);
  const origName = sGet.body?.data?.namevi || sGet.body?.data?.name || sGet.body?.name;
  const sPut = await api('/settings/admin', {
    method: 'PUT',
    body: { name: 'Mi House Spa (đã sửa)', options: { ...(sGet.body?.data?.options || {}), test_flag: 'ok' } },
  });
  check('PUT /settings/admin (sửa) → 200', sPut.status === 200, `status=${sPut.status}`);
  const sGet2 = await api('/settings', { auth: false });
  check('tên đã lưu xuống DB', sGet2.body?.data?.namevi === 'Mi House Spa (đã sửa)', String(sGet2.body?.data?.namevi));
  check('options đã lưu', sGet2.body?.data?.options?.test_flag === 'ok');
  // khôi phục
  await api('/settings/admin', {
    method: 'PUT',
    body: { name: origName, options: sGet.body?.data?.options || {} },
  });
  check('khôi phục cấu hình gốc', (await api('/settings', { auth: false })).body?.data?.namevi === origName);
  /* ---------------------------------------------------------------- *
   *  SEO
   * ---------------------------------------------------------------- */
  console.log('\n=== 6. SEO — Thêm / Sửa / Xoá ===');
  const seoSlug = `test-crud-${uniq()}`;
  const seoCreate = await api('/seo/admin', {
    method: 'POST',
    body: {
      namevi: 'Trang SEO test',
      slugvi: seoSlug,
      type: seoSlug,
      titlevi: 'SEO Title test',
      descvi: 'SEO Description test',
      keywords: 'spa, mihouse',
    },
  });
  check('POST /seo/admin (thêm) → 200', seoCreate.status === 200, `status=${seoCreate.status}`);
  const seoId = seoCreate.body?.data?.item?.id;
  check('trả về id trang SEO mới', Boolean(seoId));
  if (seoId) created.seo.push(seoId);

  const seoUpdate = await api(`/seo/admin/${seoId}`, {
    method: 'PUT',
    body: { titlevi: 'SEO Title đã sửa', keywords: 'spa, mihouse, edit' },
  });
  check('PUT /seo/admin/:id (sửa) → 200', seoUpdate.status === 200, `status=${seoUpdate.status}`);
  check('SEO title đã cập nhật', seoUpdate.body?.data?.item?.titlevi === 'SEO Title đã sửa');
  check('keywords đã cập nhật', seoUpdate.body?.data?.item?.keywordsvi === 'spa, mihouse, edit');

  const seoList = await api('/seo', { auth: false });
  check('GET /seo chứa bản ghi mới', (seoList.body?.data || []).some((x) => x.id === seoId));

  const seoDelete = await api(`/seo/admin/${seoId}`, { method: 'DELETE' });
  check('DELETE /seo/admin/:id (xoá) → 200', seoDelete.status === 200, `status=${seoDelete.status}`);
  const seoAfter = await api('/seo', { auth: false });
  check('trang SEO đã bị xoá', !(seoAfter.body?.data || []).some((x) => x.id === seoId));
  if (seoId) created.seo = created.seo.filter((x) => x !== seoId);

  /* ---------------------------------------------------------------- *
   *  CONTACT (gửi form + quản lý)
   * ---------------------------------------------------------------- */
  console.log('\n=== 7. CONTACT — Gửi form / Xem / Xoá ===');
  const phone = '0909' + Math.floor(100000 + Math.random() * 899999);
  const cSubmit = await api('/contact', {
    method: 'POST',
    body: {
      dataContact: {
        fullname: 'Khách test CRUD',
        phone,
        email: 'test@mihouse.vn',
        subject: 'Đặt lịch test',
        content: 'Nội dung liên hệ test',
        type: 'dat-lich',
      },
    },
    auth: false,
  });
  check('POST /contact (gửi form) → 200', cSubmit.status === 200, `status=${cSubmit.status}`);

  const cList = await api('/contact/admin/list', { params: '' });
  const cItems = cList.body?.data?.items || [];
  const found = cItems.find((x) => x.phone === phone);
  check('bản ghi liên hệ xuất hiện trong danh sách admin', Boolean(found));
  const contactId = found?.id;

  if (contactId) {
    const cDel = await api(`/contact/admin/${contactId}`, { method: 'DELETE' });
    check('DELETE /contact/admin/:id (xoá) → 200', cDel.status === 200, `status=${cDel.status}`);
    const cAfter = await api('/contact/admin/list', { params: '' });
    check(
      'liên hệ đã bị xoá',
      !(cAfter.body?.data?.items || []).some((x) => x.id === contactId)
    );
  }

  /* ---------------------------------------------------------------- *
   *  Dọn dẹp còn sót
   * ---------------------------------------------------------------- */
  for (const id of created.news) await api(`/news/admin/${id}`, { method: 'DELETE' });
  for (const id of created.photo) await api(`/photo/admin/${id}`, { method: 'DELETE' });
  for (const id of created.static) await api(`/static/admin/${id}`, { method: 'DELETE' });
  for (const id of created.seo) await api(`/seo/admin/${id}`, { method: 'DELETE' });

  console.log('\n====================================================');
  console.log(`KẾT QUẢ CRUD:  ${pass} pass / ${fail} fail`);
  console.log('====================================================');

  await closePool();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\nLỖI:', err);
  await closePool().catch(() => {});
  process.exit(1);
});
