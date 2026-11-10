import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { imgUrl, SafeImage } from './Home.jsx';

/** Nhãn tiếng Việt cho các nhóm album. */
const ALBUM_LABELS = {
  'album-anh': 'Album ảnh',
  'khong-gian': 'Không gian',
  'nail-hottrend': 'Nail Hottrend',
  menu: 'Hình ảnh chung',
};

export default function Gallery({ title = 'Album ảnh', subtitle, album = 'album-anh' }) {
  const [type, setType] = useState(album);
  const [types, setTypes] = useState([]);
  const [active, setActive] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    api.gallery
      .groups()
      .then((res) => {
        if (alive) setTypes(res?.data || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const { items, loading } = useFetch(
    (p) => api.gallery.list(p),
    { album: type, limit: 60 },
    { deps: [type] }
  );

  function open(i) {
    setIndex(i);
    setActive(items[i]);
  }

  function close() {
    setActive(null);
  }

  function prev() {
    const n = (index - 1 + items.length) % items.length;
    setIndex(n);
    setActive(items[n]);
  }

  function next() {
    const n = (index + 1) % items.length;
    setIndex(n);
    setActive(items[n]);
  }

  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50 py-14">
        <div className="container-site">
          <nav className="flex items-center gap-2 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-700">Trang chủ</Link>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" />
            </svg>
            <span className="text-ink-800">{title}</span>
          </nav>
          <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl leading-relaxed text-ink-500">{subtitle}</p>}
        </div>
      </section>

      <section className="py-12">
        <div className="container-site">
          {types.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.group}
                  type="button"
                  onClick={() => setType(t.group)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    type === t.group ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-brand-50'
                  }`}
                >
                  {ALBUM_LABELS[t.group] || t.group} ({t.count})
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="skeleton aspect-square" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-ink-500">Chưa có ảnh trong album này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => open(i)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100 transition hover:shadow-card-hover"
                  aria-label={`Xem ảnh ${g.namevi || i + 1}`}
                >
                  <SafeImage
                    src={imgUrl(g.photo, '480x480x1')}
                    alt={g.namevi}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-900/0 opacity-0 transition group-hover:bg-ink-900/30 group-hover:opacity-100">
                    <svg className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5M11 8v6M8 11h6" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-900/95 p-4">
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={prev}
            aria-label="Ảnh trước"
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" />
            </svg>
          </button>

          <figure className="flex max-h-[90vh] max-w-5xl flex-col items-center">
            <img
              src={imgUrl(active.photo, '1366x712x1')}
              alt={active.namevi || ''}
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
            {active.namevi && <figcaption className="mt-4 text-center text-sm text-white/80">{active.namevi}</figcaption>}
          </figure>

          <button
            type="button"
            onClick={next}
            aria-label="Ảnh tiếp"
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

export function PricePage() {
  const { items, loading } = useFetch((p) => api.news.list(p), { type: 'bang-gia', limit: 100 }, { deps: ['price'] });
  const [activeTab, setActiveTab] = useState('all');

  const groups = useMemo(() => {
    const g = {};
    items.forEach((p) => {
      const key = p.namevi || 'Bảng giá';
      if (!g[key]) g[key] = [];
      g[key].push(p);
    });
    return g;
  }, [items]);

  const tabs = useMemo(() => ['all', ...Object.keys(groups)], [groups]);

  const visible = useMemo(() => {
    if (activeTab === 'all') return Object.entries(groups);
    return [[activeTab, groups[activeTab] || []]];
  }, [groups, activeTab]);

  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50 py-14">
        <div className="container-site">
          <nav className="flex items-center gap-2 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-700">Trang chủ</Link>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" />
            </svg>
            <span className="text-ink-800">Bảng giá</span>
          </nav>
          <h1 className="mt-4 text-3xl sm:text-4xl">Bảng giá dịch vụ</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-500">
            Giá dưới đây là giá tham khảo. Quý khách vui lòng liên hệ để được tư vấn chính xác cho nhu cầu của mình.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-site">
          {tabs.length > 2 && (
            <div className="mb-10 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === t ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-brand-50'
                  }`}
                >
                  {t === 'all' ? 'Tất cả' : t}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-48 w-full" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-ink-500">Chưa có bảng giá.</p>
          ) : (
            <div className="space-y-12">
              {visible.map(([groupName, list]) => (
                <div key={groupName}>
                  <h2 className="text-2xl">{groupName}</h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => (
                      <div key={p.id} className="card flex gap-4 p-5">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                          <SafeImage src={imgUrl(p.photo, '120x120x1')} alt={p.namevi} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-ink-900">{p.namevi}</h3>
                          {p.descvi && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-500">{p.descvi}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}