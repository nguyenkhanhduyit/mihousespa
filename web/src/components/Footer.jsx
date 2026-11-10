import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import LazyBackground from './LazyBackground.jsx';
import { useRipple } from '../hooks/useRipple.js';

const FOOTER_MENU = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Giới thiệu', to: '/gioi-thieu' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Bảng giá', to: '/bang-gia' },
  { label: 'Album ảnh', to: '/album-anh' },
  { label: 'Đào tạo', to: '/dao-tao' },
  { label: 'Liên hệ', to: '/lien-he' },
];

const POLICIES = [
  { label: 'Chính sách hỗ trợ', to: '/chinh-sach-ho-tro' },
  { label: 'Chính sách thanh toán', to: '/chinh-sach-thanh-toan' },
  { label: 'Chính sách hướng dẫn', to: '/chinh-sach-huong-dan' },
  { label: 'Chính sách bảo hành', to: '/chinh-sach-bao-hanh' },
  { label: 'Chính sách dịch vụ', to: '/chinh-sach-dich-vu' },
];

const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4541.310265555282!2d106.67502277566014!3d10.827103189324765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175290008d54311%3A0x5901d51929d43331!2smi%20house%20Spa!5e1!3m2!1svi!2s!4v1789012090576!5m2!1svi!2s';

/**
 * Footer — 100% replica của footer trên http://mihousespa.com/
 * Gồm footer__group (bg), footer__article (5 cột), footer__powered, footer__map.
 */
export default function Footer() {
  const [settings, setSettings] = useState(null);
  const ripple = useRipple();

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

  const photos = settings?.photos || [];
  const logo =
    photos.find((p) => p.type === 'logo' || p.menu === 'logo')?.url ||
    photos.find((p) => p.type === 'logo' || p.menu === 'logo')?.photo ||
    '/upload/photo/2026/09/18/99cc7455-142a-44ff-8b8d-2e4b90c81c10-removebg-preview-1789700957.webp';

  const socials = photos.filter((p) => p.type === 'mang-xa-hoi' || p.menu === 'mang-xa-hoi');

  const address = settings?.address || '43 đường Quang Trung, phường Gò Vấp, Thành Phố Hồ Chí Minh';
  const hotline = settings?.hotline || settings?.phone || '0767882407';
  const email = settings?.email || 'nguyenquynhdiem1988@gmail.com';

  return (
    <footer className="footer" id="footer-primary">
      <LazyBackground className="footer__group" image="/assets/images/footer-bg.jpg" options="center / cover no-repeat">
        <section className="footer__article py:60">
          <div className="wrap-content">
            <div className="footer__article-list">
              <div className="footer__article-item">
                <figure className="logo footer__logo">
                  <Link className="logo__photo ripple" to="/" onClick={ripple}>
                    <img src={logo} alt="Mi House Spa" width="140" height="140" />
                  </Link>
                </figure>
                <h2 className="footer__name">Mi House Spa</h2>
                <p className="footer__desc">Gội đầu dưỡng sinh - Massage body - Nail</p>
              </div>

              <div className="footer__article-item">
                <div className="footer__info">
                  <h2 className="footer__title">Thông tin liên hệ</h2>
                  <address className="footer__content ck-editor">
                    <p>Địa Chỉ: {address}</p>
                    <p>
                      Hotline: <a href={`tel:${hotline.replace(/\s/g, '')}`}>{hotline}</a>
                    </p>
                    <p>
                      Email: <a href={`mailto:${email}`}>{email}</a>
                    </p>
                    <p>Website: mihousespa.com</p>
                  </address>
                </div>
              </div>

              <div className="footer__article-item">
                <div className="footer__nav footer__policy">
                  <h2 className="footer__title">Danh mục</h2>
                  <ul className="footer__nav-list">
                    {FOOTER_MENU.map((item) => (
                      <li key={item.to} className="footer__nav-item">
                        <Link className="footer__nav-name hvr-underline" to={item.to}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="footer__article-item">
                <div className="footer__nav footer__policy">
                  <h2 className="footer__title">Chính sách quy định</h2>
                  <ul className="footer__nav-list">
                    {POLICIES.map((item) => (
                      <li key={item.to} className="footer__nav-item">
                        <Link className="footer__nav-name hvr-underline" to={item.to}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="footer__article-item">
                <div className="footer__social">
                  <h2 className="footer__title">Follow us</h2>
                  <div className="social">
                    <ul className="social__list">
                      {socials.length > 0 ? (
                        socials.map((item) => (
                          <li key={item.id || item.url} className="social__item">
                            <a
                              className="social__item-inner block-normal"
                              href={item.link || item.url || '#'}
                              target="_blank"
                              rel="nofollow"
                            >
                              <figure className="social__photo">
                                <img src={item.url || item.photo} alt={item.name || ''} width="26" height="26" />
                              </figure>
                              <span className="social__name">{item.name || item.title}</span>
                            </a>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="social__item">
                            <a
                              className="social__item-inner block-normal"
                              href="https://www.facebook.com/mihousespa/"
                              target="_blank"
                              rel="nofollow"
                            >
                              <figure className="social__photo">
                                <img src="/upload/photo/2026/09/04/fb-1788513580.webp" alt="Facebook" width="26" height="26" />
                              </figure>
                              <span className="social__name">Facebook</span>
                            </a>
                          </li>
                          <li className="social__item">
                            <a
                              className="social__item-inner block-normal"
                              href="https://maps.app.goo.gl/FGYh7DnPTGSz6qNc8"
                              target="_blank"
                              rel="nofollow"
                            >
                              <figure className="social__photo">
                                <img src="/upload/photo/2026/09/04/ggmap-1788513613.webp" alt="Google Map" width="26" height="26" />
                              </figure>
                              <span className="social__name">Google Map</span>
                            </a>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="footer__powered">
          <div className="wrap-content">
            <div className="footer__copyright">
              Copyright © <span>Mi House Spa Beauty</span>. <span>All rights reserved.</span>{' '}
              <span>
                Designed by{' '}
                <a href="https://nasani.vn" target="_blank" rel="nofollow">
                  Nasani.vn
                </a>
              </span>
            </div>
          </div>
        </section>
      </LazyBackground>

      <section className="footer__map">
        <div className="google-map footer__map-iframe">
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
      </section>
    </footer>
  );
}
