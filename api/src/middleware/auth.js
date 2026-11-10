import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { queryOne } from '../db.js';

/**
 * NASANI dùng BcryptHasher gắn với `app.secretkey`, nên hash trong DB
 * được tạo bằng bcrypt với secret prefix. Ở đây ta dùng bcryptjs thuần —
 * nếu hash DB không verify được (do secret khác), ta vẫn hỗ trợ đăng nhập
 * bằng cách dùng hash do chính script `seed-admin` sinh ra.
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  try {
    if (await bcrypt.compare(plain, hash)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

/** Lấy user theo id (đã loại bỏ field nhạy cảm). */
export async function findUserById(id) {
  const row = await queryOne(
    'SELECT id, username, email, fullname, role, is_show FROM table_user WHERE id = ? LIMIT 1',
    [id]
  );
  return row;
}

/**
 * Xác thực request admin.
 * - Header: Authorization: Bearer <token>  hoặc  x-admin-token: <token>
 */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token =
    (header.startsWith('Bearer ') ? header.slice(7) : header) ||
    req.get('x-admin-token') ||
    req.query?.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Không tìm thấy tài khoản' });
  }
  if (String(user.is_show) === '0') {
    return res.status(403).json({ status: 'error', message: 'Tài khoản đã bị khoá' });
  }

  req.user = user;
  req.token = token;
  return next();
}

export default { hashPassword, verifyPassword, signToken, verifyToken, findUserById, requireAuth };
