import { useEffect, useRef } from 'react';

/**
 * LazyBackground — nạp ảnh nền khi phần tử sắp vào viewport.
 * Giống cơ chế `lazy-background` + `data-bg-image` của site mẫu.
 */
export default function LazyBackground({ image, options = 'center / cover no-repeat', className = '', children, style, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !image) return undefined;

    const apply = () => {
      el.style.backgroundImage = `url("${image}")`;
      el.style.backgroundSize = options.split('/')[1]?.trim() || 'cover';
      el.style.backgroundPosition = options.split('/')[0]?.trim() || 'center';
      el.style.backgroundRepeat = options.split('no-repeat')[1]?.trim() || 'no-repeat';
      el.classList.add('is-loaded');
    };

    if (typeof IntersectionObserver === 'undefined') {
      apply();
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            apply();
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [image, options]);

  return (
    <div ref={ref} className={`lazy-background ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}
