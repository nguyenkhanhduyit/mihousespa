import { Router } from 'express';
import { query, queryOne, execute, inPlaceholders } from '../db.js';
import { ok, fail, wrap, toInt, pagination, like } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';
import { buildUrl } from '../cloudinary.js';

const router = Router();

const PHOTO_FIELDS = [
  'photo', 'contenten', 'contentvi', 'descen', 'descvi', 'nameen', 'namevi',
  'link', 'link_video', 'keyword', 'backlink', 'redirectvi', 'redirecten',
  'redirectcn', 'options', 'type', 'com', 'numb', 'parent',
  'link_redirect', 'redirect', 'contentcn', 'desccn', 'namecn',
];

function decorate(row) {
  if (!row) return row;
  const out = { ...row };
  if (row.photo) {
    out.photo_url = buildUrl(row.photo, '360x360x1');
    out.photo_original = buildUrl(row.photo, null);
    out.photo_thumbs = {
      small: buildUrl(row.photo, '120x80x1'),
      medium: buildUrl(row.photo, '360x360x1'),
      large: buildUrl(row.photo, '960x940x1'),
    };
  }
  return out;
}

/** GET /api/photo — public list theo type */
router.get(
  '/',
  wrap(async (req, res) => {
    const { page, limit, offset } = pagination(req, 24);
    const type = req.query.type ? String(req.query.type) : null;
    const where = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];

    const totalRow = await queryOne(`SELECT COUNT(*) AS c FROM table_photo ${where}`, params);
    const rows = await query(
      `SELECT * FROM table_photo ${where} ORDER BY numb ASC, id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return ok(res, {
      items: rows.map(decorate),
      total: toInt(totalRow?.c, 0),
      page, limit,
      totalPages: Math.ceil(toInt(totalRow?.c, 0) / limit) || 1,
    });
  })
);

/** GET /api/photo/types — danh sách type hiện có */
router.get(
  '/types',
  wrap(async (req, res) => {
    const rows = await query(
      'SELECT type, COUNT(*) AS c FROM table_photo GROUP BY type ORDER BY type ASC'
    );
    return ok(res, rows);
  })
);

/* ------------------------- ADMIN ------------------------- */

/** GET /api/admin/photo/list */
router.get(
  '/admin/list',
  requireAuth,
  wrap(async (req, res) => {
    const { page, limit, offset } = pagination(req, 20);
    const type = req.query.type ? String(req.query.type) : null;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : null;

    const where = [];
    const params = [];
    if (type) { where.push('type = ?'); params.push(type); }
    if (keyword) { where.push('(namevi LIKE ? OR nameen LIKE ?)'); params.push(like(keyword), like(keyword)); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await queryOne(`SELECT COUNT(*) AS c FROM table_photo ${whereSql}`, params);
    const rows = await query(
      `SELECT * FROM table_photo ${whereSql} ORDER BY numb ASC, id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return ok(res, {
      items: rows.map(decorate),
      total: toInt(totalRow?.c, 0),
      page, limit,
      totalPages: Math.ceil(toInt(totalRow?.c, 0) / limit) || 1,
    });
  })
);

/** PUT /api/admin/photo/reorder — đổi thứ tự (numb)
 *  Đăng ký TRƯỚC `/admin/:id` để không bị shadow. */
router.put(
  '/admin/reorder',
  requireAuth,
  wrap(async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return fail(res, 'Không có dữ liệu để sắp xếp', 422);
    for (const it of items) {
      await execute('UPDATE table_photo SET numb = ? WHERE id = ?', [toInt(it.numb), toInt(it.id)]);
    }
    return ok(res, { count: items.length }, 'Cập nhật thứ tự thành công');
  })
);

/** GET /api/admin/photo/:id */
router.get(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const row = await queryOne('SELECT * FROM table_photo WHERE id = ? LIMIT 1', [toInt(req.params.id)]);
    if (!row) return fail(res, 'Không tìm thấy bản ghi', 404);
    return ok(res, { item: decorate(row) });
  })
);

/** POST /api/admin/photo — THÊM */
router.post(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const body = req.body || {};
    if (!body.namevi || !String(body.namevi).trim()) {
      return fail(res, 'Vui lòng nhập tên (namevi)', 422);
    }
    const payload = {};
    for (const f of PHOTO_FIELDS) {
      if (body[f] !== undefined && body[f] !== null) {
        payload[f] = typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    payload.namevi = String(body.namevi).trim();
    payload.type = body.type || 'menu';
    payload.com = body.com || 'photo';
    payload.created_at = new Date();
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    const result = await execute(
      `INSERT INTO table_photo (${cols.map((c) => `\`${c}\``).join(',')})
       VALUES (${cols.map(() => '?').join(',')})`,
      cols.map((c) => payload[c])
    );
    const created = await queryOne('SELECT * FROM table_photo WHERE id = ? LIMIT 1', [result.insertId]);
    return ok(res, { item: decorate(created) }, 'Thêm ảnh thành công');
  })
);

/** PUT /api/admin/photo/:id — SỬA */
router.put(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_photo WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);

    const body = req.body || {};
    const payload = {};
    for (const f of PHOTO_FIELDS) {
      if (body[f] !== undefined) {
        payload[f] = body[f] === null ? null : typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    if (!Object.keys(payload).length) return fail(res, 'Không có dữ liệu để cập nhật', 422);
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    await execute(
      `UPDATE table_photo SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => payload[c]), id]
    );
    const updated = await queryOne('SELECT * FROM table_photo WHERE id = ? LIMIT 1', [id]);
    return ok(res, { item: decorate(updated) }, 'Cập nhật ảnh thành công');
  })
);

/** DELETE /api/admin/photo/:id — XOÁ */
router.delete(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_photo WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);
    await execute('DELETE FROM table_photo WHERE id = ?', [id]);
    return ok(res, { id }, 'Xoá ảnh thành công');
  })
);

/** POST /api/admin/photo/delete-many */
router.post(
  '/admin/delete-many',
  requireAuth,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((i) => toInt(i)).filter(Boolean) : [];
    if (!ids.length) return fail(res, 'Vui lòng chọn ít nhất một mục để xoá', 422);
    await execute(`DELETE FROM table_photo WHERE id IN (${inPlaceholders(ids)})`, ids);
    return ok(res, { count: ids.length }, `Đã xoá ${ids.length} ảnh`);
  })
);

export default router;