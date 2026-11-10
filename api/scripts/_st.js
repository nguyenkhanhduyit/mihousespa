import { query, closePool } from "../src/db.js";
const rows = await query("SELECT id, type, namevi, slugvi, is_show, LENGTH(contentvi) clen, LENGTH(descvi) dlen, photo FROM table_static ORDER BY id");
console.log("=== table_static ===");
rows.forEach(r => console.log(`  id=${r.id} type=${r.type} show=${r.is_show} name="${(r.namevi||'').slice(0,28)}" slug=${r.slugvi} contentLen=${r.clen} descLen=${r.dlen} photo=${r.photo||'-'}`));
await closePool();
