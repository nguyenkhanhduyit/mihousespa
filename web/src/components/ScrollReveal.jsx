import { useEffect, useRef } from 'react';

/**
 * ScrollReveal — đánh dấu phần tử vào viewport để chạy animation
 * tương ứng với `scroll-animate` của site mẫu.
 */
export default function ScrollReveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.setAttribute('data-scroll-animate', '');
    if (delay) el.style.transitionDelay = `${delay}ms`;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
