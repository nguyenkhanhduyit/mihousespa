import { query, closePool } from "../src/db.js";
for (const t of ["album-anh","thu-vien-anh","khong-gian","album-gioi-thieu","dich-vu"]) {
  const rows = await query("SELECT id,namevi,photo,type,com,link FROM table_news WHERE type=? LIMIT 4", [t]);
  console.log(`=== ${t} (${rows.length}) ===`);
  rows.forEach(r => console.log(`  id=${r.id} photo=${r.photo} com=${r.com} link=${r.link} | ${r.namevi}`));
}
await closePool();
