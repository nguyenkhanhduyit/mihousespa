import { useRef } from 'react';
import { Swiper as SwiperCore } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/**
 * SwiperCarousel — bọc Swiper. Cấu hình có thể truyền bằng:
 *  - `config`: chuỗi "data-swiper" của site mẫu (key:value|key:value)
 *  - hoặc các props rời: slidesPerView, spaceBetween, autoplayDelay, speed, ...
 */
export function parseSwiperConfig(raw = '') {
  const config = {};
  if (typeof raw !== 'string') return config;

  raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf(':');
      if (idx < 0) return;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key) return;
      if (value === 'true') config[key] = true;
      else if (value === 'false') config[key] = false;
      else if (/^-?\d+(\.\d+)?$/.test(value)) config[key] = Number(value);
      else config[key] = value;
    });

  // `breakpoints:{...}` chỉ dùng để tham khảo trong site gốc; React dùng props riêng.
  delete config.breakpoints;
  return config;
}

export default function SwiperCarousel({
  config = '',
  slides = [],
  className = '',
  effect = 'slide',
  slidesPerView: slidesPerViewProp,
  spaceBetween: spaceBetweenProp,
  loop = true,
  speed: speedProp,
  autoplayDelay: autoplayDelayProp,
  pauseOnMouseEnter: pauseOnMouseEnterProp,
  disableOnInteraction = false,
  breakpoints,
}) {
  const swiperRef = useRef(null);
  const parsed = parseSwiperConfig(config);

  const modules = [Pagination, Autoplay];
  if (effect !== 'slide') modules.push(Navigation);

  const slidesPerView = slidesPerViewProp ?? parsed.slidesPerView ?? 1;
  const spaceBetween = spaceBetweenProp ?? parsed.spaceBetween ?? 0;
  const speed = speedProp ?? parsed.speed ?? 1000;
  const hasAutoplay = autoplayDelayProp != null || parsed.autoplay;
  const autoplayDelay = autoplayDelayProp ?? parsed.autoplay?.delay ?? 5000;
  const pauseOnMouseEnter = pauseOnMouseEnterProp ?? parsed.autoplay?.pauseOnMouseEnter ?? true;

  return (
    <SwiperCore
      modules={modules}
      className={`swiper swiper-auto ${className}`.trim()}
      slidesPerView={slidesPerView}
      spaceBetween={spaceBetween}
      loop={parsed.loop ?? loop}
      speed={speed}
      lazy={parsed.lazy !== false}
      breakpoints={breakpoints}
      autoplay={
        hasAutoplay
          ? {
              delay: autoplayDelay,
              pauseOnMouseEnter,
              disableOnInteraction,
            }
          : false
      }
      pagination={{ clickable: true }}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
    >
      {slides}
    </SwiperCore>
  );
}
