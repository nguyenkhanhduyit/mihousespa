import { useEffect, useState, useCallback } from 'react';

/**
 * Hook fetch dữ liệu từ API.
 * - `params` thay đổi → refetch tự động
 * - `enabled=false` → bỏ qua (lazy)
 */
export default function useFetch(fetcher, params, { enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(params);
      if (res?.status !== 'success') throw new Error(res?.message || 'Không tải được dữ liệu');
      setData(res.data ?? null);
      const d = res.data;
      if (Array.isArray(d)) {
        setItems(d);
        setTotal(d.length);
      } else if (d && Array.isArray(d.items)) {
        setItems(d.items);
        setTotal(d.total ?? d.items.length);
      }
      return res;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run]);

  return { data, items, total, loading, error, refetch: run, setItems, setTotal };
}
