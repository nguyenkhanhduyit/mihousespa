import { Router } from 'express';
import { query, queryOne, execute, inPlaceholders } from '../db.js';
import { ok, fail, wrap, toInt, pagination, like } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ================================================================== *
 *  CONTACT / NEWSLETTER (liên hệ từ frontend)
 * ================================================================== */

/** POST /api/contact — gửi liên hệ (public) */
router.post(
  '/',
  wrap(async (req, res) => {
    const d = req.body?.dataContact || req.body || {};
    if (!d.fullname || !String(d.fullname).trim()) {
      return fail(res, 'Vui lòng nhập họ tên', 422);
    }
    if (!d.phone && !d.email) {
      return fail(res, 'Vui lòng nhập số điện thoại hoặc email', 422);
    }

    const payload = {
      fullname: String(d.fullname).trim(),
      phone: d.phone ? String(d.phone).trim() : '',
      email: d.email ? String(d.email).trim() : '',
      content: d.content ? String(d.content).trim() : '',
      subject: d.subject ? String(d.subject).trim() : 'Liên hệ',
      address: d.address ? String(d.address).trim() : '',
      type: d.type ? String(d.type) : 'lien-he',
      is_show: 1,
      created_at: new Date(),
    };

    const cols = Object.keys(payload);
    const result = await execute(
      `INSERT INTO table_contact (${cols.map((c) => `\`${c}\``).join(',')})
       VALUES (${cols.map(() => '?').join(',')})`,
      cols.map((c) => payload[c])
    );

    return ok(res, { id: result.insertId }, 'Cảm ơn bạn, chúng tôi đã nhận được thông tin liên hệ.');
  })
);

/* ================================================================== *
 *  ADMIN — xem / xoá liên hệ
 * ================================================================== */

router.get(
  '/admin/list',
  requireAuth,
  wrap(async (req, res) => {
    const { page, limit, offset } = pagination(req, 20);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : null;
    const where = keyword ? 'WHERE fullname LIKE ? OR email LIKE ? OR phone LIKE ?' : '';
    const params = keyword ? [like(keyword), like(keyword), like(keyword)] : [];

    const totalRow = await queryOne(`SELECT COUNT(*) AS c FROM table_contact ${where}`, params);
    const rows = await query(
      `SELECT * FROM table_contact ${where} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return ok(res, {
      items: rows,
      total: toInt(totalRow?.c, 0),
      page, limit,
      totalPages: Math.ceil(toInt(totalRow?.c, 0) / limit) || 1,
    });
  })
);

router.delete(
  '/admin/:id',
  requireAuth,
  wrap(async (req, res) => {
    const id = toInt(req.params.id);
    const existing = await queryOne('SELECT id FROM table_contact WHERE id = ? LIMIT 1', [id]);
    if (!existing) return fail(res, 'Không tìm thấy bản ghi', 404);
    await execute('DELETE FROM table_contact WHERE id = ?', [id]);
    return ok(res, { id }, 'Xoá thành công');
  })
);

router.post(
  '/admin/delete-many',
  requireAuth,
  wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((i) => toInt(i)).filter(Boolean) : [];
    if (!ids.length) return fail(res, 'Vui lòng chọn ít nhất một mục để xoá', 422);
    await execute(`DELETE FROM table_contact WHERE id IN (${inPlaceholders(ids)})`, ids);
    return ok(res, { count: ids.length }, `Đã xoá ${ids.length} bản ghi`);
  })
);

export default router;