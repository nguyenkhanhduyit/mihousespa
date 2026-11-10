import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      setLoading(true);
      try {
        const [news, photo, contact] = await Promise.allSettled([
          api.news.adminList({ limit: 5 }),
          api.photo.adminList({ limit: 1 }),
          api.contact.adminList({ limit: 5 }),
        ]);

        const newsTotal = news.status === 'fulfilled' ? news.value?.data?.total || 0 : 0;
        const photoTotal = photo.status === 'fulfilled' ? photo.value?.data?.total || 0 : 0;
        const contactTotal = contact.status === 'fulfilled' ? contact.value?.data?.total || 0 : 0;

        if (!alive) return;
        setStats({ newsTotal, photoTotal, contactTotal });
        setRecent(news.status === 'fulfilled' ? news.value?.data?.items || [] : []);
        setContacts(contact.status === 'fulfilled' ? contact.value?.data?.items || [] : []);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const CARDS = [
    { label: 'Bài viết / Dịch vụ', value: stats?.newsTotal, to: '/admin/news', icon: 'file', color: 'bg-brand-50 text-brand-700' },
    { label: 'Ảnh trong thư viện', value: stats?.photoTotal, to: '/admin/photo', icon: 'image', color: 'bg-blue-50 text-blue-700' },
    { label: 'Lượt liên hệ', value: stats?.contactTotal, to: '/admin/contact', icon: 'mail', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Trang tĩnh', value: null, to: '/admin/static', icon: 'layout', color: 'bg-amber-50 text-amber-700' },
  ];

  const ICON_PATHS = {
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />,
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    layout: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Tổng quan hoạt động của website Mi House Spa.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.label} to={c.to} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold text-ink-900">
                  {loading ? '—' : c.value !== null ? c.value : '—'}
                </p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {ICON_PATHS[c.icon]}
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-900">Bài viết mới nhất</h2>
            <Link to="/admin/news" className="text-sm font-medium text-brand-700 hover:underline">Xem tất cả</Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Chưa có bài viết nào.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50">
                  {item.photo ? (
                    <img src={item.photo_url || item.photo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-300">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      </svg>
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{item.namevi}</p>
                    <p className="text-xs text-ink-400">{item.type}</p>
                  </div>
                  <span className="badge-gray shrink-0">#{item.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-900">Liên hệ mới nhất</h2>
            <Link to="/admin/contact" className="text-sm font-medium text-brand-700 hover:underline">Xem tất cả</Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Chưa có lượt liên hệ nào.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {contacts.map((c) => (
                <li key={c.id} className="px-5 py-3 transition hover:bg-ink-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink-900">{c.fullname}</p>
                    <span className="badge-gray shrink-0">{c.type || 'lien-he'}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-500">
                    {c.phone} {c.email ? `· ${c.email}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h2 className="text-base font-semibold text-ink-900">Thao tác nhanh</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/news" className="btn btn-admin">Thêm bài viết</Link>
          <Link to="/admin/photo" className="btn btn-admin-outline">Tải ảnh lên</Link>
          <Link to="/admin/settings" className="btn btn-admin-outline">Cấu hình site</Link>
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-admin-outline">
            Xem website
          </a>
        </div>
      </div>
    </>
  );
}