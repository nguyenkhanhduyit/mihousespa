import { Router } from 'express';
import { query, queryOne, execute } from '../db.js';
import { ok, fail, wrap, toInt, pagination } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';
import { buildUrl } from '../cloudinary.js';

const router = Router();

/* ================================================================== *
 *  STATIC PAGES (gioi-thieu, lien-he, footer, ...)
 * ================================================================== */
export const staticRouter = Router();

const STATIC_FIELDS = [
  'namevi', 'nameen', 'namecn', 'descvi', 'descen', 'desccn',
  'contentvi', 'contenten', 'contentcn', 'photo', 'photo2', 'photo3',
  'slugvi', 'slugen', 'slugcn', 'type', 'options', 'options2', 'is_show',
];

function decorate(row) {
  if (!row) return row;
  const out = { ...row };
  if (row.photo) {
    out.photo_url = buildUrl(row.photo, '360x360x1');
    out.photo_original = buildUrl(row.photo, null);
  }
  return out;
}

/** GET /api/static — public */
staticRouter.get(
  '/',
  wrap(async (req, res) => {
    const type = req.query.type ? String(req.query.type) : null;
    const where = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];
    const rows = await query(`SELECT * FROM table_static ${where} ORDER BY id ASC`, params);
    return ok(res, rows.map(decorate));
  })
);

/** GET /api/static/admin/list — (đặt trước /:type để không bị shadow) */
staticRouter.get(
  '/admin/list',
  requireAuth,
  wrap(async (req, res) => {
    const rows = await query('SELECT * FROM table_static ORDER BY id ASC');
    return ok(res, rows.map(decorate));
  })
);

/** GET /api/static/admin/:id */
staticRouter.get(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const row = await queryOne('SELECT * FROM table_static WHERE id = ? LIMIT 1', [toInt(req.params.id)]);
    if (!row) return fail(res, 'Không tìm thấy bản ghi', 404);
    return ok(res, { item: decorate(row) });
  })
);

/** GET /api/static/:type — public theo type */
staticRouter.get(
  '/:type',
  wrap(async (req, res) => {
    const row = await queryOne('SELECT * FROM table_static WHERE type = ? LIMIT 1', [String(req.params.type)]);
    if (!row) return fail(res, 'Không tìm thấy nội dung', 404);
    return ok(res, { item: decorate(row) });
  })
);

/** POST /api/admin/static — THÊM */
staticRouter.post(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const body = req.body || {};
    if (!body.type) return fail(res, 'Thiếu trường type', 422);
    const payload = {};
    for (const f of STATIC_FIELDS) {
      if (body[f] !== undefined && body[f] !== null) {
        payload[f] = typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    payload.created_at = new Date();
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    const result = await execute(
      `INSERT INTO table_static (${cols.map((c) => `\`${c}\``).join(',')})
       VALUES (${cols.map(() => '?').join(',')})`,
      cols.map((c) => payload[c])
    );
    const created = await queryOne('SELECT * FROM table_static WHERE id = ? LIMIT 1', [result.insertId]);
    return ok(res, { item: decorate(created) }, 'Thêm nội dung thành công');
  })
);

/** PUT /api/admin/static/:id — SỬA */
staticRouter.put(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_static WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);

    const body = req.body || {};
    const payload = {};
    for (const f of STATIC_FIELDS) {
      if (body[f] !== undefined) {
        payload[f] = body[f] === null ? null : typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    if (!Object.keys(payload).length) return fail(res, 'Không có dữ liệu để cập nhật', 422);
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    await execute(
      `UPDATE table_static SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => payload[c]), id]
    );
    const updated = await queryOne('SELECT * FROM table_static WHERE id = ? LIMIT 1', [id]);
    return ok(res, { item: decorate(updated) }, 'Cập nhật nội dung thành công');
  })
);

/** DELETE /api/admin/static/:id — XOÁ */
staticRouter.delete(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_static WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);
    await execute('DELETE FROM table_static WHERE id = ?', [id]);
    return ok(res, { id }, 'Xoá nội dung thành công');
  })
);

/* ================================================================== *
 *  SETTINGS
 * ================================================================== */
export const settingRouter = Router();

/**
 * Cấu trúc thực tế của bảng `table_setting`:
 *   - Các cột cố định: namevi, nameen, namecn, addressvi, addressen, addresscn, type...
 *   - Toàn bộ thông tin liên hệ / SEO / tuỳ chọn nằm trong cột `options` (JSON).
 */
const SETTING_COLUMNS = ['namevi', 'nameen', 'namecn', 'addressvi', 'addressen', 'addresscn'];

const SETTING_RESERVED = new Set([
  ...SETTING_COLUMNS, 'options', 'mastertool', 'headjs', 'bodyjs',
  'analytics', 'type', 'security', 'updated_at', 'created_at', 'id',
]);

/** Đọc options an toàn (JSON hoặc rỗng). */
function parseOptions(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** GET /api/settings — public */
settingRouter.get(
  '/',
  wrap(async (req, res) => {
    const row = await queryOne('SELECT * FROM table_setting LIMIT 1');
    if (!row) return ok(res, { options: {} });
    const options = parseOptions(row.options);
    const { options: _omit, ...rest } = row;
    return ok(res, { ...rest, ...options, options });
  })
);

/** PUT /api/admin/settings — SỬA */
settingRouter.put(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const existing = await queryOne('SELECT id FROM table_setting LIMIT 1');
    if (!existing) return fail(res, 'Chưa có bản ghi cấu hình', 404);

    const body = req.body || {};
    const payload = {};

    // 1) Các cột cố định
    for (const f of SETTING_COLUMNS) {
      if (body[f] !== undefined && body[f] !== null) payload[f] = body[f];
    }
    // Hỗ trợ alias cho UI: name → namevi, address → addressvi
    if (body.name !== undefined && payload.namevi === undefined) payload.namevi = body.name;
    if (body.address !== undefined && payload.addressvi === undefined) payload.addressvi = body.address;

    // 2) Các trường động nằm trong `options`
    const options = parseOptions(existing.options);
    const incoming = body.options && typeof body.options === 'object' ? body.options : {};
    for (const [k, v] of Object.entries(incoming)) options[k] = v;
    // Field phẳng gửi lên (hotline, zalo, title, description, ...) cũng ghi vào options
    for (const [k, v] of Object.entries(body)) {
      if (SETTING_RESERVED.has(k) || k === 'options') continue;
      options[k] = v;
    }
    payload.options = JSON.stringify(options);

    if (!Object.keys(payload).length) return fail(res, 'Không có dữ liệu để cập nhật', 422);
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    await execute(
      `UPDATE table_setting SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => payload[c]), existing.id]
    );
    const updated = await queryOne('SELECT * FROM table_setting WHERE id = ? LIMIT 1', [existing.id]);
    const newOptions = parseOptions(updated.options);
    const { options: _o, ...rest } = updated;
    return ok(res, { ...rest, ...newOptions, options: newOptions }, 'Cập nhật cấu hình thành công');
  })
);

/* ================================================================== *
 *  SEO PAGE
 * ================================================================== */
export const seoRouter = Router();

/**
 * Cấu trúc thực tế của bảng `table_seopage`:
 *   namevi/nameen/namecn, photo, meta, options, type,
 *   titlevi/titleen/titlecn, keywordsvi/keywordsen/keywordscn,
 *   descriptionvi/descriptionen/descriptioncn,
 *   date_created, date_updated
 *
 * Lưu ý: bảng KHÔNG có cột `slugvi` — định danh URL chính là cột `type`.
 */
const SEO_FIELDS = [
  'namevi', 'nameen', 'namecn', 'photo', 'meta', 'options', 'type',
  'titlevi', 'titleen', 'titlecn',
  'keywordsvi', 'keywordsen', 'keywordscn',
  'descriptionvi', 'descriptionen', 'descriptioncn',
];

/**
 * Chuẩn hoá payload từ form admin về đúng tên cột.
 * Frontend gửi `slugvi`, `descvi`, `keywords` — ánh xạ sang cột thật.
 */
function seoPayload(body = {}) {
  const payload = {};
  const map = {
    namevi: 'namevi', nameen: 'nameen', namecn: 'namecn',
    photo: 'photo', meta: 'meta', options: 'options', type: 'type',
    titlevi: 'titlevi', titleen: 'titleen', titlecn: 'titlecn',
    keywordsvi: 'keywordsvi', keywordsen: 'keywordsen', keywordscn: 'keywordscn',
    descriptionvi: 'descriptionvi', descriptionen: 'descriptionen', descriptioncn: 'descriptioncn',
    // alias từ form
    slugvi: 'type',
    descvi: 'descriptionvi', descen: 'descriptionen', desccn: 'descriptioncn',
    keywords: 'keywordsvi', keywordsen: 'keywordsen', keywordscn: 'keywordscn',
  };
  for (const [key, col] of Object.entries(map)) {
    if (body[key] === undefined || body[key] === null) continue;
    if (col === 'options' && typeof body[key] === 'object') {
      payload[col] = JSON.stringify(body[key]);
    } else {
      payload[col] = body[key];
    }
  }
  // Bỏ các cột không có trong schema
  for (const f of SEO_FIELDS) if (!(f in payload)) delete payload[f];
  return payload;
}

/** Bọc record SEO cho frontend (bổ sung slug/descvi/keywords tương thích). */
function seoDecorate(row) {
  if (!row) return row;
  return {
    ...row,
    slugvi: row.type || '',
    descvi: row.descriptionvi || '',
    descen: row.descriptionen || '',
    keywords: row.keywordsvi || '',
    contentvi: row.meta || '',
  };
}

seoRouter.get(
  '/',
  wrap(async (req, res) => {
    const rows = await query('SELECT * FROM table_seopage ORDER BY id ASC');
    return ok(res, rows.map(seoDecorate));
  })
);

seoRouter.post(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const body = req.body || {};
    if (!body.type && !body.slugvi && !body.namevi) {
      return fail(res, 'Thiếu kiểu trang (type) hoặc tên trang', 422);
    }
    const payload = seoPayload(body);
    if (!payload.type && payload.namevi) payload.type = payload.namevi;
    if (!Object.keys(payload).length) return fail(res, 'Không có dữ liệu để lưu', 422);

    const now = Math.floor(Date.now() / 1000);
    payload.date_created = String(now);
    payload.date_updated = String(now);

    const cols = Object.keys(payload);
    const result = await execute(
      `INSERT INTO table_seopage (${cols.map((c) => `\`${c}\``).join(',')})
       VALUES (${cols.map(() => '?').join(',')})`,
      cols.map((c) => payload[c])
    );
    const created = await queryOne('SELECT * FROM table_seopage WHERE id = ? LIMIT 1', [result.insertId]);
    return ok(res, { item: seoDecorate(created) }, 'Thêm trang SEO thành công');
  })
);

seoRouter.put(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_seopage WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);

    const payload = seoPayload(req.body || {});
    if (!Object.keys(payload).length) return fail(res, 'Không có dữ liệu để cập nhật', 422);
    payload.date_updated = String(Math.floor(Date.now() / 1000));

    const cols = Object.keys(payload);
    await execute(
      `UPDATE table_seopage SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => payload[c]), id]
    );
    const updated = await queryOne('SELECT * FROM table_seopage WHERE id = ? LIMIT 1', [id]);
    return ok(res, { item: seoDecorate(updated) }, 'Cập nhật trang SEO thành công');
  })
);

seoRouter.delete(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_seopage WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);
    await execute('DELETE FROM table_seopage WHERE id = ?', [id]);
    return ok(res, { id }, 'Xoá trang SEO thành công');
  })
);

export default router;