# Mi House Spa — React + Cloudinary

Dự án chuyển đổi từ **NASANI CMS v8.5 (PHP 8.5 / MySQL / ionCube)** sang **React 18 + Node.js/Express + Cloudinary**, sẵn sàng deploy lên **GitHub → Vercel**.

---

## 1. Cấu trúc thư mục

```
mihouse-react/
├── api/                    # Backend REST API (Node.js + Express + MySQL + Cloudinary)
│   ├── api/index.js        # Handler cho Vercel Serverless Function
│   ├── scripts/
│   │   ├── seed-admin.js       # Tạo tài khoản admin
│   │   ├── migrate-images.js   # Migration ảnh → Cloudinary
│   │   └── test-api.js         # Bộ test API tự động
│   ├── src/
│   │   ├── server.js       # Điểm vào Express
│   │   ├── config.js       # Cấu hình tập trung
│   │   ├── db.js           # Pool mysql2
│   │   ├── cloudinary.js   # Upload + transform ảnh
│   │   ├── helpers.js      # ok/fail/wrap/slugify
│   │   ├── middleware/auth.js
│   │   └── routes/         # auth, news, photo, content, upload, contact
│   └── vercel.json
│
└── web/                    # Frontend React (Vite + React Router + Tailwind)
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx         # Routing
    │   ├── api/client.js   # API client + token management
    │   ├── components/     # Header, Footer, Modal, Button, ImagePicker, BookingModal
    │   ├── pages/          # Home, NewsPages, Gallery
    │   ├── admin/          # AdminApp, AdminLogin, AdminLayout, Dashboard, các Manager
    │   ├── hooks/          # useAuth, useFetch
    │   └── styles/index.css
    └── vercel.json
```

---

## 2. Chạy ở môi trường local

### Yêu cầu
- Node.js ≥ 18 (khuyến nghị 20/22)
- MySQL 8.0 với database `mihousespa` (đã import từ `database.sql` của bản PHP gốc)

### Bước 1 — Khởi động API

```bash
cd api
npm install
cp .env.example .env      # Windows: copy .env.example .env
# Sửa .env: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET
npm run dev                # http://localhost:4000/api
```

### Bước 2 — Tạo tài khoản admin

```bash
node scripts/seed-admin.js admin "Admin@2026"
```

### Bước 3 — Migration ảnh (chỉ chạy 1 lần)

```bash
# Xem trước (không ghi DB)
node scripts/migrate-images.js --dry-run

# Chuẩn hoá đường dẫn ảnh local (bản PHP lưu path KHÔNG có extension)
node scripts/migrate-images.js --normalize

# Upload thật lên Cloudinary (cần đã điền CLOUDINARY_* trong .env)
node scripts/migrate-images.js
```

### Bước 4 — Khởi động web

```bash
cd ../web
npm install
npm run dev                # http://localhost:5173
```

> Vite đã cấu hình proxy `/api` và `/upload` → `http://127.0.0.1:4000`.

### Bước 5 — Kiểm thử API

```bash
cd ../api
node scripts/test-api.js
```

---

## 3. Cấu hình Cloudinary

Lấy thông tin tại [console.cloudinary.com/settings/api-keys](https://console.cloudinary.com/settings/api-keys), điền vào `api/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=mihouse-spa
```

**Khi chưa cấu hình**: API tự động chuyển sang chế độ **LOCAL** — ảnh vẫn hiển thị từ thư mục `upload/` của bản PHP gốc (đã chuẩn hoá path), nên mọi tính năng vẫn chạy được để test.

**Khi đã cấu hình**:
- Upload mới từ admin → lưu `public_id` vào DB
- 24 kích thước thumbnail (kế thừa từ `thumbs/` bản PHP) được **sinh sẵn (eager)** ngay lúc upload → thay thế hoàn toàn cơ chế sinh ảnh runtime của `InterventionController`
- Xoá ảnh cũ: `node scripts/migrate-images.js` sẽ tự upload và cập nhật DB

---

## 4. Deploy lên Vercel

### Cấu trúc repo GitHub đề xuất

```
mihouse-react/            ← root repo
├── api/                   ← Vercel Project #1 (Root Directory: api)
└── web/                   ← Vercel Project #2 (Root Directory: web)
```

### Project 1 — API (Serverless)

1. Vercel Dashboard → **Add New… → Project** → chọn repo → **Root Directory: `api`**
2. Framework Preset: **Other**
3. Build Command: (để trống — `vercel.json` đã khai báo `@vercel/node`)
4. **Environment Variables**:

| Key | Value |
|---|---|
| `DB_HOST` | host MySQL của bạn |
| `DB_PORT` | `3306` |
| `DB_USERNAME` | user MySQL |
| `DB_PASSWORD` | mật khẩu |
| `DB_DATABASE` | `mihousespa` |
| `DB_PREFIX` | `table_` |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài |
| `CLOUDINARY_CLOUD_NAME` | cloud name |
| `CLOUDINARY_API_KEY` | api key |
| `CLOUDINARY_API_SECRET` | api secret |
| `CLOUDINARY_FOLDER` | `mihouse-spa` |
| `CORS_ORIGINS` | domain của web, vd `https://mihousespa.vercel.app` |

> **Lưu ý MySQL**: Vercel không có MySQL sẵn. Dùng MySQL trên VPS/Railway/PlanetScale/Aiven, hoặc chuyển sang **PlanetScale** (MySQL-compatible) để có connection string dạng `mysql://...`.

### Project 2 — Web (Static)

1. Vercel Dashboard → **Add New… → Project** → chọn cùng repo → **Root Directory: `web`**
2. Framework Preset: **Vite**
3. Build Command: `npm run build` · Output Directory: `dist`
4. **Environment Variables**:

| Key | Value |
|---|---|
| `VITE_API_BASE` | `https://<api-domain-của-bạn>/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | cloud name (dùng để dựng URL transform) |

> `VITE_*` được **inline lúc build** → phải set trước khi deploy, nếu đổi thì redeploy.

### Sau khi deploy

- Website: `https://<web-domain>`
- Admin: `https://<web-domain>/admin/login`

---

## 5. Danh sách API

### Public
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | Kiểm tra trạng thái DB & Cloudinary |
| GET | `/api/news?type=&page=&limit=&keyword=` | Danh sách bài viết |
| GET | `/api/news/slug/:slug` | Chi tiết bài viết |
| GET | `/api/photo?type=&limit=` | Danh sách ảnh |
| GET | `/api/photo/types` | Các loại ảnh có trong DB |
| GET | `/api/static?type=` | Trang tĩnh |
| GET | `/api/static/:type` | Trang tĩnh theo type |
| GET | `/api/settings` | Cấu hình website |
| GET | `/api/seo` | Danh sách trang SEO |
| POST | `/api/contact` | Gửi liên hệ / đặt lịch |

### Admin (cần `Authorization: Bearer <token>`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Thông tin user hiện tại |
| POST | `/api/auth/change-password` | Đổi mật khẩu |
| GET/POST/PUT/DELETE | `/api/news/admin[/list/:id]` | **CRUD bài viết** |
| POST | `/api/news/admin/delete-many` | Xoá nhiều bài viết |
| GET/POST/PUT/DELETE | `/api/photo/admin[/list/:id]` | **CRUD ảnh** |
| PUT | `/api/photo/admin/reorder` | Đổi thứ tự ảnh |
| GET/POST/PUT/DELETE | `/api/static/admin[/list/:id]` | **CRUD trang tĩnh** |
| PUT | `/api/settings/admin` | **Sửa cấu hình** |
| GET/POST/PUT/DELETE | `/api/seo/admin[/:id]` | **CRUD trang SEO** |
| GET/DELETE | `/api/contact/admin/list/:id` | Xem & xoá liên hệ |
| GET | `/api/upload/signature` | Chữ ký upload Cloudinary |
| POST | `/api/upload` | Upload ảnh (multipart) |
| DELETE | `/api/upload/:publicId` | Xoá ảnh trên Cloudinary |
| GET | `/api/upload/gallery` | Thư viện ảnh |

---

## 6. Đối chiếu với bản PHP gốc

| Chức năng PHP gốc | React mới | Ghi chú |
|---|---|---|
| `table_news` (82 bản ghi) | `/api/news` + admin NewsManager | Thêm/Sửa/Xoá đã test end-to-end |
| `table_photo` (22) | `/api/photo` + admin PhotoManager | Grid + Table view |
| `table_static` (5) | `/api/static` + admin StaticManager | |
| `table_setting` (1) | `/api/settings` + admin SettingsManager | |
| `table_seopage` (9) | `/api/seo` + admin SeoManager | |
| `table_contact` | `/api/contact` + admin ContactManager | Nhận từ form Liên hệ & Đặt lịch |
| `table_user` | `/api/auth` | JWT + bcrypt |
| `InterventionController` (24 size thumb) | `cloudinary.js` eager transform | Sinh sẵn lúc upload |
| `thumbs/` (1.211 file thiếu) | Không cần | Cloudinary CDN tự sinh |
| Blade `popup1.blade.php` (route `/popup` không tồn tại) | Đã loại bỏ | Dùng BookingModal gọi `/api/contact` |
| `assets/vite/app.js` (rỗng) | `web/src/` | Vite build thật |

---

## 7. Tài khoản mặc định (dev)

```
Username: admin
Password: Admin@2026
```

> **Bắt buộc đổi mật khẩu trước khi deploy production.** Dùng script:
> ```bash
> node scripts/seed-admin.js admin "MatKhauMoi2026"
> ```
> hoặc đổi trong Admin → Cài đặt.

---

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân & cách sửa |
|---|---|
| Ảnh không hiện | Chạy `node scripts/migrate-images.js --normalize` để chuẩn hoá path |
| Ảnh 404 sau khi deploy | Thiếu `UPLOAD_ROOT` hoặc ảnh chưa upload lên Cloudinary → chạy script migrate (bản cloudinary) |
| API 401 trên admin | Token hết hạn → đăng nhập lại; kiểm tra `JWT_SECRET` giống nhau giữa các instance |
| CORS error | Thêm domain web vào `CORS_ORIGINS` |
| Upload lỗi 503 | Thiếu `CLOUDINARY_*` trong env → điền và redeploy |
| MySQL timeout trên Vercel | Dùng connection pool nhỏ (hiện là 10) hoặc chuyển sang PlanetScale |
