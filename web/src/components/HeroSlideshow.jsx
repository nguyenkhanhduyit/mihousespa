import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * HeroSlideshow — 100% replica của khối `.splide.slideshow` trên site mẫu.
 * Dùng <picture> multi-source đúng kích thước thumbnail của site gốc:
 * 768x400 / 1024x534 / 1366x712 / 1600x834 / 1920x1000
 */
const SIZES = [
  { media: '(max-width: 768px)', w: 768, h: 400 },
  { media: '(max-width: 1024px)', w: 1024, h: 534 },
  { media: '(max-width: 1366px)', w: 1366, h: 712 },
  { media: '(max-width: 1600px)', w: 1600, h: 834 },
  { media: '(max-width: 1920px)', w: 1920, h: 1000 },
];

const stripExt = (url) => url.replace(/\.[a-z0-9]+$/i, '');

/** Dựng URL thumbnail theo convention `thumbs/{w}x{h}x1/{path}` của site gốc. */
function thumbUrl(url, w, h) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    // URL tuyệt đối từ site gốc hoặc CDN -> giữ nguyên nếu đã có /thumbs/
    if (url.includes('/thumbs/')) return url;
    return url;
  }
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return `/thumbs/${w}x${h}x1/${clean}`;
}

export default function HeroSlideshow({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const items = useMemo(
    () =>
      slides
        .map((s) => ({
          ...s,
          src: s.photo || s.url || s.image || '',
          title: s.namevi || s.name || '',
          desc: s.descvi || s.desc || '',
          link: s.link || '/lien-he',
        }))
        .filter((s) => s.src),
    [slides],
  );

  useEffect(() => {
    if (items.length < 2) return undefined;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="splide slideshow" style={{ aspectRatio: '1920/1000' }}>
      <div className="splide__track">
        <div className="splide__list slideshow__list">
          {items.map((item, i) => (
            <div
              className={`splide__slide slideshow__item ${i === index ? 'is-active' : ''}`}
              key={item.id || item.src || i}
              aria-hidden={i !== index}
            >
              <figure className="slideshow__media">
                <picture className="w-100">
                  {SIZES.map((s) => (
                    <source
                      key={s.media}
                      media={s.media}
                      srcSet={thumbUrl(item.src, s.w, s.h)}
                      type="image/webp"
                      width={s.w}
                      height={s.h}
                    />
                  ))}
                  <img
                    className="slideshow__media-image w-100"
                    src={thumbUrl(item.src, 1920, 1000)}
                    sizes="100vw"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    alt={item.title}
                    width="1920"
                    height="1000"
                  />
                </picture>
              </figure>
              <div className="slideshow__info">
                <div className="slideshow__info-card">
                  {item.title ? <h3 className="slideshow__name">{item.title}</h3> : null}
                  {item.desc ? <p className="slideshow__desc">{item.desc}</p> : null}
                  <Link className="slideshow__btn" to={item.link}>
                    <span>Đặt lịch hẹn ngay</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="slideshow__pagination">
          {items.map((item, i) => (
            <button
              type="button"
              key={item.id || i}
              className={`slideshow__bullet ${i === index ? 'is-active' : ''}`}
              aria-label={`Chuyển slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
