import { query, closePool } from "../src/db.js";
const t = process.argv[2];
const rows = await query(`SHOW COLUMNS FROM ${t}`);
console.log("=== " + t + " ===");
rows.forEach(r => console.log(`  ${r.Field.padEnd(22)} ${r.Type}`));
await closePool();
