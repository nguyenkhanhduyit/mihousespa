/**
 * Tạo / cập nhật tài khoản admin với mật khẩu do chính bcryptjs sinh ra
 * (hash tương thích với verifyPassword trong middleware/auth.js).
 *
 * Dùng:  node scripts/seed-admin.js [username] [password]
 */
import { query, queryOne, execute } from '../src/db.js';
import { hashPassword } from '../src/middleware/auth.js';

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'Admin@2026';
const name = process.argv[4] || 'Quản trị viên';
const email = process.argv[5] || 'admin@mihousespa.com';

const hash = await hashPassword(password);

const existing = await queryOne('SELECT id FROM table_user WHERE username = ? LIMIT 1', [username]);

if (existing) {
  await execute(
    'UPDATE table_user SET password = ?, email = ?, fullname = ? WHERE id = ?',
    [hash, email, name, existing.id]
  );
  console.log(`✓ Đã cập nhật tài khoản "${username}" (id=${existing.id})`);
} else {
  const result = await execute(
    `INSERT INTO table_user (username, password, email, fullname, role, is_show)
     VALUES (?, ?, ?, ?, 1, 1)`,
    [username, hash, email, name]
  );
  console.log(`✓ Đã tạo tài khoản "${username}" (id=${result.insertId})`);
}

console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
process.exit(0);
