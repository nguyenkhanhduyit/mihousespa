import { useEffect, useRef } from 'react';

/**
 * TextSplit — tách text thành từng dòng/từ để chạy animation trượt lên (giống site mẫu).
 * Dùng cho class `.text-split` kèm hiệu ứng khi vào viewport.
 */
export default function TextSplit({ text, as: Tag = 'span', className = '', delayStep = 45, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const raw = el.getAttribute('data-raw-text');
    const content = raw ?? el.textContent ?? '';
    const words = content.split(/(\s+)/);

    el.textContent = '';
    const line = document.createElement('span');
    line.className = 'split-line';

    let index = 0;
    words.forEach((word) => {
      if (/^\s+$/.test(word)) {
        line.appendChild(document.createTextNode(' '));
        return;
      }
      const wrap = document.createElement('span');
      wrap.className = 'split-word';
      wrap.style.setProperty('--split-delay', `${index * delayStep}ms`);
      wrap.textContent = word;
      line.appendChild(wrap);
      index += 1;
    });

    el.appendChild(line);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);

    return () => io.disconnect();
  }, [text, delayStep]);

  return (
    <Tag ref={ref} className={`text-split ${className}`.trim()} data-raw-text={text} {...rest}>
      {text}
    </Tag>
  );
}
