import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import { useRipple } from '../hooks/useRipple.js';

/**
 * Header — 100% replica của navigation trên http://mihousespa.com/
 * Markup theo đúng class: navigation / navigation__container / navigation__bar /
 * navigation__main / navigation__list level-0 / navigation__separator / navigation__mobile
 */
const NAV = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Giới thiệu', to: '/gioi-thieu' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Bảng giá', to: '/bang-gia' },
  { label: 'Đào tạo', to: '/dao-tao' },
  {
    label: 'Album ảnh',
    to: '/album-anh',
    children: [
      { label: 'Nail hottrend', to: '/nail-hottrend' },
      { label: 'Không gian', to: '/khong-gian' },
    ],
  },
  { label: 'Tin tức', to: '/tin-tuc' },
  { label: 'Liên hệ', to: '/lien-he' },
];

export default function Header({ onOpenBooking }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [settings, setSettings] = useState(null);
  const location = useLocation();
  const ripple = useRipple();

  useEffect(() => {
    setOpen(false);
    setExpanded(null);
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

  const logo = useMemo(() => {
    const photos = settings?.photos || [];
    const found = photos.find((p) => p.type === 'logo' || p.menu === 'logo');
    return found?.url || found?.photo || '/upload/photo/2026/09/18/99cc7455-142a-44ff-8b8d-2e4b90c81c10-removebg-preview-1789700965.webp';
  }, [settings]);

  const isActive = (item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

  return (
    <>
      {/* Schema.org hidden SEO block — giống site gốc */}
      <header id="header-primary">
        <ul className="h-card hidden-seo">
          <li className="h-fn fn">Mi House Spa Beauty</li>
          <li className="h-org org">Mi House Spa Beauty</li>
          <li className="h-tel tel">0767882407</li>
          <li>
            <a className="u-url ul" href="https://mihousespa.com/">
              https://mihousespa.com/
            </a>
          </li>
        </ul>
        <h1 className="hidden-seo">Mi House Spa Beauty</h1>
      </header>

      <section className={`navigation will-fixed virtual-space is-index ${open ? 'is-mobile-open' : ''}`}>
        <div className="navigation__container wrap-content">
          <div className="navigation__bar">
            <figure className="logo navigation__logo">
              <Link className="logo__photo ripple" to="/" onClick={ripple} aria-label="Mi House Spa - Trang chủ">
                <img src={logo} alt="Mi House Spa" width="120" height="120" />
              </Link>
            </figure>

            <nav className="navigation__main">
              <ul className="navigation__list level-0">
                {NAV.map((item, idx) => {
                  const active = isActive(item);
                  return (
                    <li key={item.to} className="navigation__item">
                      {idx > 0 && <li className="navigation__separator" role="separator" />}
                      {item.children ? (
                        <>
                          <Link
                            className={`navigation__link ripple ${active ? 'active' : ''}`}
                            to={item.to}
                            onClick={ripple}
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            className="navigation__button show-child"
                            aria-label={`Mở ${item.label}`}
                            onClick={() => setExpanded(expanded === item.to ? null : item.to)}
                          >
                            <span className="fa-solid fa-angle-down" />
                          </button>
                          <ul className={`navigation__list level-1 ${expanded === item.to ? 'is-open' : ''}`}>
                            {item.children.map((child) => (
                              <li key={child.to} className="navigation__item no-child">
                                <Link className="navigation__link ripple" to={child.to} onClick={ripple}>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Link
                          className={`navigation__link ripple ${active ? 'active' : ''}`}
                          to={item.to}
                          onClick={ripple}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <button
              type="button"
              className="navigation__button open-nav"
              aria-label="Mở menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className="navigation__mobile">
            <figure className="logo navigation__logo">
              <Link className="logo__photo" to="/" onClick={() => setOpen(false)} aria-label="Mi House Spa">
                <img src={logo} alt="Mi House Spa" width="120" height="120" />
              </Link>
            </figure>
            <nav className="navigation__main">
              <ul className="navigation__list level-0">
                {NAV.map((item, idx) => (
                  <li key={item.to} className="navigation__item">
                    {idx > 0 && <li className="navigation__separator" role="separator" />}
                    <Link className="navigation__link" to={item.to} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                    {item.children && (
                      <ul className="navigation__list level-1 is-open">
                        {item.children.map((child) => (
                          <li key={child.to} className="navigation__item no-child">
                            <Link className="navigation__link" to={child.to} onClick={() => setOpen(false)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            {onOpenBooking && (
              <button
                type="button"
                className="home__btn navigation__booking ripple"
                onClick={() => {
                  setOpen(false);
                  onOpenBooking();
                }}
              >
                <span>Đặt lịch ngay</span>
                <span className="fa-regular fa-arrow-right-long" />
              </button>
            )}
          </div>

          <div className="navigation__overlay" onClick={() => setOpen(false)} aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
