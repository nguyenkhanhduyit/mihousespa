import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    api.settings
      .get()
      .then((res) => {
        if (alive) setSettings(res?.data || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const phone = settings?.hotline || settings?.phone || '';

  return (
    <footer className="mt-20 bg-ink-900 text-ink-300">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3c0 3-3 3.5-3 7a3 3 0 0 0 6 0c0-3.5-3-4-3-7Z" />
                <path d="M12 21c4-2 7-5 7-9a7 7 0 1 0-14 0c0 4 3 7 7 9Z" opacity=".5" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-lg font-semibold text-white">Mi House</span>
              <span className="block text-[10px] uppercase tracking-[0.25em] text-brand-400">Spa &amp; Wellness</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            Mi House Spa tự hào là điểm đến chăm sóc sức khoẻ và làm đẹp hàng đầu với dịch vụ gội đầu dưỡng sinh, massage
            trị liệu và chăm sóc móng chuyên nghiệp.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Dịch vụ</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/dich-vu" className="transition hover:text-brand-400">Gội đầu dưỡng sinh</Link></li>
            <li><Link to="/dich-vu" className="transition hover:text-brand-400">Massage trị liệu</Link></li>
            <li><Link to="/dich-vu" className="transition hover:text-brand-400">Chăm sóc móng</Link></li>
            <li><Link to="/bang-gia" className="transition hover:text-brand-400">Bảng giá</Link></li>
            <li><Link to="/dao-tao" className="transition hover:text-brand-400">Đào tạo nghề</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Liên kết</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/gioi-thieu" className="transition hover:text-brand-400">Về Mi House</Link></li>
            <li><Link to="/album-anh" className="transition hover:text-brand-400">Album ảnh</Link></li>
            <li><Link to="/khong-gian" className="transition hover:text-brand-400">Không gian</Link></li>
            <li><Link to="/tin-tuc" className="transition hover:text-brand-400">Tin tức</Link></li>
            <li><Link to="/lien-he" className="transition hover:text-brand-400">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Liên hệ</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {settings?.address && (
              <li className="flex gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>{settings.address}</span>
              </li>
            )}
            {phone && (
              <li className="flex gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="transition hover:text-brand-400">{phone}</a>
              </li>
            )}
            {settings?.email && (
              <li className="flex gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <a href={`mailto:${settings.email}`} className="transition hover:text-brand-400">{settings.email}</a>
              </li>
            )}
            {settings?.fanpage && (
              <li className="flex gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" />
                </svg>
                <a href={settings.fanpage} target="_blank" rel="noreferrer" className="transition hover:text-brand-400">
                  Facebook
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Mi House Spa. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="transition hover:text-brand-400">Quản trị</Link>
            <Link to="/chinh-sach" className="transition hover:text-brand-400">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}