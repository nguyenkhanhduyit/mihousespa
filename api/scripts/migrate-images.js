/**
 * Migration ảnh: PHP/MySQL → Cloudinary.
 *
 * Bước 1 — Chuẩn hoá đường dẫn:
 *   DB lưu `news/2026/09/10/anh-...` (KHÔNG có extension) trong khi file thật
 *   trên đĩa là `anh-....png`. Script này dò đĩa để tìm extension đúng.
 *
 * Bước 2 — Upload lên Cloudinary (nếu đã cấu hình) hoặc ghi đường dẫn local
 *   có extension vào DB để dùng ngay với bản React.
 *
 * Dùng:
 *   node scripts/migrate-images.js              # chuẩn hoá + upload
 *   node scripts/migrate-images.js --normalize  # chỉ chuẩn hoá đường dẫn local
 *   node scripts/migrate-images.js --dry-run    # xem trước, không ghi DB
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, execute } from '../src/db.js';
import { initCloudinary, isCloudinaryReady, uploadBuffer, buildUrl } from '../src/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.resolve(__dirname, '../../../mihouse-spa/upload');
const DRY_RUN = process.argv.includes('--dry-run');
const NORMALIZE_ONLY = process.argv.includes('--normalize');

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'];

const TABLES = [
  { name: 'table_news', column: 'photo', label: 'news' },
  { name: 'table_photo', column: 'photo', label: 'photo' },
  { name: 'table_static', column: 'photo', label: 'static' },
];

/** Tìm file thật tương ứng với path trong DB (bỏ qua phần mở rộng đã có). */
function resolveOnDisk(dbPath) {
  if (!dbPath) return null;
  const clean = String(dbPath).replace(/^\/+/, '').replace(/^upload\//, '');
  const base = path.join(UPLOAD_ROOT, clean);

  // 1. Path đã có extension
  if (EXTENSIONS.includes(path.extname(base).toLowerCase())) {
    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  }

  // 2. Thử mọi extension phổ biến
  const stem = base.replace(/\.[^./\\]+$/, '');
  for (const ext of EXTENSIONS) {
    const candidate = `${stem}${ext}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }

  // 3. Dò thư mục chứa file, khớp theo tiền tố
  const dir = path.dirname(base);
  const prefix = path.basename(stem);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const hit = files.find((f) => f.startsWith(prefix) && EXTENSIONS.includes(path.extname(f).toLowerCase()));
    if (hit) return path.join(dir, hit);
  }

  return null;
}

/** Đường dẫn public (relative) để web server phục vụ. */
function publicPath(absFile) {
  const rel = path.relative(UPLOAD_ROOT, absFile).replace(/\\/g, '/');
  return `/upload/${rel}`;
}

async function main() {
  initCloudinary();
  const useCloudinary = !NORMALIZE_ONLY && isCloudinaryReady();

  if (!fs.existsSync(UPLOAD_ROOT)) {
    console.error(`✗ Không tìm thấy thư mục upload: ${UPLOAD_ROOT}`);
    console.error('  Đặt biến môi trường UPLOAD_ROOT trỏ tới thư mục upload gốc.');
    process.exit(1);
  }

  console.log(`\nNguồn ảnh : ${UPLOAD_ROOT}`);
  console.log(`Đích      : ${useCloudinary ? 'Cloudinary' : 'đường dẫn local (có extension)'}`);
  console.log(`Chế độ    : ${DRY_RUN ? 'DRY-RUN (không ghi DB)' : 'GHI DB'}\n`);

  const stats = { total: 0, resolved: 0, uploaded: 0, normalized: 0, missing: 0, uploadedIds: new Map() };

  for (const t of TABLES) {
    let rows = [];
    try {
      rows = await query(
        `SELECT id, ${t.column} AS photo FROM ${t.name} WHERE ${t.column} IS NOT NULL AND ${t.column} <> ''`
      );
    } catch (e) {
      console.warn(`  ! Bỏ qua ${t.name}: ${e.message}`);
      continue;
    }

    console.log(`── ${t.name} (${rows.length} bản ghi có ảnh)`);

    for (const row of rows) {
      stats.total++;
      const dbPath = row.photo;

      // Đã là public_id của Cloudinary → giữ nguyên
      if (dbPath.startsWith('mihouse-spa/') || dbPath.startsWith('mihouse-spa/')) {
        continue;
      }
      // Đã là URL tuyệt đối → giữ nguyên
      if (/^https?:\/\//i.test(dbPath)) continue;

      const abs = resolveOnDisk(dbPath);
      if (!abs) {
        stats.missing++;
        if (stats.missing <= 5) {
          console.log(`  · thiếu file: ${dbPath}`);
        }
        continue;
      }
      stats.resolved++;

      if (useCloudinary) {
        // Cache theo file để không upload trùng
        if (stats.uploadedIds.has(abs)) {
          const publicId = stats.uploadedIds.get(abs);
          if (!DRY_RUN) {
            await execute(`UPDATE ${t.name} SET ${t.column} = ? WHERE id = ?`, [publicId, row.id]);
          }
          continue;
        }

        try {
          const buf = fs.readFileSync(abs);
          const rel = path.relative(UPLOAD_ROOT, abs).replace(/\\/g, '/');
          const result = await uploadBuffer(buf, { filename: path.basename(rel) });
          stats.uploadedIds.set(abs, result.public_id);
          stats.uploaded++;
          if (!DRY_RUN) {
            await execute(`UPDATE ${t.name} SET ${t.column} = ? WHERE id = ?`, [result.public_id, row.id]);
          }
          console.log(`  ↑ ${t.label}#${row.id} → ${result.public_id}`);
        } catch (e) {
          console.warn(`  ! Upload lỗi ${t.label}#${row.id}: ${e.message}`);
        }
      } else {
        // Chuẩn hoá: ghi đường dẫn local có extension
        const normalized = publicPath(abs);
        stats.normalized++;
        if (!DRY_RUN) {
          await execute(`UPDATE ${t.name} SET ${t.column} = ? WHERE id = ?`, [normalized, row.id]);
        }
        console.log(`  → ${t.label}#${row.id}: ${dbPath}  ⇒  ${normalized}`);
      }
    }
    console.log('');
  }

  console.log('═'.repeat(56));
  console.log(`Tổng ảnh xử lý : ${stats.total}`);
  console.log(`  Tìm thấy file : ${stats.resolved}`);
  console.log(`  Upload Cloudinary: ${stats.uploaded}`);
  console.log(`  Chuẩn hoá path : ${stats.normalized}`);
  console.log(`  Thiếu file     : ${stats.missing}`);
  console.log('═'.repeat(56));

  if (DRY_RUN) console.log('\n(Dry-run — chưa ghi thay đổi nào vào DB)');
  process.exit(0);
}

main().catch((e) => {
  console.error('Lỗi:', e);
  process.exit(1);
});