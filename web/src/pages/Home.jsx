import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import LazyBackground from '../components/LazyBackground.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import SwiperCarousel from '../components/SwiperCarousel.jsx';
import HeroSlideshow from '../components/HeroSlideshow.jsx';
import TextSplit from '../components/TextSplit.jsx';
import { useRipple } from '../hooks/useRipple.js';

/* ---------- helpers ---------- */
const stripHtml = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const imgUrl = (item, fallback = '') => {
  if (!item) return fallback;
  const raw = item.photo || item.url || item.image || '';
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
};

/* ---------- Section: Intro ---------- */
function Intro({ intro, galleryImages }) {
  const ripple = useRipple();
  const slides = galleryImages.slice(0, 12);

  return (
    <section className="intro">
      <div className="intro__container">
        <LazyBackground
          className="intro__left lazy-background py:80 lg:w-100"
          image="/assets/images/intro-bg.jpg"
          options="center / cover no-repeat"
        >
          <div className="intro__info">
            <h2 className="intro__title">Đôi nét về</h2>
            <h3 className="intro__name">MI HOUSE SPA</h3>
            <p className="intro__slogan">Gội đầu dưỡng sinh - Massage body</p>
            <div className="intro__desc ck-editor">
              {intro?.content ? (
                <div dangerouslySetInnerHTML={{ __html: intro.content }} />
              ) : (
                <p>
                  <strong>Mi House Spa</strong> là địa chỉ chăm sóc sức khỏe và sắc đẹp theo phong cách dưỡng
                  sinh tại Gò Vấp, TP.HCM. Với không gian mang gam màu <strong>nâu – be</strong> ấm áp, nhẹ nhàng
                  cùng phong cách phục vụ tận tâm, Mi House Spa mang đến một nơi để bạn tạm gác lại những mệt
                  mỏi, thư giãn cơ thể và chăm sóc bản thân sau những giờ làm việc, học tập bận rộn.
                </p>
              )}
            </div>
            <Link className="home__btn intro__btn ripple" to="/gioi-thieu" onClick={ripple}>
              <span>Khám phá thêm</span>
              <span className="fa-regular fa-arrow-right-long" />
            </Link>

            <div className="intro-gallery">
              <div className="intro-gallery__list">
                <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={15}
                  autoplayDelay={3000}
                  pauseOnMouseEnter={false}
                  speed={1000}
                  breakpoints={{
                    321: { slidesPerView: 2, spaceBetween: 15 },
                    577: { slidesPerView: 3, spaceBetween: 15 },
                    851: { slidesPerView: 4, spaceBetween: 15 },
                    1025: { slidesPerView: 5, spaceBetween: 15 },
                    1201: { slidesPerView: 5, spaceBetween: 15 },
                  }}
                  slides={slides.map((img, i) => (
                    <div className="swiper-slide" key={img.id || img.url || i}>
                      <figure className="album-featured__item">
                        <img
                          className="album-featured__image w-100"
                          src={imgUrl(img)}
                          loading="lazy"
                          decoding="async"
                          alt=""
                          width="360"
                          height="360"
                        />
                      </figure>
                    </div>
                  ))}
                />
              </div>
            </div>
          </div>
        </LazyBackground>

        <div className="intro__right lg:w-100">
          <figure className="intro__media">
            <img className="intro__media-image w-100" src="/assets/images/intro-bg.jpg" alt="MI HOUSE SPA" />
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Service featured ---------- */
function ServiceFeatured({ services }) {
  const ripple = useRipple();
  const list = services.slice(0, 9);

  return (
    <section className="service-featured py:100">
      <div className="service-featured__container wrap-content">
        <header className="home__header service-featured__header xl:flex-100">
          <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1">
            Services
          </div>
          <h2 className="home__title ff:title fw:700 fsz:60 text-uppercase text:theme-brand m-0">
            Dịch vụ tiêu biểu
          </h2>
        </header>

        <div className="service__list service-featured__body xl:w-100">
          <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={0}
                  autoplayDelay={5000}
                  pauseOnMouseEnter={true}
                  speed={1000}
            breakpoints={{
              321: { slidesPerView: 1 },
              577: { slidesPerView: 2 },
              851: { slidesPerView: 3 },
              1025: { slidesPerView: 3 },
              1201: { slidesPerView: 3 },
            }}
            slides={list.map((s, i) => (
              <div className="swiper-slide" key={s.id || i}>
                <div className="service__item">
                  <article className="service__card">
                    <figure className="service__media">
                      <Link className="service__media-link scale-img" to={s.link || '/dich-vu'}>
                        <img
                          className="service__media-image w-100"
                          src={imgUrl(s)}
                          loading="lazy"
                          decoding="async"
                          alt={s.namevi || s.name || ''}
                          width="500"
                          height="800"
                        />
                      </Link>
                    </figure>
                    <div className="service__info">
                      <h3 className="service__name">
                        <TextSplit as="a" className="text-split transition" text={s.namevi || s.name || ''} to={s.link || '/dich-vu'} />
                      </h3>
                    </div>
                  </article>
                </div>
              </div>
            ))}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Price ---------- */
function ServicePrice({ prices }) {
  const ripple = useRipple();
  const list = prices.slice(0, 12);

  return (
    <LazyBackground
      className="service-price lazy-background py:100"
      image="/assets/images/service-price-bg.png"
      options="center / cover no-repeat"
    >
      <header className="home__header text-center mb:2.5rem">
        <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#ffffff mb:-16">
          Price
        </div>
        <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:white">
          Bảng giá dịch vụ
        </h2>
      </header>

      <div className="wrap-content">
        <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={20}
                  autoplayDelay={5000}
                  pauseOnMouseEnter={true}
                  speed={1000}
          breakpoints={{
            577: { slidesPerView: 2, spaceBetween: 20 },
            851: { slidesPerView: 3, spaceBetween: 20 },
            1201: { slidesPerView: 4, spaceBetween: 20 },
          }}
          slides={list.map((p, i) => (
            <div className="swiper-slide" key={p.id || i}>
              <article className="service__price-item">
                <figure className="service__price-media">
                  <img
                    className="service__price-image w-100"
                    src={imgUrl(p)}
                    loading="lazy"
                    decoding="async"
                    alt={p.namevi || p.name || ''}
                    width="480"
                    height="710"
                  />
                </figure>
                <div className="service__price-info">
                  <h3 className="service__price-name">{p.namevi || p.name}</h3>
                  {p.price ? <div className="service__price-value">{p.price}</div> : null}
                </div>
              </article>
            </div>
          ))}>
        </SwiperCarousel>
      </div>
    </LazyBackground>
  );
}

/* ---------- Section: Why choose ---------- */
const WHY_ITEMS = [
  {
    name: 'Uy tín chất lượng',
    desc: 'Tận tâm trong từng dịch vụ, chú trọng chất lượng và mang đến trải nghiệm chăm sóc sắc đẹp, thư giãn đáng tin cậy cho mỗi khách hàng.',
  },
  {
    name: 'Chi phí hợp lý',
    desc: 'Mức giá hợp lý, minh bạch, phù hợp với nhu cầu làm đẹp và thư giãn của nhiều khách hàng.',
  },
  {
    name: 'Không gian sang trọng',
    desc: 'Không gian nâu – be tinh tế, ấm cúng và thanh lịch, mang đến cảm giác thư giãn và thoải mái ngay từ khi bước vào.',
  },
  {
    name: 'Tư vấn nhiệt tình',
    desc: 'Đội ngũ Mi House Spa luôn lắng nghe, tư vấn tận tình và hỗ trợ khách hàng lựa chọn dịch vụ phù hợp với nhu cầu, sở thích và mong muốn cá nhân.',
  },
];

function WhyChoose() {
  return (
    <section className="why-choose py:80">
      <header className="home__header text-center mb:2.5rem">
        <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1 mb:-16">
          Why Choose
        </div>
        <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:theme-brand-dark">
          Vì sao chọn Mi House Spa
        </h2>
        <p className="why-choose__desc">
          Mi House Spa mang đến trải nghiệm dưỡng sinh tinh tế trong không gian nâu – be thanh lịch, ấm cúng. Với
          dịch vụ gội đầu dưỡng sinh, massage và nail được chăm chút chỉn chu, mỗi lần ghé spa là một lần
          thư giãn trọn vẹn.
        </p>
      </header>

      <div className="wrap-content">
        <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={20}
                  autoplayDelay={5000}
                  pauseOnMouseEnter={true}
                  speed={1000}
          breakpoints={{
            577: { slidesPerView: 2, spaceBetween: 20 },
            851: { slidesPerView: 3, spaceBetween: 20 },
            1025: { slidesPerView: 4, spaceBetween: 20 },
          }}
          slides={WHY_ITEMS.map((item, i) => (
            <div className="swiper-slide" key={item.name}>
              <article className="why-choose__item">
                <figure className="why-choose__media">
                  <img src="/assets/images/icon-3stars.png" alt="" width="120" height="120" loading="lazy" />
                </figure>
                <div className="why-choose__info">
                  <h3 className="why-choose__name">{item.name}</h3>
                  <p className="why-choose__desc">{item.desc}</p>
                </div>
              </article>
            </div>
          ))}
        />
      </div>
    </section>
  );
}

/* ---------- Section: Training ---------- */
function TrainingFeatured({ training }) {
  const ripple = useRipple();
  return (
    <section className="training-featured my:100">
      <header className="home__header mb:1rem">
        <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1 mb:-16">
          Training
        </div>
        <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:theme-brand-dark mb-0">
          Đào tạo học viên
        </h2>
      </header>

      <div className="wrap-content">
        <article className="training-featured__item">
          <div className="training-featured__media">
            <img
              className="training-featured__image w-100"
              src={imgUrl(training)}
              alt={training?.namevi || 'Đào tạo'}
              loading="lazy"
              width="1920"
              height="1000"
            />
          </div>
          <div className="training-featured__info">
            <h3 className="training-featured__name">
              {training?.namevi || 'KHÓA ĐÀO TẠO NGHỀ DƯỠNG SINH CHUYÊN NGHIỆP TẠI MI HOUSE SPA'}
            </h3>
            <div className="training-featured__desc ck-editor">
              {training?.content ? (
                <div dangerouslySetInnerHTML={{ __html: training.content }} />
              ) : (
                <p>
                  Chăm sóc sức khỏe và làm đẹp theo hướng thư giãn đang trở thành xu hướng thịnh hành với tiềm
                  năng phát triển mạnh mẽ.
                </p>
              )}
            </div>
            <div className="training-featured__price">
              Học phí: <strong>Liên hệ</strong>
            </div>
            <Link className="home__btn training-featured__btn ripple" to="/dao-tao" onClick={ripple}>
              <span>Khám phá thêm</span>
              <span className="fa-regular fa-arrow-right-long" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ---------- Section: Album featured ---------- */
function AlbumFeatured({ nailImages, spaceImages }) {
  return (
    <section className="album-featured py:80">
      <div className="album-featured__list">
        <h3 className="album-featured__title">Nail hottrend</h3>
        <div className="splide album-featured__splide">
          <div className="splide__track">
            <div className="splide__list">
              {nailImages.slice(0, 12).map((img, i) => (
                <div className="splide__slide" key={img.id || img.url || i}>
                  <figure className="album-featured__item">
                    <img
                      className="album-featured__image w-100"
                      src={imgUrl(img)}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      width="360"
                      height="360"
                    />
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="album-featured__list">
        <div className="splide album-featured__splide">
          <div className="splide__track">
            <div className="splide__list">
              {spaceImages.slice(0, 12).map((img, i) => (
                <div className="splide__slide" key={img.id || img.url || i}>
                  <figure className="album-featured__item">
                    <img
                      className="album-featured__image w-100"
                      src={imgUrl(img)}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      width="360"
                      height="360"
                    />
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </div>
        <h3 className="album-featured__title">Không gian</h3>
      </div>
    </section>
  );
}

/* ---------- Section: Video featured ---------- */
function VideoFeatured({ videos }) {
  const ripple = useRipple();
  return (
    <section className="video-featured my:100">
      <header className="home__header video-featured__header xl:flex-100">
        <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1 mb:-16">
          Video
        </div>
        <h2 className="home__title ff:title fw:700 fsz:60 text-uppercase text:theme-brand m-0">
          Liên kết tiktok
        </h2>
      </header>

      <div className="wrap-content">
        <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={16}
                  autoplayDelay={5000}
                  pauseOnMouseEnter={true}
                  speed={1000}
          breakpoints={{
            577: { slidesPerView: 2, spaceBetween: 20 },
            851: { slidesPerView: 3, spaceBetween: 20 },
          }}
          slides={videos.slice(0, 9).map((v, i) => (
            <div className="swiper-slide" key={v.id || i}>
              <article className="video__item">
                <figure className="video__media">
                  {v.link ? (
                    <a href={v.link} target="_blank" rel="nofollow" className="video__media-link">
                      <img className="video__image w-100" src={imgUrl(v)} alt={v.namevi || ''} loading="lazy" />
                    </a>
                  ) : (
                    <img className="video__image w-100" src={imgUrl(v)} alt={v.namevi || ''} loading="lazy" />
                  )}
                </figure>
                <h3 className="video__name text-split">{v.namevi || v.name || ''}</h3>
              </article>
            </div>
          ))}
        />
      </div>
    </section>
  );
}

/* ---------- Section: News featured ---------- */
function NewsFeatured({ news }) {
  const ripple = useRipple();
  const list = news.slice(0, 11);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (list.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % list.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [list.length]);

  const current = list[active];

  return (
    <section className="news-featured py:100">
      <div className="news-featured__container wrap-content">
        <div className="news-featured__left md:w-100">
          <div className="news-featured__list">
            <SwiperCarousel
                  slidesPerView={1}
                  spaceBetween={20}
                  autoplayDelay={5000}
                  pauseOnMouseEnter={true}
                  speed={1000}
              slides={list.map((n, i) => (
                <div className="swiper-slide" key={n.id || i}>
                  <article className="news-featured__item">
                    <figure className="news-featured__media">
                      <img
                        className="news-featured__media-image w-100"
                        src={imgUrl(n)}
                        loading="lazy"
                        decoding="async"
                        alt={n.namevi || n.name || ''}
                        width="480"
                        height="780"
                      />
                    </figure>
                  </article>
                </div>
              ))}
            />
          </div>
        </div>

        <div className="news-featured__right md:w-100">
          <header className="home__header mb:1rem">
            <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#ffffff mb:-16">
              News
            </div>
            <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:theme-brand-dark">
              Blog chia sẻ
            </h2>
          </header>

          <div className="news-featured__list">
            {list.map((n, i) => (
              <article
                className={`news-featured__item ${i === active ? 'is-active' : ''}`}
                key={n.id || i}
                style={{ display: i === active ? 'block' : 'none' }}
              >
                <div className="news-featured__info">
                  <h3 className="news-featured__name">
                    <Link className="hvr-underline" to={`/tin-tuc/${n.slugvi || n.slug || ''}`}>
                      {n.namevi || n.name}
                    </Link>
                  </h3>
                  <p className="news-featured__desc">{stripHtml(n.descvi || n.desc || '').slice(0, 320)}</p>
                  <Link className="home__btn news-featured__btn ripple" to={`/tin-tuc/${n.slugvi || n.slug || ''}`} onClick={ripple}>
                    <span>Khám phá thêm</span>
                    <span className="fa-regular fa-arrow-right-long" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= PAGE ================= */
export default function Home() {
  const [data, setData] = useState({
    intro: null,
    services: [],
    prices: [],
    training: null,
    nailImages: [],
    spaceImages: [],
    videos: [],
    news: [],
    galleryImages: [],
    slides: [],
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const [newsRes, galleryRes, staticRes, photoRes] = await Promise.allSettled([
        api.news.list({ limit: 11 }),
        api.gallery.list({}),
        api.staticContent.list({}),
        api.photo.list({ limit: 100 }),
      ]);

      if (!alive) return;

      const news = newsRes.status === 'fulfilled' ? newsRes.value?.data || [] : [];
      const gallery = galleryRes.status === 'fulfilled' ? galleryRes.value?.data || [] : [];
      const statics = staticRes.status === 'fulfilled' ? staticRes.value?.data || [] : [];
      const photos = photoRes.status === 'fulfilled' ? photoRes.value?.data || [] : [];

      const byType = (arr, type) => arr.filter((x) => x.type === type || x.menu === type);
      const bySlug = (arr, slug) => arr.find((x) => x.slugvi === slug || x.slug === slug);

      const nailImages = [
        ...byType(gallery, 'nail-hottrend'),
        ...byType(gallery, 'video').filter((x) => (x.namevi || '').toLowerCase().includes('nail')),
      ];
      const spaceImages = byType(gallery, 'khong-gian');

      setData({
        intro: bySlug(statics, 'gioi-thieu') || statics[0] || null,
        services: byType(news, 'dich-vu'),
        prices: byType(news, 'bang-gia'),
        training: bySlug(statics, 'dao-tao') || byType(news, 'dao-tao')[0] || null,
        nailImages,
        spaceImages,
        videos: byType(photos, 'slideshow').concat(byType(news, 'video')),
        news: news.filter((n) => !['dich-vu', 'bang-gia', 'dao-tao'].includes(n.type)),
        galleryImages: [...nailImages, ...spaceImages],
        slides: [...byType(photos, 'banner'), ...byType(photos, 'slideshow')],
      });
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const { intro, services, prices, training, nailImages, spaceImages, videos, news, galleryImages, slides } = data;

  const introImage = useMemo(() => {
    const found = galleryImages.find((g) => (g.photo || g.url || '').includes('1789886518'));
    return imgUrl(found, '/assets/images/intro-bg.jpg');
  }, [galleryImages]);

  return (
    <>
      <HeroSlideshow slides={slides} />
      <Intro intro={intro} galleryImages={galleryImages} introImage={introImage} />
      <ServiceFeatured services={services} />
      <ServicePrice prices={prices} />
      <WhyChoose />
      <TrainingFeatured training={training} />
      <AlbumFeatured nailImages={nailImages} spaceImages={spaceImages} />
      <VideoFeatured videos={videos} />
      <NewsFeatured news={news} />
    </>
  );
}


