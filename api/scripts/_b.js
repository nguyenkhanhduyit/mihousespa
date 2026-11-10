import { query, closePool } from "../src/db.js";
console.log("=== table_photo banner/slideshow ===");
const b = await query("SELECT id,namevi,photo,type FROM table_photo WHERE type IN ('banner','slideshow')");
b.forEach(r => console.log(`  id=${r.id} type=${r.type} photo=${r.photo} | ${r.namevi}`));
console.log("=== table_news thu-vien-anh / album-anh ===");
const n = await query("SELECT id,namevi,photo,type FROM table_news WHERE type IN ('thu-vien-anh','album-anh','khong-gian','album-gioi-thieu') LIMIT 12");
n.forEach(r => console.log(`  id=${r.id} type=${r.type} photo=${r.photo} | ${r.namevi}`));
await closePool();
