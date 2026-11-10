import { useCallback } from 'react';

/**
 * Click ripple effect — phản hồi click giống site mẫu.
 * Trả về handler gắn vào onClick.
 */
export function useRipple() {
  return useCallback((event) => {
    const target = event?.currentTarget;
    if (!target) return;
    target.classList.remove('is-rippling');
    // ép trình duyệt reflow để animation chạy lại
    void target.offsetWidth;
    target.classList.add('is-rippling');
    window.setTimeout(() => target.classList.remove('is-rippling'), 620);
  }, []);
}

/** Ripple handler gắn trực tiếp lên phần tử qua ref. */
export function attachRipple(el) {
  if (!el || el.dataset.rippleBound === '1') return;
  el.dataset.rippleBound = '1';
  el.classList.add('ripple');
  el.addEventListener(
    'click',
    () => {
      el.classList.remove('is-rippling');
      void el.offsetWidth;
      el.classList.add('is-rippling');
      window.setTimeout(() => el.classList.remove('is-rippling'), 620);
    },
    { passive: true },
  );
}
