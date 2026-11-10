import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import ScrollReveal from '../components/ScrollReveal.jsx';
import TextSplit from '../components/TextSplit.jsx';
import { useRipple } from '../hooks/useRipple.js';

const stripHtml = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const imgUrl = (item, fallback = '') => {
  if (!item) return fallback;
  const raw = item.photo || item.url || item.image || '';
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
};

/* ================= BreadCrumbs (giống site gốc) ================= */
export function BreadCrumbs({ current, parent }) {
  return (
    <div className="breadCrumbs">
      <div className="wrap-content">
        <ol className="breadcrumb">
          <li className="home">
            <Link className="text-decoration-none" to="/">
              <span>Trang chủ</span>
            </Link>
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-right"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              className="svg-inline--fa fa-chevron-right fa-w-10"
            >
              <path
                fill="currentColor"
                d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"
              />
            </svg>
          </li>
          {parent ? (
            <li>
              <Link className="text-decoration-none" to={parent.to}>
                <span>{parent.label}</span>
              </Link>
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="chevron-right"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                className="svg-inline--fa fa-chevron-right fa-w-10"
              >
                <path
                  fill="currentColor"
                  d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"
                />
              </svg>
            </li>
          ) : null}
          <li className="active">
            <Link className="text-decoration-none" to="#">
              <span>{current}</span>
            </Link>
          </li>
        </ol>
      </div>
    </div>
  );
}

/* ================= Trang tĩnh: Giới thiệu / Chính sách ================= */
export function StaticPage({ title, slug, type }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.staticContent
      .list({ type: slug })
      .then((res) => {
        if (!alive) return;
        const list = res?.data || [];
        setContent(list[0] || null);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <>
      <BreadCrumbs current={title} />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>{content?.namevi || content?.name || title}</h1>
          </div>
          <ScrollReveal className="content-main ck-editor">
            {loading ? (
              <p>Đang tải nội dung…</p>
            ) : content?.content ? (
              <div dangerouslySetInnerHTML={{ __html: content.content }} />
            ) : (
              <p>Nội dung đang được cập nhật.</p>
            )}
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}

/* ================= Trang Dịch vụ ================= */
export function ServicePage() {
  const [services, setServices] = useState([]);
  const ripple = useRipple();

  useEffect(() => {
    let alive = true;
    api.news
      .list({ type: 'dich-vu' })
      .then((res) => alive && setServices(res?.data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <BreadCrumbs current="Dịch vụ" />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>Dịch vụ</h1>
          </div>

          <div className="service__list flex-container">
            {services.map((s, i) => (
              <div className="service__item" key={s.id || i}>
                <article className="service__card">
                  <figure className="service__media">
                    <Link className="service__media-link scale-img" to={s.link || '/dich-vu'}>
                      <img
                        className="service__media-image w-100"
                        src={imgUrl(s)}
                        alt={s.namevi || s.name || ''}
                        loading="lazy"
                        width="500"
                        height="800"
                      />
                    </Link>
                  </figure>
                  <div className="service__info">
                    <h3 className="service__name">
                      <TextSplit as="a" className="text-split transition" text={s.namevi || s.name || ''} />
                    </h3>
                    {s.descvi || s.desc ? (
                      <p className="service__desc">{stripHtml(s.descvi || s.desc).slice(0, 220)}</p>
                    ) : null}
                    <Link className="home__btn service__btn ripple" to={s.link || '/dich-vu'} onClick={ripple}>
                      <span>Khám phá thêm</span>
                      <span className="fa-regular fa-arrow-right-long" />
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= Trang Bảng giá ================= */
export function PricePage() {
  const [prices, setPrices] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let alive = true;
    api.news
      .list({ type: 'bang-gia' })
      .then((res) => alive && setPrices(res?.data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const images = prices.filter((p) => p.photo || p.url);

  return (
    <>
      <BreadCrumbs current="Bảng giá" />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>Bảng giá</h1>
          </div>

          <div className="news-detail-gallery">
            <div className="news-detail-gallery__list">
              {images.map((p, i) => (
                <figure className="album-item" key={p.id || i}>
                  <img
                    className="scale-img cursor-pointer"
                    src={imgUrl(p)}
                    alt={p.namevi || p.name || ''}
                    loading="lazy"
                    onClick={() => setLightbox(i)}
                    style={{ cursor: 'pointer' }}
                  />
                </figure>
              ))}
            </div>
          </div>

          {lightbox !== null && images[lightbox] ? (
            <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
              <button type="button" className="lightbox__close" aria-label="Đóng">
                &times;
              </button>
              <img src={imgUrl(images[lightbox])} alt={images[lightbox].namevi || ''} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ================= Trang Đào tạo ================= */
export function TrainingPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    api.news
      .list({ type: 'dao-tao' })
      .then((res) => alive && setItems(res?.data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <BreadCrumbs current="Đào tạo" />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>Đào tạo</h1>
          </div>

          <div className="news__list flex-container">
            {items.map((n, i) => (
              <div className="news__item" key={n.id || i}>
                <article className="news__card">
                  <figure className="news__media">
                    <Link className="news__media-link scale-img" to={`/tin-tuc/${n.slugvi || n.slug || ''}`}>
                      <img
                        className="news__media-image w-100"
                        src={imgUrl(n)}
                        alt={n.namevi || n.name || ''}
                        loading="lazy"
                        width="480"
                        height="780"
                      />
                    </Link>
                  </figure>
                  <div className="news__info">
                    <h3 className="news__name">
                      <TextSplit
                        as="a"
                        className="text-split transition"
                        text={n.namevi || n.name || ''}
                      />
                    </h3>
                    <p className="news__desc text-split">{stripHtml(n.descvi || n.desc || '')}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= Trang Tin tức (list + detail) ================= */
export function NewsListPage() {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 11;

  useEffect(() => {
    let alive = true;
    api.news
      .list({ limit: 100 })
      .then((res) => alive && setNews(res?.data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(news.length / perPage));
  const visible = news.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <BreadCrumbs current="Tin tức" />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>Tin tức</h1>
          </div>

          <div className="news__list flex-container">
            {visible.map((n, i) => (
              <div className="news__item" key={n.id || i}>
                <article className="news__card">
                  <figure className="news__media">
                    <Link className="news__media-link scale-img" to={`/tin-tuc/${n.slugvi || n.slug || ''}`}>
                      <img
                        className="news__media-image w-100"
                        src={imgUrl(n)}
                        alt={n.namevi || n.name || ''}
                        loading="lazy"
                        width="480"
                        height="780"
                      />
                    </Link>
                  </figure>
                  <div className="news__info">
                    <h3 className="news__name">
                      <TextSplit
                        as="a"
                        className="text-split transition"
                        text={n.namevi || n.name || ''}
                      />
                    </h3>
                    <p className="news__desc text-split">{stripHtml(n.descvi || n.desc || '')}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pagination__item ${page === i + 1 ? 'is-active' : ''}`}
                  onClick={() => {
                    setPage(i + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function NewsDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let alive = true;
    api.news
      .bySlug(slug)
      .then((res) => {
        if (!alive) return;
        setArticle(res?.data || null);
        return api.news.list({ limit: 8 }).then((r) => alive && setRelated(r?.data || []));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <>
      <BreadCrumbs current={article?.namevi || 'Tin tức'} parent={{ label: 'Tin tức', to: '/tin-tuc' }} />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>{article?.namevi || article?.name || 'Chi tiết'}</h1>
          </div>

          {article?.photo ? (
            <figure className="news-detail__media">
              <img className="w-100" src={imgUrl(article)} alt={article.namevi || ''} loading="lazy" />
            </figure>
          ) : null}

          <div className="content-main ck-editor">
            {article?.contentvi || article?.content ? (
              <div dangerouslySetInnerHTML={{ __html: article.contentvi || article.content }} />
            ) : (
              <p>Đang tải nội dung…</p>
            )}
          </div>

          {related.length > 0 && (
            <div className="news__list flex-container mt:3rem">
              {related.slice(0, 4).map((n, i) => (
                <div className="news__item" key={n.id || i}>
                  <article className="news__card">
                    <figure className="news__media">
                      <Link className="news__media-link scale-img" to={`/tin-tuc/${n.slugvi || n.slug || ''}`}>
                        <img
                          className="news__media-image w-100"
                          src={imgUrl(n)}
                          alt={n.namevi || ''}
                          loading="lazy"
                        />
                      </Link>
                    </figure>
                    <div className="news__info">
                      <h3 className="news__name">{n.namevi || n.name}</h3>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ================= Trang Gallery (Album ảnh / Không gian / Nail) ================= */
export function GalleryPage({ title, group }) {
  const [items, setItems] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.gallery
      .list(group ? { group } : {})
      .then((res) => alive && setItems(res?.data || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [group]);

  const go = (dir) => {
    setLightbox((i) => {
      if (i === null) return null;
      return (i + dir + items.length) % items.length;
    });
  };

  return (
    <>
      <BreadCrumbs current={title} parent={group ? { label: 'Album ảnh', to: '/album-anh' } : null} />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="title-main">
            <h1>{title}</h1>
          </div>

          <div className="news-detail-gallery">
            <div className="news-detail-gallery__list">
              {loading ? (
                <p>Đang tải hình ảnh…</p>
              ) : (
                items.map((img, i) => (
                  <figure className="album-item" key={img.id || img.url || i}>
                    <img
                      className="scale-img cursor-pointer"
                      src={imgUrl(img)}
                      alt={img.namevi || img.name || ''}
                      loading="lazy"
                      onClick={() => setLightbox(i)}
                      style={{ cursor: 'pointer' }}
                    />
                  </figure>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {lightbox !== null && items[lightbox] ? (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button type="button" className="lightbox__close" aria-label="Đóng" onClick={() => setLightbox(null)}>
            &times;
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--prev" aria-label="Trước" onClick={(e) => { e.stopPropagation(); go(-1); }}>
            ‹
          </button>
          <img src={imgUrl(items[lightbox])} alt={items[lightbox].namevi || ''} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="lightbox__nav lightbox__nav--next" aria-label="Sau" onClick={(e) => { e.stopPropagation(); go(1); }}>
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}

/* ================= Trang Liên hệ ================= */
export function ContactPage() {
  const [form, setForm] = useState({ fullname: '', phone: '', email: '', subject: '', content: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullname.trim()) e.fullname = 'Thông tin bắt buộc. Vui lòng nhập đầy đủ.';
    if (!form.phone.trim()) e.phone = 'Thông tin bắt buộc. Vui lòng nhập đầy đủ.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }
    setSending(true);
    try {
      await api.contact.submit({ ...form, type: 'lien-he' });
      toast.success('Gửi liên hệ thành công!');
      setForm({ fullname: '', phone: '', email: '', subject: '', content: '' });
    } catch (err) {
      toast.error(err?.message || 'Không gửi được. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const MAP_SRC =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4541.310265555282!2d106.67502277566014!3d10.827103189324765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175290008d54311%3A0x5901d51929d43331!2smi%20house%20Spa!5e1!3m2!1svi!2s!4v1789012090576!5m2!1svi!2s';

  return (
    <>
      <BreadCrumbs current="Liên hệ" />
      <div className="wrap-main">
        <div className="wrap-content">
          <div className="contact-flex">
            <div className="contact-left">
              <div className="title-detail">
                <h1>Mi House Spa</h1>
              </div>
              <div className="content-main">
                <p>Địa Chỉ: 43 đường Quang Trung, phường Gò Vấp, Thành Phố Hồ Chí Minh</p>
                <p>Hotline: 0767882407</p>
                <p>Email: nguyenquynhdiem1988@gmail.com</p>
                <p>Website: mihousespa.com</p>
              </div>

              <div className="contact-form">
                <form className="validation-contact" id="form-contact" noValidate onSubmit={submit}>
                  <div className="grid grid-cols-2 gap-[0_10px]">
                    <div className="contact-input">
                      <input
                        type="text"
                        className={`form-control ${errors.fullname ? 'is-invalid' : ''}`}
                        placeholder="Họ và tên"
                        value={form.fullname}
                        onChange={set('fullname')}
                        autoComplete="off"
                        required
                      />
                      {errors.fullname ? <div className="invalid-feedback d-block">{errors.fullname}</div> : null}
                    </div>
                    <div className="contact-input">
                      <input
                        type="text"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="Số điện thoại"
                        value={form.phone}
                        onChange={set('phone')}
                        autoComplete="off"
                        required
                      />
                      {errors.phone ? <div className="invalid-feedback d-block">{errors.phone}</div> : null}
                    </div>
                  </div>

                  <div className="contact-input">
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="Email"
                      value={form.email}
                      onChange={set('email')}
                      autoComplete="off"
                      required
                    />
                    {errors.email ? <div className="invalid-feedback d-block">{errors.email}</div> : null}
                  </div>

                  <div className="contact-input">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tiêu đề"
                      value={form.subject}
                      onChange={set('subject')}
                      autoComplete="off"
                    />
                  </div>

                  <div className="contact-input">
                    <textarea
                      rows="4"
                      className="form-control"
                      placeholder="Nội dung"
                      value={form.content}
                      onChange={set('content')}
                      autoComplete="off"
                    />
                  </div>

                  <div className="mt-[20px]">
                    <input type="submit" className="btn btn-primary mr-2 contact-button" value={sending ? 'Đang gửi…' : 'Gửi'} disabled={sending} />
                    <input
                      type="reset"
                      className="btn btn-secondary"
                      value="Nhập lại"
                      onClick={() => {
                        setForm({ fullname: '', phone: '', email: '', subject: '', content: '' });
                        setErrors({});
                      }}
                    />
                  </div>
                </form>
              </div>
            </div>

            <div className="contact-right">
              <div className="contact-map">
                <iframe
                  src={MAP_SRC}
                  width="600"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Bản đồ Mi House Spa"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
