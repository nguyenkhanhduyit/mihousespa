import config from './config.js';

/** Chuẩn hoá response API: { status: 'success'|'error', data|message } */
export const ok = (res, data = null, message = '') =>
  res.json({ status: 'success', message, data });

export const fail = (res, message = 'Có lỗi xảy ra', code = 400, extra = {}) =>
  res.status(code).json({ status: 'error', message, ...extra });

/** Bọc handler async để bắt lỗi tập trung. */
export const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`[api] ${req.method} ${req.originalUrl} →`, err);
    if (res.headersSent) return;
    const isDuplicate = err?.code === 'ER_DUP_ENTRY';
    res.status(isDuplicate ? 409 : 500).json({
      status: 'error',
      message: isDuplicate ? 'Dữ liệu đã tồn tại (trùng khóa chính)' : err?.message || 'Lỗi máy chủ',
      detail: process.env.NODE_ENV === 'development' ? String(err?.stack || err) : undefined,
    });
  });
};

/** Parse int an toàn. */
export const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

/** Lấy phân trang từ query. */
export const pagination = (req, defaultLimit = 20) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit, defaultLimit)));
  return { page, limit, offset: (page - 1) * limit };
};

/** Tạo slug từ tiếng Việt. */
export function slugify(text = '') {
  const map = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd', Đ: 'd',
  };
  return String(text)
    .replace(/[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộùúủũụừứửữựỳýỷỹỵđ]/g, (c) => map[c] ?? c)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Escape an toàn cho LIKE */
export const like = (v) => `%${String(v).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export { config };
export default { ok, fail, wrap, toInt, pagination, slugify, like };
