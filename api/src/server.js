import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import config from './config.js';
import { ping } from './db.js';
import { initCloudinary, cloudinaryMode } from './cloudinary.js';

import authRoutes from './routes/auth.js';
import newsRoutes from './routes/news.js';
import photoRoutes from './routes/photo.js';
import galleryRoutes from './routes/gallery.js';
import uploadRoutes from './routes/upload.js';
import contactRoutes from './routes/contact.js';
import { staticRouter, settingRouter, seoRouter } from './routes/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/* --------------------------- Middleware --------------------------- */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin không được phép: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

/* ---------------------- Static media (local) ---------------------- */
/**
 * Phục vụ thư mục `upload/` của bản PHP gốc khi Cloudinary chưa được cấu hình.
 * Khi đã upload ảnh lên Cloudinary, các URL này sẽ không còn được dùng.
 */
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.resolve(__dirname, '../../../mihouse-spa/upload');
if (fs.existsSync(UPLOAD_ROOT)) {
  app.use(
    '/upload',
    express.static(UPLOAD_ROOT, {
      maxAge: '7d',
      immutable: true,
      fallthrough: true,
    })
  );
  console.log(`[static] Phục vụ ảnh gốc tại /upload → ${UPLOAD_ROOT}`);
}

/* ----------------------------- Routes ----------------------------- */
app.get('/api/health', async (req, res) => {
  let db = false;
  try { db = await ping(); } catch { db = false; }
  res.json({
    status: db ? 'success' : 'error',
    message: db ? 'OK' : 'Không kết nối được cơ sở dữ liệu',
    data: {
      service: 'mihouse-spa-api',
      version: '1.0.0',
      db,
      cloudinary: cloudinaryMode(),
      env: config.nodeEnv,
      time: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/photo', photoRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/static', staticRouter);
app.use('/api/settings', settingRouter);
app.use('/api/seo', seoRouter);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

/* ---------------------------- 404 / Error -------------------------- */
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: `API không tồn tại: ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Lỗi máy chủ',
  });
});

/* ------------------------------ Start ------------------------------ */
initCloudinary();

/**
 * Chỉ tự khởi động listener khi chạy trực tiếp (node src/server.js).
 * Khi được import bởi Vercel serverless, listener do Vercel quản lý.
 */
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const server = app.listen(config.port, () => {
    console.log(`\n  Mi House Spa API`);
    console.log(`  → http://localhost:${config.port}/api`);
    console.log(`  → DB: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}`);
    console.log(`  → Cloudinary: ${cloudinaryMode()}\n`);
  });

  const shutdown = (signal) => {
    console.log(`\n[${signal}] Đang tắt server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;