import { Router } from 'express';
import { query, queryOne, execute } from '../db.js';
import { ok, fail, wrap } from '../helpers.js';
import { verifyPassword, signToken, findUserById, requireAuth } from '../middleware/auth.js';

const router = Router();

/** POST /api/auth/login — đăng nhập admin */
router.post(
  '/login',
  wrap(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return fail(res, 'Vui lòng nhập tài khoản và mật khẩu', 422);
    }

    const user = await queryOne(
      `SELECT id, username, email, password, fullname, role, is_show
         FROM table_user
        WHERE username = ? OR email = ?
        LIMIT 1`,
      [String(username).trim(), String(username).trim()]
    );

    if (!user) {
      return fail(res, 'Tài khoản hoặc mật khẩu không đúng', 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return fail(res, 'Tài khoản hoặc mật khẩu không đúng', 401);
    }
    if (String(user.is_show) === '0') {
      return fail(res, 'Tài khoản đã bị khoá', 403);
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Ghi log đăng nhập nếu bảng tồn tại
    try {
      await execute(
        'INSERT INTO table_user_log (id_user, username, ip, user_agent, created_at) VALUES (?,?,?,?,NOW())',
        [user.id, user.username, req.ip || '', req.get('user-agent') || '']
      );
    } catch {
      /* bảng log có thể không tồn tại — bỏ qua */
    }

    return ok(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.fullname || user.username,
        role: user.role,
      },
    }, 'Đăng nhập thành công');
  })
);

/** GET /api/auth/me — thông tin user hiện tại */
router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => ok(res, { user: req.user }))
);

/** POST /api/auth/logout */
router.post(
  '/logout',
  requireAuth,
  wrap(async (req, res) => ok(res, null, 'Đã đăng xuất'))
);

/** POST /api/auth/change-password */
router.post(
  '/change-password',
  requireAuth,
  wrap(async (req, res) => {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return fail(res, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới', 422);
    }
    if (String(new_password).length < 6) {
      return fail(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', 422);
    }

    const user = await queryOne('SELECT id, password FROM table_user WHERE id = ? LIMIT 1', [req.user.id]);
    const valid = await verifyPassword(current_password, user?.password);
    if (!valid) return fail(res, 'Mật khẩu hiện tại không đúng', 401);

    const { hashPassword } = await import('../middleware/auth.js');
    const hash = await hashPassword(new_password);
    await execute('UPDATE table_user SET password = ? WHERE id = ?', [hash, req.user.id]);

    return ok(res, null, 'Đổi mật khẩu thành công');
  })
);

/** GET /api/auth/users — danh sách user (admin) */
router.get(
  '/users',
  requireAuth,
  wrap(async (req, res) => {
    const users = await query(
      'SELECT id, username, email, fullname, role, is_show, created_at FROM table_user ORDER BY id ASC'
    );
    return ok(res, users);
  })
);

export default router;
