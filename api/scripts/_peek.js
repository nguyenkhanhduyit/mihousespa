import { queryOne, closePool } from "../src/db.js";
const s = await queryOne("SELECT * FROM table_setting LIMIT 1");
console.log("=== table_setting row ===");
for (const [k,v] of Object.entries(s)) {
  const vs = typeof v === "string" ? v : JSON.stringify(v);
  console.log(`  ${k}: ${vs === null ? "null" : String(vs).slice(0,600)}`);
}
const p = await queryOne("SELECT * FROM table_seopage LIMIT 1");
console.log("=== table_seopage row ===");
for (const [k,v] of Object.entries(p)) {
  const vs = typeof v === "string" ? v : JSON.stringify(v);
  console.log(`  ${k}: ${vs === null ? "null" : String(vs).slice(0,300)}`);
}
const c = await queryOne("SELECT COUNT(*) c FROM table_seopage");
console.log("seopage count:", c.c);
await closePool();
