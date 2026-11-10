import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import Button from '../components/Button.jsx';

/**
 * Dựng URL ảnh từ giá trị trong DB.
 * - URL tuyệt đối (http/https) → giữ nguyên
 * - Đường dẫn local (/upload/...) → giữ nguyên
 * - public_id của Cloudinary → dựng URL có transform
 */
export function imgUrl(photo, size = null) {
  if (!photo) return '';
  if (/^https?:\/\//i.test(photo)) return photo;
  if (photo.startsWith('/')) return photo;

  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return photo;
  const base = `https://res.cloudinary.com/${cloud}/image/upload`;
  if (!size) return `${base}/${photo}`;
  const [w, h, z] = size.split('x').map(Number);
  const crop = z === 2 ? 'pad' : z === 3 ? 'scale' : 'fill';
  return `${base}/c_${crop},w_${w},h_${h},g_auto,f_webp,q_auto/${photo}`;
}

/**
 * URL ảnh ưu tiên bản đã transform sẵn từ API (`photo_url` / `photo_original`).
 * Fallback sang `imgUrl()` khi API không cung cấp (chế độ local).
 */
export function photoSrc(item, size = null) {
  if (!item) return '';
  if (size === 'original') return item.photo_original || item.photo_url || imgUrl(item.photo, null);
  if (item.photo_url) return item.photo_url;
  return imgUrl(item.photo, size);
}

/** Ảnh có fallback khi lỗi. */
export function SafeImage({ src, alt, className = '', fallback = '/img-placeholder.svg' }) {
  const [err, setErr] = useState(false);
  useEffect(() => {
    setErr(false);
  }, [src]);
  if (!src || err) {
    return (
      <div className={`flex items-center justify-center bg-ink-50 ${className}`}>
        <svg className="h-10 w-10 text-ink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m21 15-5-5L5 20" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt || ''} loading="lazy" onError={() => setErr(true)} className={className} />;
}

const FALLBACK_HERO = {
  name: 'Gội đầu dưỡng sinh — Trải nghiệm chăm sóc đẳng cấp',
  desc: 'Thư giãn, phục hồi sức khoẻ với liệu trình chăm sóc đặc biệt tại Mi House Spa.',
  photo: '',
};

export default function Home({ onOpenBooking }) {
  const [banner, setBanner] = useState(null);
  const [slide, setSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('dich-vu');
  const [contact, setContact] = useState({ fullname: '', phone: '', email: '', content: '' });
  const [contactErrors, setContactErrors] = useState({});
  const [sending, setSending] = useState(false);

  const { items: services } = useFetch((p) => api.news.list(p), { type: 'dich-vu', limit: 12 }, { deps: ['dich-vu'] });
  const { items: prices } = useFetch((p) => api.news.list(p), { type: 'bang-gia', limit: 18 }, { deps: ['bang-gia'] });
  const { items: gallery } = useFetch((p) => api.gallery.list(p), { album: 'khong-gian', limit: 8 }, { deps: ['khong-gian'] });
  const { items: feedbacks } = useFetch((p) => api.news.list(p), { type: 'feedback', limit: 6 }, { deps: ['feedback'] });
  const { items: criteria } = useFetch((p) => api.news.list(p), { type: 'tieu-chi', limit: 8 }, { deps: ['tieu-chi'] });
  const { items: news } = useFetch((p) => api.news.list(p), { type: 'tin-tuc', limit: 6 }, { deps: ['tin-tuc'] });

  /* ------------------------- Hero slideshow ------------------------- */
  useEffect(() => {
    let alive = true;
    Promise.all([
      api.photo.list({ type: 'banner', limit: 8 }),
      api.photo.list({ type: 'slideshow', limit: 8 }),
    ])
      .then(([b, s]) => {
        if (!alive) return;
        const merged = [
          ...(b?.data?.items || []),
          ...(s?.data?.items || []),
        ];
        if (merged.length) setBanner(merged);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const slides = useMemo(() => {
    if (banner?.length) return banner;
    return [{ id: 0, namevi: FALLBACK_HERO.name, descvi: FALLBACK_HERO.desc, photo: '' }];
  }, [banner]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[slide] || slides[0];

  /* ------------------------- Submit liên hệ ------------------------ */
  function setContactField(key, value) {
    setContact((c) => ({ ...c, [key]: value }));
    setContactErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  async function submitContact(e) {
    e.preventDefault();
    const errs = {};
    if (!contact.fullname.trim()) errs.fullname = 'Vui lòng nhập họ tên';
    if (!contact.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    if (!contact.content.trim()) errs.content = 'Vui lòng nhập nội dung';
    setContactErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSending(true);
    try {
      const res = await api.contact.submit({
        fullname: contact.fullname,
        phone: contact.phone,
        email: contact.email,
        content: contact.content,
        type: 'lien-he',
      });
      if (res?.status !== 'success') throw new Error(res?.message || 'Gửi thất bại');
      toast.success(res.message || 'Gửi liên hệ thành công!');
      setContact({ fullname: '', phone: '', email: '', content: '' });
    } catch (err) {
      toast.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  const priceGroups = useMemo(() => {
    const groups = {};
    prices.forEach((p) => {
      const key = p.namevi || 'Bảng giá';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups);
  }, [prices]);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden bg-ink-900">
        {current?.photo && (
          <>
            <img
              src={imgUrl(current.photo, '1920x1000x1')}
              alt={current.namevi || ''}
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-ink-900/20" />
          </>
        )}

        <div className="container-site relative py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Mi House Spa
            </p>
            <h1 className="text-4xl font-semibold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
              {current?.namevi || FALLBACK_HERO.name}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
              {current?.descvi || current?.descen || FALLBACK_HERO.desc}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" onClick={onOpenBooking}>
                Đặt lịch ngay
              </Button>
              <Link to="/dich-vu" className="btn btn-lg !border !border-white/40 !text-white hover:!bg-white hover:!text-ink-900">
                Khám phá dịch vụ
              </Link>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id ?? i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Chuyển slide ${i + 1}`}
                  aria-current={i === slide}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? 'w-8 bg-brand-400' : 'w-3 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
              aria-label="Slide trước"
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/25 lg:block"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % slides.length)}
              aria-label="Slide tiếp"
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/25 lg:block"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </section>

      {/* ================= TIÊU CHÍ ================= */}
      {criteria.length > 0 && (
        <section className="border-b border-ink-100 bg-brand-50/40 py-12">
          <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">{c.namevi}</h3>
                  {c.descvi && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{c.descvi}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= DỊCH VỤ ================= */}
      <section className="py-20">
        <div className="container-site">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Dịch vụ</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Chăm sóc toàn diện cho bạn</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-500">
              Liệu trình được thiết kế riêng bởi đội ngũ chuyên gia, kết hợp giữa kỹ thuật trị liệu hiện đại và tinh thần
              chăm sóc tận tâm.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-72 skeleton" />
              ))}
            </div>
          ) : (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <article key={s.id} className="card card-hover group overflow-hidden">
                  <div className="relative h-52 overflow-hidden bg-ink-50">
                    <SafeImage
                      src={imgUrl(s.photo, '480x710x1')}
                      alt={s.namevi}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-ink-900 transition group-hover:text-brand-700">{s.namevi}</h3>
                    {s.descvi && <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-500">{s.descvi}</p>}
                    <Link
                      to={`/dich-vu/${s.slug || s.id}`}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:gap-2.5"
                    >
                      Tìm hiểu thêm
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= BẢNG GIÁ ================= */}
      {priceGroups.length > 0 && (
        <section className="bg-ink-50 py-20">
          <div className="container-site">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Bảng giá</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Gói dịch vụ &amp; mức giá</h2>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-2">
              {['bang-gia', 'bang-gia-2', 'bang-gia-3', 'bang-gia-4'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    activeTab === t ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 hover:bg-brand-50'
                  }`}
                >
                  {t === 'bang-gia' ? 'Tất cả' : t.replace('bang-gia-', 'Menu ')}
                </button>
              ))}
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {priceGroups
                .filter(([key]) => activeTab === 'bang-gia' || key.includes(activeTab.replace('bang-gia-', 'Menu ')))
                .flatMap(([, list]) => list)
                .map((p) => (
                  <div key={p.id} className="card flex items-center gap-4 p-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                      <SafeImage src={imgUrl(p.photo, '120x120x1')} alt={p.namevi} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-ink-900">{p.namevi}</h3>
                      {p.descvi && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{p.descvi}</p>}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/bang-gia" className="btn btn-outline">
                Xem đầy đủ bảng giá
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= KHÔNG GIAN / GALLERY ================= */}
      {gallery.length > 0 && (
        <section className="py-20">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Không gian</p>
                <h2 className="mt-3 text-3xl sm:text-4xl">Hình ảnh thực tế</h2>
              </div>
              <Link to="/album-anh" className="btn btn-outline">
                Xem tất cả
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {gallery.slice(0, 8).map((g, i) => (
                <Link
                  key={g.id}
                  to="/album-anh"
                  className={`group relative overflow-hidden rounded-2xl bg-ink-100 ${
                    i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                  }`}
                >
                  <SafeImage
                    src={imgUrl(g.photo, '480x780x1')}
                    alt={g.namevi}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink-900/0 transition group-hover:bg-ink-900/30" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= FEEDBACK ================= */}
      {feedbacks.length > 0 && (
        <section className="bg-brand-50/50 py-20">
          <div className="container-site">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Cảm nhận</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Khách hàng nói gì?</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {feedbacks.map((f) => (
                <figure key={f.id} className="card p-6">
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-600">
                    {f.descvi || f.contentvi || '—'}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {(f.namevi || 'K').charAt(0)}
                    </span>
                    <span className="text-sm font-medium text-ink-800">{f.namevi}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= TIN TỨC ================= */}
      {news.length > 0 && (
        <section className="py-20">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Tin tức</p>
                <h2 className="mt-3 text-3xl sm:text-4xl">Bài viết mới nhất</h2>
              </div>
              <Link to="/tin-tuc" className="btn btn-outline">
                Xem tất cả
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {news.slice(0, 6).map((n) => (
                <article key={n.id} className="card card-hover group overflow-hidden">
                  <Link to={`/tin-tuc/${n.slug || n.id}`} className="block h-48 overflow-hidden bg-ink-50">
                    <SafeImage
                      src={imgUrl(n.photo, '480x360x1')}
                      alt={n.namevi}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-5">
                    <p className="text-xs text-ink-400">
                      {n.date_publish ? new Date(n.date_publish).toLocaleDateString('vi-VN') : ''}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
                      <Link to={`/tin-tuc/${n.slug || n.id}`}>{n.namevi}</Link>
                    </h3>
                    {n.descvi && <p className="mt-2 line-clamp-2 text-sm text-ink-500">{n.descvi}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= LIÊN HỆ ================= */}
      <section className="bg-ink-50 py-20">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Liên hệ</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Gửi tin nhắn cho chúng tôi</h2>
            <p className="mt-4 leading-relaxed text-ink-500">
              Bạn có câu hỏi về dịch vụ, giá cả hay cần tư vấn? Hãy để lại thông tin, chuyên viên của Mi House Spa sẽ
              liên hệ với bạn trong thời gian sớm nhất.
            </p>

            <form onSubmit={submitContact} noValidate className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="ct-name">Họ tên *</label>
                  <input
                    id="ct-name"
                    className="field"
                    value={contact.fullname}
                    onChange={(e) => setContactField('fullname', e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                  {contactErrors.fullname && <p className="error-text">{contactErrors.fullname}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="ct-phone">Điện thoại *</label>
                  <input
                    id="ct-phone"
                    className="field"
                    value={contact.phone}
                    onChange={(e) => setContactField('phone', e.target.value)}
                    placeholder="0901234567"
                    inputMode="tel"
                  />
                  {contactErrors.phone && <p className="error-text">{contactErrors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="ct-email">Email</label>
                <input
                  id="ct-email"
                  className="field"
                  value={contact.email}
                  onChange={(e) => setContactField('email', e.target.value)}
                  placeholder="email@example.com"
                  inputMode="email"
                />
              </div>
              <div>
                <label className="label" htmlFor="ct-content">Nội dung *</label>
                <textarea
                  id="ct-content"
                  rows={4}
                  className="field resize-none"
                  value={contact.content}
                  onChange={(e) => setContactField('content', e.target.value)}
                  placeholder="Nội dung cần hỗ trợ…"
                />
                {contactErrors.content && <p className="error-text">{contactErrors.content}</p>}
              </div>
              <Button type="submit" loading={sending} size="lg">
                Gửi tin nhắn
              </Button>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="aspect-[4/3] bg-ink-100">
              <div className="flex h-full items-center justify-center text-center text-ink-400">
                <div>
                  <svg className="mx-auto h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <p className="mt-3 text-sm">Bản đồ đến Mi House Spa</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-600">
                <li className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <span>Gò Vấp, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  <span>0909 123 456</span>
                </li>
                <li className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>09:00 – 21:00 (hằng ngày)</span>
                </li>
              </ul>
              <Button onClick={onOpenBooking} className="mt-6 w-full">
                Đặt lịch hẹn
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}