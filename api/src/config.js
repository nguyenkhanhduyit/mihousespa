import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = process.env;

export const config = {
  port: Number(env.PORT || 4000),
  nodeEnv: env.NODE_ENV || 'development',

  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || 'root',
    database: env.DB_DATABASE || 'mihousespa',
    prefix: env.DB_PREFIX || 'table_',
  },

  jwt: {
    secret: env.JWT_SECRET || 'mihouse-spa-dev-secret-change-me',
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: env.CLOUDINARY_API_KEY || '',
    apiSecret: env.CLOUDINARY_API_SECRET || '',
    folder: env.CLOUDINARY_FOLDER || 'mihouse-spa',
  },

  // Kích thước thumbnail từ thư mục thumbs/ của bản PHP gốc.
  // Cloudinary sẽ sinh sẵn (eager) các biến thể này để thay thế InterventionController.
  thumbSizes: [
    '26x26x1', '48x48x1', '100x70x2', '120x80x1', '120x120x1', '140x140x1',
    '150x150x1', '190x235x1', '360x295x1', '360x360x1', '420x670x1',
    '480x360x1', '480x710x1', '480x780x1', '500x350x1', '500x690x1',
    '500x800x1', '615x430x1', '768x400x1', '960x940x1', '1024x534x1',
    '1366x712x1', '1600x834x1', '1920x1000x1',
  ],

  corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const table = (name) => `${config.db.prefix}${name}`;

export default config;
