/**
 * routes/gallery.js — API tổng hợp ảnh gallery.
 *
 * Dữ liệu ảnh trong hệ thống cũ nằm ở HAI bảng:
 *   - `table_news` với type: album-anh, thu-vien-anh, khong-gian, album-gioi-thieu, video, nail-hottrend
 *   - `table_photo` với type: menu, banner, slideshow, logo, ...
 *
 * Endpoint này gộp cả hai nguồn theo "album" (nhóm) để frontend
 * hiển thị đầy đủ ảnh cho mọi trang gallery.
 */
import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { ok, fail, wrap, toInt, pagination, like } from '../helpers.js';
import { buildUrl } from '../cloudinary.js';

const router = Router();

/** Nhóm album → các type trong table_news tương ứng. */
export const ALBUM_GROUPS = {
  'album-anh': ['album-anh', 'thu-vien-anh'],
  'khong-gian': ['khong-gian', 'album-gioi-thieu'],
  'nail-hottrend': ['nail-hottrend', 'video'],
  'menu': ['menu', 'banner', 'slideshow', 'logo'],
};

/** Ngược lại: type của table_photo ứng với nhóm nào. */
const PHOTO_TYPE_GROUPS = {
  'album-anh': ['album', 'thu-vien-anh'],
  'khong-gian': ['khong-gian'],
  'nail-hottrend': ['nail-hottrend'],
  menu: ['menu', 'banner', 'slideshow', 'logo', 'favicon', 'brands', 'mang-xa-hoi', 'other'],
};

/** Chuẩn hoá record để frontend dùng chung một format. */
function decorate(row, source) {
  if (!row) return row;
  const out = { ...row, source };
  if (row.photo) {
    out.photo_url = buildUrl(row.photo, '480x480x1');
    out.photo_original = buildUrl(row.photo, null);
    out.photo_thumbs = {
      small: buildUrl(row.photo, '120x80x1'),
      medium: buildUrl(row.photo, '360x360x1'),
      large: buildUrl(row.photo, '960x940x1'),
    };
  }
  return out;
}

/** Lấy danh sách nhóm album kèm số lượng ảnh. */
router.get(
  '/groups',
  wrap(async (req, res) => {
    const groups = [];

    // Nhóm từ table_news
    const newsRows = await query(
      `SELECT type, COUNT(*) AS c FROM table_news
        WHERE type IN ('album-anh','thu-vien-anh','khong-gian','album-gioi-thieu','nail-hottrend','video')
        GROUP BY type`
    );
    const newsCount = {};
    newsRows.forEach((r) => {
      newsCount[r.type] = toInt(r.c, 0);
    });

    // Nhóm từ table_photo
    const photoRows = await query(
      'SELECT type, COUNT(*) AS c FROM table_photo GROUP BY type'
    );
    const photoCount = {};
    photoRows.forEach((r) => {
      photoCount[r.type] = toInt(r.c, 0);
    });

    Object.entries(ALBUM_GROUPS).forEach(([group, types]) => {
      const c = types.reduce((sum, t) => sum + (newsCount[t] || 0), 0);
      if (c > 0) groups.push({ group, label: group, source: 'news', count: c });
    });

    Object.entries(photoCount).forEach(([type, c]) => {
      const group = Object.keys(PHOTO_TYPE_GROUPS).find((g) => PHOTO_TYPE_GROUPS[g].includes(type));
      if (!group) return;
      const exist = groups.find((x) => x.group === group);
      if (exist) exist.count += c;
      else groups.push({ group, label: group, source: 'photo', count: c });
    });

    return ok(res, groups);
  })
);

/**
 * GET /api/gallery?album=album-anh&page=1&limit=24
 * Trả về ảnh gộp từ table_news và table_photo.
 */
router.get(
  '/',
  wrap(async (req, res) => {
    const { page, limit, offset } = pagination(req, 24);
    const album = req.query.album ? String(req.query.album) : 'album-anh';
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : null;

    const items = [];

    /* ---- 1. Ảnh từ table_news ---- */
    const newsTypes = ALBUM_GROUPS[album] || [album];
    const ph = newsTypes.map(() => '?').join(', ');

    const newsWhere = [`type IN (${ph})`];
    const newsParams = [...newsTypes];
    if (keyword) {
      newsWhere.push('(namevi LIKE ? OR descvi LIKE ?)');
      newsParams.push(like(keyword), like(keyword));
    }

    const newsRows = await query(
      `SELECT id, namevi, nameen, descvi, descen, photo, type, link, slugvi, numb
         FROM table_news
        WHERE ${newsWhere.join(' AND ')}
        ORDER BY numb ASC, id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      newsParams
    );
    newsRows.forEach((r) => items.push(decorate(r, 'news')));

    /* ---- 2. Ảnh từ table_photo (chỉ khi nhóm có ánh xạ) ---- */
    const photoTypes = PHOTO_TYPE_GROUPS[album];
    if (photoTypes?.length) {
      const pph = photoTypes.map(() => '?').join(', ');
      const pWhere = [`type IN (${pph})`];
      const pParams = [...photoTypes];
      if (keyword) {
        pWhere.push('(namevi LIKE ? OR nameen LIKE ?)');
        pParams.push(like(keyword), like(keyword));
      }
      const photoRows = await query(
        `SELECT id, namevi, nameen, descvi, descen, photo, type, link, numb
           FROM table_photo
          WHERE ${pWhere.join(' AND ')}
          ORDER BY numb ASC, id DESC
          LIMIT ${limit} OFFSET ${offset}`,
        pParams
      );
      photoRows.forEach((r) => items.push(decorate(r, 'photo')));
    }

    /* ---- 3. Tổng số ---- */
    const totalNews = await queryOne(
      `SELECT COUNT(*) AS c FROM table_news WHERE type IN (${ph})`,
      newsTypes
    );
    let total = toInt(totalNews?.c, 0);
    if (photoTypes?.length) {
      const pph2 = photoTypes.map(() => '?').join(', ');
      const totalPhoto = await queryOne(
        `SELECT COUNT(*) AS c FROM table_photo WHERE type IN (${pph2})`,
        photoTypes
      );
      total += toInt(totalPhoto?.c, 0);
    }

    return ok(res, {
      items,
      total,
      page,
      limit,
      album,
      totalPages: Math.ceil(total / limit) || 1,
    });
  })
);

export default router;
