import { query, closePool } from "../src/db.js";
const rows = await query("SELECT id, fullname, phone, type, subject, created_at FROM table_contact ORDER BY id DESC LIMIT 5");
console.log("=== 5 lượt liên hệ mới nhất ===");
rows.forEach(r => console.log(`  id=${r.id} | ${r.fullname} | ${r.phone} | ${r.type} | ${r.subject} | ${r.created_at}`));
await closePool();
