import { Router } from 'express';
import multer from 'multer';
import { query, queryOne, execute } from '../db.js';
import { ok, fail, wrap, toInt } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';
import {
  signedUploadParams,
  uploadBuffer,
  destroy,
  buildUrl,
  isCloudinaryReady,
  cloudinaryMode,
} from '../cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Chỉ cho phép upload tệp ảnh'));
  },
});

/**
 * GET /api/upload/signature
 * Trả về chữ ký để browser upload thẳng lên Cloudinary (bypass server).
 */
router.get(
  '/signature',
  requireAuth,
  wrap(async (req, res) => {
    if (!isCloudinaryReady()) {
      return fail(res, 'Cloudinary chưa được cấu hình (thiếu CLOUDINARY_* trong .env)', 503);
    }
    const params = signedUploadParams(req.body?.folder);
    return ok(res, params);
  })
);

/**
 * POST /api/upload — upload qua server (dùng khi browser không ký được).
 * Trả về public_id để lưu vào DB.
 */
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  wrap(async (req, res) => {
    if (!req.file) return fail(res, 'Không có tệp được tải lên', 422);
    if (!isCloudinaryReady()) {
      return fail(res, 'Cloudinary chưa được cấu hình (thiếu CLOUDINARY_* trong .env)', 503);
    }

    const result = await uploadBuffer(req.file.buffer, {
      filename: req.file.originalname || 'image',
      folder: req.body?.folder,
    });

    return ok(res, {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      thumbs: {
        small: buildUrl(result.public_id, '120x80x1'),
        medium: buildUrl(result.public_id, '360x360x1'),
        large: buildUrl(result.public_id, '960x940x1'),
      },
    }, 'Tải ảnh lên thành công');
  })
);

/**
 * DELETE /api/upload/:publicId — xoá ảnh trên Cloudinary.
 * publicId base64url để tránh vấn đề ký tự '/' trong path.
 */
router.delete(
  '/:publicId',
  requireAuth,
  wrap(async (req, res) => {
    const encoded = String(req.params.publicId);
    let publicId = encoded;
    try {
      publicId = Buffer.from(encoded, 'base64url').toString('utf8');
    } catch { /* giữ nguyên nếu không phải base64 */ }

    if (!isCloudinaryReady()) {
      return fail(res, 'Cloudinary chưa được cấu hình', 503);
    }
    const result = await destroy(publicId);
    return ok(res, { result }, 'Xoá ảnh thành công');
  })
);

/**
 * GET /api/upload/gallery — thư viện ảnh (danh sách public_id đã lưu).
 * Vì Cloudinary không lưu danh sách media theo app, ta đọc từ DB các bảng
 * có cột `photo` để dựng gallery.
 */
router.get(
  '/gallery',
  requireAuth,
  wrap(async (req, res) => {
    const rows = await query(
      `SELECT photo, namevi AS name, type, 'news' AS source, id FROM table_news WHERE photo IS NOT NULL AND photo <> ''
       UNION ALL
       SELECT photo, namevi, type, 'photo', id FROM table_photo WHERE photo IS NOT NULL AND photo <> ''
       UNION ALL
       SELECT photo, namevi, type, 'static', id FROM table_static WHERE photo IS NOT NULL AND photo <> ''
       ORDER BY source, id`
    );

    const seen = new Set();
    const items = [];
    for (const r of rows) {
      if (seen.has(r.photo)) continue;
      seen.add(r.photo);
      items.push({
        photo: r.photo,
        name: r.name,
        type: r.type,
        source: r.source,
        id: r.id,
        url: buildUrl(r.photo, '360x360x1'),
        original: buildUrl(r.photo, null),
      });
    }
    return ok(res, { items, total: items.length, mode: cloudinaryMode() });
  })
);

export default router;