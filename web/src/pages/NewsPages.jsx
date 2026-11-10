import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { imgUrl, SafeImage } from './Home.jsx';
import Button from '../components/Button.jsx';

/**
 * Trang danh sách bài viết theo `type` (dùng cho dịch vụ, tin tức, đào tạo...).
 */
export default function NewsList({ type, title, subtitle, emptyText = 'Chưa có nội dung' }) {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [searchInput, setSearchInput] = useState(keyword);

  const { items, total, loading, error, refetch } = useFetch(
    (p) => api.news.list(p),
    { type, page, limit: 12, keyword: keyword || undefined },
    { deps: [type, page, keyword] }
  );

  useEffect(() => {
    const next = {};
    if (page > 1) next.page = page;
    if (keyword) next.keyword = keyword;
    setParams(next, { replace: true });
  }, [page, keyword, setParams]);

  const totalPages = Math.max(1, Math.ceil(total / 12));

  function doSearch(e) {
    e?.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setKeyword('');
    setPage(1);
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink-500">
              {loading ? 'Đang tải…' : `Tìm thấy ${total} nội dung`}
            </p>
            <form onSubmit={doSearch} className="flex gap-2">
              <input
                className="field !w-64"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm…"
                aria-label="Tìm kiếm"
              />
              <Button type="submit" size="sm">Tìm</Button>
              {keyword && (
                <Button type="button" variant="admin-outline" size="sm" onClick={clearSearch}>
                  Xoá
                </Button>
              )}
            </form>
          </div>

          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error.message}
              <button type="button" onClick={refetch} className="ml-3 font-semibold underline">Thử lại</button>
            </div>
          )}

          {loading && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card h-80 skeleton" />)}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="mt-16 text-center">
              <svg className="mx-auto h-14 w-14 text-ink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="m3 9 18-3M9 20V10" />
              </svg>
              <p className="mt-4 text-ink-500">{emptyText}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="card card-hover group overflow-hidden">
                  <Link to={`/${type}/${item.slug || item.id}`} className="block h-52 overflow-hidden bg-ink-50">
                    <SafeImage
                      src={imgUrl(item.photo, '480x710x1')}
                      alt={item.namevi}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-5">
                    <h2 className="line-clamp-2 text-base font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
                      <Link to={`/${type}/${item.slug || item.id}`}>{item.namevi}</Link>
                    </h2>
                    {item.descvi && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-500">{item.descvi}</p>}
                    <Link
                      to={`/${type}/${item.slug || item.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:gap-2.5"
                    >
                      Chi tiết
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Phân trang">
              <Button
                variant="admin-outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                    p === page ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 hover:bg-brand-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="admin-outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Trang chi tiết bài viết.
 */
export function NewsDetail({ type, backLabel = 'Quay lại' }) {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.news
      .bySlug(slug)
      .then((res) => {
        if (!alive) return;
        if (res?.status !== 'success') throw new Error(res?.message || 'Không tìm thấy nội dung');
        setData(res.data);
      })
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-site py-20">
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton mt-6 h-64 w-full" />
        <div className="skeleton mt-6 h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-site py-24 text-center">
        <svg className="mx-auto h-14 w-14 text-ink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <h1 className="mt-4 text-2xl">Không tìm thấy nội dung</h1>
        <p className="mt-2 text-ink-500">{error.message}</p>
        <Link to={`/${type}`} className="btn btn-primary mt-6">{backLabel}</Link>
      </div>
    );
  }

  const item = data?.item;
  const related = data?.related || [];

  return (
    <>
      <section className="border-b border-ink-100 bg-ink-50 py-10">
        <div className="container-site">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-700">Trang chủ</Link>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" />
            </svg>
            <Link to={`/${type}`} className="transition hover:text-brand-700">{type}</Link>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" />
            </svg>
            <span className="truncate text-ink-800">{item?.namevi}</span>
          </nav>
          <h1 className="mt-4 max-w-4xl text-3xl leading-tight sm:text-4xl">{item?.namevi}</h1>
          {item?.date_publish && (
            <p className="mt-3 text-sm text-ink-500">
              Đăng ngày {new Date(item.date_publish).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </section>

      <article className="py-12">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            {item?.photo && (
              <div className="overflow-hidden rounded-2xl bg-ink-50">
                <SafeImage src={imgUrl(item.photo, '960x940x1')} alt={item.namevi} className="h-auto w-full object-cover" />
              </div>
            )}

            {item?.descvi && (
              <p className="mt-8 rounded-xl bg-brand-50/60 p-5 text-base leading-relaxed text-ink-700">{item.descvi}</p>
            )}

            {item?.contentvi && (
              <div
                className="prose-content mt-8 text-[15px] leading-[1.85] text-ink-700"
                dangerouslySetInnerHTML={{ __html: item.contentvi }}
              />
            )}

            <div className="mt-12 border-t border-ink-100 pt-6">
              <Link to={`/${type}`} className="btn btn-outline">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5m6-6-6 6 6 6" strokeLinecap="round" />
                </svg>
                {backLabel}
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-20 border-t border-ink-100 pt-12">
              <h2 className="text-2xl">Bài viết liên quan</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <article key={r.id} className="card card-hover group overflow-hidden">
                    <Link to={`/${type}/${r.slug || r.id}`} className="block h-44 overflow-hidden bg-ink-50">
                      <SafeImage src={imgUrl(r.photo, '480x360x1')} alt={r.namevi} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </Link>
                    <div className="p-5">
                      <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                        <Link to={`/${type}/${r.slug || r.id}`}>{r.namevi}</Link>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

/**
 * Trang nội dung tĩnh (giới thiệu, liên hệ, chính sách...) lấy từ table_static.
 */
export function StaticPage({ type, title, fallback }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.staticContent
      .byType(type)
      .then((res) => alive && setItem(res?.status === 'success' ? res.data.item : null))
      .catch(() => alive && setItem(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [type]);

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
          <h1 className="mt-4 text-3xl sm:text-4xl">{item?.namevi || title}</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            {loading ? (
              <div className="skeleton h-64 w-full" />
            ) : item?.contentvi ? (
              <div
                className="prose-content text-[15px] leading-[1.85] text-ink-700"
                dangerouslySetInnerHTML={{ __html: item.contentvi }}
              />
            ) : (
              <p className="leading-relaxed text-ink-600">{fallback || item?.descvi || 'Nội dung đang được cập nhật.'}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}