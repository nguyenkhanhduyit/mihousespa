import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api from '../api/client.js';

const NAV = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Giới thiệu', to: '/gioi-thieu' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Bảng giá', to: '/bang-gia' },
  { label: 'Đào tạo', to: '/dao-tao' },
  { label: 'Album ảnh', to: '/album-anh' },
  { label: 'Không gian', to: '/khong-gian' },
  { label: 'Nail Hottrend', to: '/nail-hottrend' },
  { label: 'Tin tức', to: '/tin-tuc' },
  { label: 'Liên hệ', to: '/lien-he' },
];

export default function Header({ onOpenBooking }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
    <>
      <div className="hidden bg-ink-900 text-ink-200 md:block">
        <div className="container-site flex h-10 items-center justify-between text-xs">
          <p className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
            {settings?.address || 'Gò Vấp, TP. Hồ Chí Minh'}
          </p>
          <div className="flex items-center gap-6">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 transition hover:text-white">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                {phone}
              </a>
            )}
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {settings?.worktime || '09:00 - 21:00'}
            </span>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="container-site flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Mi House Spa - Trang chủ">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3c0 3-3 3.5-3 7a3 3 0 0 0 6 0c0-3.5-3-4-3-7Z" />
                <path d="M12 21c4-2 7-5 7-9a7 7 0 1 0-14 0c0 4 3 7 7 9Z" opacity=".5" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-lg font-semibold tracking-wide text-ink-900">Mi House</span>
              <span className="block text-[10px] uppercase tracking-[0.25em] text-brand-600">Spa &amp; Wellness</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Menu chính">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                    isActive ? 'text-brand-700' : 'text-ink-600 hover:bg-brand-50 hover:text-brand-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenBooking} className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
              Đặt lịch
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
              aria-expanded={open}
              className="rounded-lg p-2 text-ink-700 transition hover:bg-ink-50 lg:hidden"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-[72px] items-center justify-between border-b border-ink-100 px-5">
              <span className="font-serif text-lg font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng menu"
                className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu di động">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                    }`
                  }
                >
                  {item.label}
                  <svg className="h-4 w-4 text-ink-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" />
                  </svg>
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-ink-100 p-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onOpenBooking) onOpenBooking();
                }}
                className="btn-primary w-full"
              >
                Đặt lịch ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}