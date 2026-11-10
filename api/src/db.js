import mysql from 'mysql2/promise';
import config, { table } from './config.js';

/**
 * Pool kết nối MySQL.
 * Dùng named placeholder `?` cho VALUES và object placeholder cho IN (?,?,?).
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  dateStrings: ['DATE', 'DATETIME'],
  supportBigNumbers: true,
  bigNumberStrings: false,
});

/** Thực thi SELECT, trả về mảng row. */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Thực thi SELECT, trả về row đầu tiên hoặc null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

/** Thực thi INSERT/UPDATE/DELETE, trả về result (insertId, affectedRows...). */
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/** Thực thi câu lệnh động (không dùng prepared stmt) — dành cho DDL / query đặc biệt. */
export async function raw(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Chạy trong transaction. Callback nhận connection. */
export async function transaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Tạo placeholder cho IN (?, ?, ?) */
export const inPlaceholders = (arr) => arr.map(() => '?').join(', ');

/** Đóng toàn bộ connection pool (dùng khi kết thúc script). */
export async function closePool() {
  try {
    await pool.end();
  } catch {
    /* pool đã đóng */
  }
}

/** Kiểm tra kết nối DB, dùng cho /health */
export async function ping() {
  const row = await queryOne('SELECT 1 AS ok');
  return row?.ok === 1;
}

export { table };
export default { pool, query, queryOne, execute, raw, transaction, inPlaceholders, ping, closePool, table };
