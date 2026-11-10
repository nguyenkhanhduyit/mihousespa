import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';

const FIELDS = [
  { key: 'namevi', label: 'Tên website' },
  { key: 'nameen', label: 'Tên website (EN)' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'hotline', label: 'Hotline' },
  { key: 'zalo', label: 'Zalo' },
  { key: 'website', label: 'Website' },
  { key: 'addressvi', label: 'Địa chỉ' },
  { key: 'worktime', label: 'Giờ làm việc' },
  { key: 'fanpage', label: 'Fanpage Facebook' },
  { key: 'link_googlemaps', label: 'Link Google Maps' },
  { key: 'coords', label: 'Toạ độ' },
  { key: 'coords_iframe', label: 'Google Maps (iframe)' },
  { key: 'title', label: 'SEO Title' },
  { key: 'description', label: 'SEO Description' },
  { key: 'keywords', label: 'SEO Keywords' },
];

/** Field nằm trong cột `options` (JSON) — gửi lên API dưới dạng options.* */
const OPTION_FIELDS = new Set([
  'email', 'phone', 'hotline', 'zalo', 'website', 'worktime', 'fanpage',
  'link_googlemaps', 'coords', 'coords_iframe', 'title', 'description', 'keywords',
]);

export default function SettingsManager() {
  const [form, setForm] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api.settings
      .get()
      .then((res) => {
        if (!alive) return;
        const d = res?.data || {};
        const o = d.options || {};
        setOptions(o);
        const next = {};
        FIELDS.forEach((f) => {
          // ưu tiên giá trị ở top-level, fallback sang options
          next[f.key] = d[f.key] ?? o[f.key] ?? '';
        });
        setForm(next);
      })
      .catch((err) => toast.error(err.message || 'Không tải được cấu hình'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setOption(key, value) {
    setOptions((o) => ({ ...o, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Tách field cột cố định và field trong `options`
      const columns = {};
      const optPayload = { ...options };
      FIELDS.forEach((f) => {
        if (OPTION_FIELDS.has(f.key)) {
          optPayload[f.key] = form[f.key];
        } else {
          columns[f.key] = form[f.key];
        }
      });
      const res = await api.settings.update({ ...columns, options: optPayload });
      if (res?.status !== 'success') throw new Error(res?.message || 'Lưu thất bại');
      toast.success(res.message || 'Cập nhật cấu hình thành công');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Cấu hình website</h1>
        <p className="mt-1 text-sm text-ink-500">Thông tin liên hệ, SEO và các tuỳ chọn hiển thị.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">Thông tin chung</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.slice(0, 9).map((f) => (
              <div key={f.key} className={f.key === 'addressvi' || f.key === 'link_googlemaps' ? 'sm:col-span-2' : ''}>
                <label className="label" htmlFor={`set-${f.key}`}>{f.label}</label>
                <input
                  id={`set-${f.key}`}
                  className="field"
                  value={form[f.key] || ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">SEO</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.slice(9).map((f) => (
              <div key={f.key} className={f.key === 'description' ? 'sm:col-span-2' : ''}>
                <label className="label" htmlFor={`set-${f.key}`}>{f.label}</label>
                {f.key === 'description' ? (
                  <textarea
                    id={`set-${f.key}`}
                    rows={3}
                    className="field resize-none"
                    value={form[f.key] || ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    id={`set-${f.key}`}
                    className="field"
                    value={form[f.key] || ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">Bản đồ &amp; tọa độ</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="set-coords">Toạ độ (lat, lng)</label>
              <input id="set-coords" className="field" value={form.coords || ''} onChange={(e) => setField('coords', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="set-coords-iframe">Google Maps iframe</label>
              <textarea
                id="set-coords-iframe"
                rows={4}
                className="field font-mono text-xs"
                value={form.coords_iframe || ''}
                onChange={(e) => setField('coords_iframe', e.target.value)}
                placeholder="<iframe src=...></iframe>"
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">Tuỳ chọn khác</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.keys(options).map((key) => (
              <div key={key}>
                <label className="label" htmlFor={`opt-${key}`}>{key}</label>
                <input
                  id={`opt-${key}`}
                  className="field"
                  value={typeof options[key] === 'object' ? JSON.stringify(options[key]) : options[key] ?? ''}
                  onChange={(e) => setOption(key, e.target.value)}
                />
              </div>
            ))}
            {Object.keys(options).length === 0 && (
              <p className="text-sm text-ink-400">Chưa có tuỳ chọn nào được lưu.</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <Button type="submit" variant="admin" loading={saving} className="shadow-lg">
            {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
          </Button>
        </div>
      </form>
    </>
  );
}