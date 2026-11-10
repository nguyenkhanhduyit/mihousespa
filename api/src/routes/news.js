import { Router } from 'express';
import { query, queryOne, execute, transaction, inPlaceholders } from '../db.js';
import { ok, fail, wrap, toInt, pagination, slugify, like } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';
import { buildUrl } from '../cloudinary.js';

const router = Router();

const NEWS_FIELDS = [
  'id_list', 'id_item', 'id_cat', 'id_sub', 'id_parent', 'photo', 'file', 'icon',
  'options', 'slugvi', 'slugen', 'contenten', 'contentvi', 'descen', 'descvi',
  'nameen', 'namevi', 'link', 'numb', 'date_publish', 'type', 'view',
  'options2', 'slugcn', 'contentcn', 'desccn', 'namecn',
];
/** Chuẩn hoá record news trả về client (bổ sung url ảnh đã transform). */
function decorate(row) {
  if (!row) return row;
  const out = { ...row };
  if (row.photo) {
    out.photo_url = buildUrl(row.photo, '480x710x1');
    out.photo_original = buildUrl(row.photo, null);
    out.photo_thumbs = {
      small: buildUrl(row.photo, '120x80x1'),
      medium: buildUrl(row.photo, '360x360x1'),
      large: buildUrl(row.photo, '960x940x1'),
    };
  }
  return out;
}

/* ------------------------------------------------------------------ *
 *  PUBLIC
 * ------------------------------------------------------------------ */

/** GET /api/news — danh sách bài viết (frontend) */
router.get(
  '/',
  wrap(async (req, res) => {
    const { page, limit, offset } = pagination(req, 12);
    const type = req.query.type ? String(req.query.type) : null;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : null;
    const lang = ['vi', 'en', 'cn'].includes(req.query.lang) ? req.query.lang : 'vi';

    const where = [];
    const params = [];

    if (type) {
      where.push('type = ?');
      params.push(type);
    }
    if (keyword) {
      where.push(`(name${lang} LIKE ? OR desc${lang} LIKE ?)`);
      params.push(like(keyword), like(keyword));
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRow = await queryOne(`SELECT COUNT(*) AS c FROM table_news ${whereSql}`, params);

    const rows = await query(
      `SELECT id, type, name${lang} AS name, desc${lang} AS \`desc\`, slug${lang} AS slug,
              photo, numb, date_publish, view, options2
         FROM table_news
         ${whereSql}
        ORDER BY numb ASC, id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return ok(res, {
      items: rows.map(decorate),
      total: toInt(totalRow?.c, 0),
      page,
      limit,
      totalPages: Math.ceil(toInt(totalRow?.c, 0) / limit) || 1,
    });
  })
);

/** GET /api/news/slug/:slug — chi tiết bài viết theo slug */
router.get(
  '/slug/:slug',
  wrap(async (req, res) => {
    const slug = String(req.params.slug).trim();
    const lang = ['vi', 'en', 'cn'].includes(req.query.lang) ? req.query.lang : 'vi';

    const row = await queryOne(
      `SELECT * FROM table_news WHERE slug${lang} = ? OR slugvi = ? LIMIT 1`,
      [slug, slug]
    );
    if (!row) return fail(res, 'Không tìm thấy bài viết', 404);

    const related = await query(
      `SELECT id, type, name${lang} AS name, slug${lang} AS slug, photo
         FROM table_news WHERE type = ? AND id <> ? ORDER BY id DESC LIMIT 6`,
      [row.type, row.id]
    );

    return ok(res, { item: decorate(row), related: related.map(decorate) });
  })
);

/** GET /api/news/:id — chi tiết theo id */
router.get(
  '/:id',
  wrap(async (req, res) => {
    // Bỏ qua các đường dẫn admin (được xử lý ở trên) để không bị shadow
    if (/^admin(\/|$)/.test(String(req.params.id))) {
      return fail(res, 'Không tìm thấy bài viết', 404);
    }
    const row = await queryOne('SELECT * FROM table_news WHERE id = ? LIMIT 1', [toInt(req.params.id)]);
    if (!row) return fail(res, 'Không tìm thấy bài viết', 404);
    return ok(res, { item: decorate(row) });
  })
);

/* ------------------------------------------------------------------ *
 *  ADMIN
 * ------------------------------------------------------------------ */

/** GET /api/admin/news/list — danh sách (có tìm kiếm, lọc type) */
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
    if (keyword) { where.push('(namevi LIKE ? OR slugvi LIKE ?)'); params.push(like(keyword), like(keyword)); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await queryOne(`SELECT COUNT(*) AS c FROM table_news ${whereSql}`, params);
    const rows = await query(
      `SELECT * FROM table_news ${whereSql} ORDER BY numb ASC, id DESC LIMIT ${limit} OFFSET ${offset}`,
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

/** GET /api/admin/news/:id — lấy 1 bản ghi để sửa */
router.get(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const row = await queryOne('SELECT * FROM table_news WHERE id = ? LIMIT 1', [toInt(req.params.id)]);
    if (!row) return fail(res, 'Không tìm thấy bài viết', 404);
    return ok(res, { item: decorate(row) });
  })
);

/** POST /api/admin/news — THÊM */
router.post(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const body = req.body || {};
    if (!body.namevi || !String(body.namevi).trim()) {
      return fail(res, 'Vui lòng nhập tiêu đề (namevi)', 422);
    }

    const payload = {};
    for (const f of NEWS_FIELDS) {
      if (body[f] !== undefined && body[f] !== null) {
        payload[f] = typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    payload.type = body.type || 'tin-tuc';
    payload.namevi = String(body.namevi).trim();
    if (!payload.slugvi) payload.slugvi = slugify(payload.namevi);

    // Kiểm tra slug trùng
    const dup = await queryOne('SELECT id FROM table_news WHERE slugvi = ? LIMIT 1', [payload.slugvi]);
    if (dup) {
      payload.slugvi = `${payload.slugvi}-${Date.now().toString().slice(-5)}`;
    }

    payload.created_at = new Date();
    payload.updated_at = new Date();
    if (!payload.date_publish) payload.date_publish = new Date();

    const cols = Object.keys(payload);
    const vals = cols.map((c) => payload[c]);
    const result = await execute(
      `INSERT INTO table_news (${cols.map((c) => `\`${c}\``).join(',')})
       VALUES (${cols.map(() => '?').join(',')})`,
      vals
    );

    const created = await queryOne('SELECT * FROM table_news WHERE id = ? LIMIT 1', [result.insertId]);
    return ok(res, { item: decorate(created) }, 'Thêm bài viết thành công');
  })
);

/** PUT /api/admin/news/:id — SỬA */
router.put(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT * FROM table_news WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bài viết', 404);

    const body = req.body || {};
    const payload = {};
    for (const f of NEWS_FIELDS) {
      if (body[f] !== undefined) {
        payload[f] = body[f] === null ? null : typeof body[f] === 'object' ? JSON.stringify(body[f]) : body[f];
      }
    }
    if (!Object.keys(payload).length) {
      return fail(res, 'Không có dữ liệu để cập nhật', 422);
    }
    payload.updated_at = new Date();

    const cols = Object.keys(payload);
    await execute(
      `UPDATE table_news SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => payload[c]), id]
    );

    const updated = await queryOne('SELECT * FROM table_news WHERE id = ? LIMIT 1', [id]);
    return ok(res, { item: decorate(updated) }, 'Cập nhật bài viết thành công');
  })
);

/** DELETE /api/admin/news/:id — XOÁ 1 bản ghi */
router.delete(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_news WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bài viết', 404);

    await transaction(async (conn) => {
      // Xoá slug liên quan
      try {
        await conn.execute('DELETE FROM table_slug WHERE id_parent = ? AND model LIKE ?', [id, '%NewsModel']);
      } catch { /* ignore */ }
      await conn.execute('DELETE FROM table_news WHERE id = ?', [id]);
    });

    return ok(res, { id }, 'Xoá bài viết thành công');
  })
);

/** POST /api/admin/news/delete-many — XOÁ nhiều */
router.post(
  '/admin/delete-many',
  requireAuth,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((i) => toInt(i)).filter(Boolean) : [];
    if (!ids.length) return fail(res, 'Vui lòng chọn ít nhất một mục để xoá', 422);

    const ph = inPlaceholders(ids);
    await execute(`DELETE FROM table_news WHERE id IN (${ph})`, ids);

    return ok(res, { count: ids.length }, `Đã xoá ${ids.length} bài viết`);
  })
);

export default router;