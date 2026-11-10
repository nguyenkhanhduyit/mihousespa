import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';

/**
 * Trạng thái Cloudinary:
 *  - 'ready'  : đã cấu hình đầy đủ, upload thật
 *  - 'local'  : chưa có credentials → dùng bộ nhớ tạm / URL nội bộ
 */
let mode = 'local';

export function initCloudinary() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    mode = 'local';
    console.warn(
      '[cloudinary] Thiếu CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET — chuyển sang chế độ LOCAL (ảnh giữ nguyên trong DB).'
    );
    return mode;
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  mode = 'ready';
  console.log(`[cloudinary] Sẵn sàng (cloud: ${cloudName}, folder: ${config.cloudinary.folder})`);
  return mode;
}

export const cloudinaryMode = () => mode;
export const isCloudinaryReady = () => mode === 'ready';

/**
 * Chuyển kích thước "WxHxZ" của NASANI sang tham số transformation của Cloudinary.
 *  - z = 1 → cover (crop theo tỉ lệ)
 *  - z = 2 → contain (vừa khung, nền trong suốt)
 *  - z = 3 → scale  (giữ nguyên tỉ lệ)
 */
function parseSize(size) {
  const [w, h, z] = String(size).split('x').map((n) => Number(n) || 0);
  return { w: w || 1, h: h || 1, z: z || 1 };
}

export function buildTransformations(size) {
  const { w, h, z } = parseSize(size);
  const base = { width: w, height: h };
  if (z === 2) return [{ ...base, fit: 'pad', background: 'transparent' }];
  if (z === 3) return [{ ...base, fit: 'scale' }];
  return [{ ...base, fit: 'crop', gravity: 'auto' }];
}

/**
 * Danh sách eager transformation — sinh sẵn toàn bộ size khi upload
 * để thay thế hoàn toàn cơ chế sinh thumbnail runtime của InterventionController.
 */
export function eagerTransformations() {
  return config.thumbSizes.map((size) => {
    const { w, h, z } = parseSize(size);
    const name = size;
    return {
      ...buildTransformations(size)[0],
      raw_transformation: undefined,
      format: 'webp',
      transformation: `${buildTransformations(size)[0].fit}_${w},${h}${z === 2 ? ',fl_lossy' : ''}`,
      // Cloudinary dùng biến thể `c_fill,w_..,h_..`
      overwrite: name,
    };
  }).map((t, i) => ({
    width: parseSize(config.thumbSizes[i]).w,
    height: parseSize(config.thumbSizes[i]).h,
    crop: parseSize(config.thumbSizes[i]).z === 2 ? 'pad' : parseSize(config.thumbSizes[i]).z === 3 ? 'scale' : 'fill',
    gravity: 'auto',
    background: parseSize(config.thumbSizes[i]).z === 2 ? 'transparent' : undefined,
    format: 'webp',
    quality: 'auto',
  }));
}

/** Tạo signed params để browser upload thẳng lên Cloudinary. */
export function signedUploadParams(folder = config.cloudinary.folder) {
  if (!isCloudinaryReady()) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = cloudinary.utils.api_sign_request(toSign, config.cloudinary.apiSecret);
  return {
    signature,
    timestamp,
    folder,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
  };
}

/**
 * Upload buffer lên Cloudinary.
 * Trả về { public_id, secure_url, width, height, format, bytes } hoặc null nếu chưa cấu hình.
 */
export async function uploadBuffer(buffer, { folder = config.cloudinary.folder, filename = 'image' } = {}) {
  if (!isCloudinaryReady()) return null;
  const publicId = `${folder}/${filename.replace(/\.[^.]+$/, '')}-${Date.now()}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder,
        resource_type: 'image',
        overwrite: false,
        eager: eagerTransformations(),
        eager_async: false,
        transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          folder: result.folder,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Upload từ URL bên ngoài (dùng cho script migration ảnh). */
export async function uploadFromUrl(remoteUrl, { folder = config.cloudinary.folder } = {}) {
  if (!isCloudinaryReady()) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      remoteUrl,
      {
        folder,
        resource_type: 'image',
        overwrite: false,
        eager: eagerTransformations(),
        eager_async: false,
        transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          folder: result.folder,
        });
      }
    );
  });
}

/** Xoá ảnh trên Cloudinary theo public_id */
export async function destroy(publicId) {
  if (!isCloudinaryReady() || !publicId) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, {}, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Sinh URL ảnh đã transform từ public_id.
 * Nếu DB chứa URL HTTP cũ hoặc đường dẫn local (/upload/...) → trả nguyên.
 */
export function buildUrl(publicId, size = null, opts = {}) {
  if (!publicId) return opts.fallback || '';
  if (/^https?:\/\//i.test(publicId)) return publicId;
  if (publicId.startsWith('/')) return publicId;
  if (!isCloudinaryReady()) return publicId;

  const cloud = config.cloudinary.cloudName;
  if (!size) {
    return `https://res.cloudinary.com/${cloud}/image/upload/${encodeURI(publicId)}`;
  }
  const { w, h, z } = parseSize(size);
  const crop = z === 2 ? 'pad' : z === 3 ? 'scale' : 'fill';
  const extra = z === 2 ? ',fl_lossy' : '';
  const fmt = opts.format || 'webp';
  return (
    `https://res.cloudinary.com/${cloud}/image/upload/` +
    `c_${crop},w_${w},h_${h},g_auto${extra},f_${fmt},q_auto/` +
    `${encodeURI(publicId)}`
  );
}

export default {
  initCloudinary,
  cloudinaryMode,
  isCloudinaryReady,
  buildTransformations,
  eagerTransformations,
  signedUploadParams,
  uploadBuffer,
  uploadFromUrl,
  destroy,
  buildUrl,
};
