import { query, closePool } from "../src/db.js";
const n = await query("SELECT type, COUNT(*) c FROM table_news GROUP BY type ORDER BY c DESC");
console.log("=== table_news types ===");
n.forEach(r => console.log(`  ${String(r.type).padEnd(18)} ${r.c}`));
const p = await query("SELECT type, COUNT(*) c FROM table_photo GROUP BY type ORDER BY c DESC");
console.log("=== table_photo types ===");
p.forEach(r => console.log(`  ${String(r.type).padEnd(18)} ${r.c}`));
await closePool();
