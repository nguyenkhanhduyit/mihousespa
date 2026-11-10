import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';

/**
 * Bộ chọn ảnh: upload lên Cloudinary (qua API) hoặc dán URL.
 * Giá trị trả về là `public_id` (đã migrate) hoặc URL cũ.
 */
export default function ImagePicker({
  value,
  onChange,
  label = 'Ảnh',
  hint = 'JPG/PNG/WebP, tối đa 15MB',
  previewSize = '360x360x1',
  className = '',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const previewUrl = value ? previewOf(value) : '';

  function previewOf(v) {
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith('/')) return v;
    // public_id → dựng URL Cloudinary
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloud) return v;
    const [w, h, z] = previewSize.split('x').map(Number);
    const crop = z === 2 ? 'pad' : z === 3 ? 'scale' : 'fill';
    return `https://res.cloudinary.com/${cloud}/image/upload/c_${crop},w_${w},h_${h},g_auto,f_webp,q_auto/${v}`;
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error('Chỉ cho phép chọn tệp ảnh');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Kích thước ảnh vượt quá 15MB');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('mihouse_admin_token') || ''}` },
        body: fd,
      });
      const json = await res.json();
      if (json?.status !== 'success') throw new Error(json?.message || 'Upload thất bại');
      onChange(json.data.public_id);
      setPreview(json.data.url);
      toast.success('Đã tải ảnh lên thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleUrlSubmit(e) {
    e.preventDefault();
    const url = e.target.elements.imgUrl.value.trim();
    if (!url) return;
    onChange(url);
    setPreview('');
    toast.success('Đã đặt đường dẫn ảnh');
  }

  return (
    <div className={className}>
      <label className="label">{label}</label>

      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-300">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-18 0V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25V16.5M15 10.5l-3 3m0 0-3-3m3 3V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <svg className="h-6 w-6 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-admin-outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Đang tải…' : 'Chọn tệp'}
            </button>
            {value && (
              <button
                type="button"
                className="btn btn-admin-outline text-red-600"
                onClick={() => {
                  onChange('');
                  setPreview('');
                }}
              >
                Xoá ảnh
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              name="imgUrl"
              defaultValue={value && /^https?:\/\//i.test(value) ? value : ''}
              placeholder="Hoặc dán URL ảnh…"
              className="field flex-1"
            />
            <button type="submit" className="btn btn-admin-outline">
              Dùng
            </button>
          </form>

          {hint && <p className="hint">{hint}</p>}
          {value && !/^https?:\/\//i.test(value) && (
            <p className="hint truncate">public_id: {value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Bộ chọn nhiều ảnh (gallery) — dùng cho album. */
export function MultiImagePicker({ value = [], onChange, label = 'Thư viện ảnh' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('mihouse_admin_token') || ''}` },
        body: fd,
      });
      const json = await res.json();
      if (json?.status !== 'success') throw new Error(json?.message || 'Upload thất bại');
      onChange([...value, json.data.public_id]);
      toast.success('Đã tải ảnh lên');
    } catch (err) {
      toast.error(err.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-3">
        {value.map((v, i) => (
          <div key={`${v}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-200">
            <img src={/^https?:\/\//i.test(v) ? v : v} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white transition hover:bg-red-700"
              aria-label="Xoá ảnh"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-brand-400 hover:text-brand-600"
        >
          {uploading ? '…' : '+'}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}