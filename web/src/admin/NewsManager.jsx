import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

const NEWS_TYPES = [
  { value: 'tin-tuc', label: 'Tin tức' },
  { value: 'dich-vu', label: 'Dịch vụ' },
  { value: 'bang-gia', label: 'Bảng giá' },
  { value: 'dao-tao', label: 'Đào tạo' },
  { value: 'feedback', label: 'Cảm nhận khách hàng' },
  { value: 'tieu-chi', label: 'Tiêu chí nổi bật' },
  { value: 'video', label: 'Video' },
  { value: 'nail-hottrend', label: 'Nail Hottrend' },
  { value: 'khong-gian', label: 'Không gian' },
  { value: 'album-anh', label: 'Album ảnh' },
  { value: 'album-gioi-thieu', label: 'Album giới thiệu' },
  { value: 'thu-vien-anh', label: 'Thư viện ảnh' },
  { value: 'chinh-sach', label: 'Chính sách' },
];

const EMPTY = {
  type: 'tin-tuc',
  namevi: '',
  nameen: '',
  descvi: '',
  descen: '',
  contentvi: '',
  contenten: '',
  slugvi: '',
  photo: '',
  numb: 0,
  date_publish: new Date().toISOString().slice(0, 10),
};

export default function NewsManager() {
  const { type: routeType } = useParams();
  const [type, setType] = useState(routeType || 'tin-tuc');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (routeType) setType(routeType);
  }, [routeType]);

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [type, keyword]);

  /* ------------------------------ LOAD ------------------------------ */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.news.adminList({ type, keyword: keyword || undefined, page, limit });
      if (res?.status !== 'success') throw new Error(res?.message || 'Không tải được dữ liệu');
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, keyword, page, limit]);

  /* ------------------------------ FORM ------------------------------ */
  function openCreate() {
    setForm({ ...EMPTY, type });
    setFormErrors({});
    setEditing('new');
  }

  function openEdit(item) {
    setForm({
      type: item.type || type,
      namevi: item.namevi || '',
      nameen: item.nameen || '',
      descvi: item.descvi || '',
      descen: item.descen || '',
      contentvi: item.contentvi || '',
      contenten: item.contenten || '',
      slugvi: item.slugvi || '',
      photo: item.photo || '',
      numb: item.numb || 0,
      date_publish: item.date_publish ? String(item.date_publish).slice(0, 10) : '',
    });
    setFormErrors({});
    setEditing(item);
  }

  function closeForm() {
    setEditing(null);
    setFormErrors({});
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate() {
    const e = {};
    if (!form.namevi.trim()) e.namevi = 'Tiêu đề tiếng Việt là bắt buộc';
    if (form.slugvi && !/^[a-z0-9-]+$/i.test(form.slugvi)) e.slugvi = 'Slug chỉ chứa chữ, số và dấu gạch ngang';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ------------------------------ SAVE ------------------------------ */
  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, numb: Number(form.numb) || 0 };
      const res = editing === 'new'
        ? await api.news.create(payload)
        : await api.news.update(editing.id, payload);

      if (res?.status !== 'success') throw new Error(res?.message || 'Lưu thất bại');

      toast.success(res.message || 'Lưu thành công');
      closeForm();
      await load();
    } catch (err) {
      toast.error(err.message || 'Đã xảy ra lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------ DELETE ---------------------------- */
  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await api.news.remove(deleting.id);
      if (res?.status !== 'success') throw new Error(res?.message || 'Xoá thất bại');
      toast.success(res.message || 'Xoá thành công');
      setDeleting(null);
      setSelected((s) => s.filter((id) => id !== deleting.id));
      await load();
    } catch (err) {
      toast.error(err.message || 'Không thể xoá');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteMany() {
    if (!selected.length) {
      toast.error('Vui lòng chọn ít nhất một mục');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api.news.removeMany(selected);
      if (res?.status !== 'success') throw new Error(res?.message || 'Xoá thất bại');
      toast.success(res.message || 'Xoá thành công');
      setSelected([]);
      await load();
    } catch (err) {
      toast.error(err.message || 'Không thể xoá');
    } finally {
      setDeleteLoading(false);
    }
  }

  function toggleAll(e) {
    if (e.target.checked) {
      setSelected(items.map((i) => i.id));
    } else {
      setSelected([]);
    }
  }

  function toggleOne(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allChecked = items.length > 0 && selected.length === items.length;

  const typeLabel = useMemo(
    () => NEWS_TYPES.find((t) => t.value === type)?.label || type,
    [type]
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Quản lý {typeLabel}</h1>
          <p className="mt-1 text-sm text-ink-500">{total} bản ghi</p>
        </div>
        <Button variant="admin" onClick={openCreate} icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        }>
          Thêm mới
        </Button>
      </div>

      {/* Bộ lọc */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="label">Phân loại</label>
            <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
              {NEWS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <label className="label">Tìm kiếm</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setKeyword(searchInput.trim());
              }}
              className="flex gap-2"
            >
              <input
                className="field"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tiêu đề hoặc slug…"
              />
              <Button type="submit" variant="admin-outline">Tìm</Button>
              {keyword && (
                <Button
                  type="button"
                  variant="admin-outline"
                  onClick={() => {
                    setSearchInput('');
                    setKeyword('');
                  }}
                >
                  Xoá
                </Button>
              )}
            </form>
          </div>
          {selected.length > 0 && (
            <Button variant="admin-danger" onClick={handleDeleteMany} loading={deleteLoading}>
              Xoá {selected.length} mục
            </Button>
          )}
        </div>
      </div>

      {/* Bảng */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{error.message}</p>
            <Button variant="admin-outline" onClick={load} className="mt-4">Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-ink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="m3 9 18-3M9 20V10" />
            </svg>
            <p className="mt-3 text-sm text-ink-500">Chưa có bản ghi nào</p>
            <Button variant="admin" onClick={openCreate} className="mt-5">Thêm bản ghi đầu tiên</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th className="w-16">Ảnh</th>
                  <th>Tiêu đề</th>
                  <th className="w-28">Phân loại</th>
                  <th className="w-24">Thứ tự</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                        aria-label={`Chọn ${item.namevi}`}
                      />
                    </td>
                    <td>
                      {item.photo ? (
                        <img
                          src={item.photo_url || item.photo}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover ring-1 ring-ink-100"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-100 text-ink-300">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <path d="m3 9 18-3M9 20V10" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="font-medium text-ink-900">{item.namevi || '(Chưa có tiêu đề)'}</p>
                      {item.slugvi && <p className="mt-0.5 text-xs text-ink-400">/{item.slugvi}</p>}
                    </td>
                    <td>
                      <span className="badge-gray">{item.type}</span>
                    </td>
                    <td className="text-ink-600">{item.numb ?? 0}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button variant="admin-outline" size="sm" onClick={() => openEdit(item)}>
                          Sửa
                        </Button>
                        <Button variant="admin-danger" size="sm" onClick={() => setDeleting(item)}>
                          Xoá
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
            <p className="text-xs text-ink-500">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="admin-outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <Button variant="admin-outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      <Modal
        open={Boolean(editing)}
        onClose={closeForm}
        title={editing === 'new' ? 'Thêm bản ghi mới' : `Sửa: ${editing?.namevi || ''}`}
        subtitle={editing === 'new' ? 'Điền thông tin rồi bấm Lưu' : `ID #${editing?.id}`}
        size="lg"
        footer={
          <>
            <Button variant="admin-outline" onClick={closeForm} disabled={saving}>
              Huỷ
            </Button>
            <Button variant="admin" onClick={handleSave} loading={saving} type="submit" form="news-form">
              {saving ? 'Đang lưu…' : 'Lưu bản ghi'}
            </Button>
          </>
        }
      >
        <form id="news-form" onSubmit={handleSave} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="nm-type">Phân loại *</label>
              <select id="nm-type" className="field" value={form.type} onChange={(e) => setField('type', e.target.value)}>
                {NEWS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="nm-numb">Thứ tự hiển thị</label>
              <input
                id="nm-numb"
                type="number"
                className="field"
                value={form.numb}
                onChange={(e) => setField('numb', e.target.value)}
              />
              <p className="hint">Số nhỏ hiển thị trước</p>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="nm-name">Tiêu đề (tiếng Việt) *</label>
            <input
              id="nm-name"
              className="field"
              value={form.namevi}
              onChange={(e) => setField('namevi', e.target.value)}
              placeholder="Nhập tiêu đề…"
            />
            {formErrors.namevi && <p className="error-text">{formErrors.namevi}</p>}
          </div>

          <div>
            <label className="label" htmlFor="nm-name-en">Tiêu đề (tiếng Anh)</label>
            <input
              id="nm-name-en"
              className="field"
              value={form.nameen}
              onChange={(e) => setField('nameen', e.target.value)}
              placeholder="English title…"
            />
          </div>

          <div>
            <label className="label" htmlFor="nm-slug">Slug (đường dẫn)</label>
            <input
              id="nm-slug"
              className="field"
              value={form.slugvi}
              onChange={(e) => setField('slugvi', e.target.value)}
              placeholder="tu-dong-tu-sinh"
            />
            {formErrors.slugvi && <p className="error-text">{formErrors.slugvi}</p>}
            <p className="hint">Để trống để hệ thống tự sinh từ tiêu đề</p>
          </div>

          <div>
            <label className="label" htmlFor="nm-desc">Mô tả ngắn</label>
            <textarea
              id="nm-desc"
              rows={3}
              className="field resize-none"
              value={form.descvi}
              onChange={(e) => setField('descvi', e.target.value)}
              placeholder="Mô tả hiển thị ở trang danh sách…"
            />
          </div>

          <div>
            <label className="label" htmlFor="nm-content">Nội dung chi tiết</label>
            <textarea
              id="nm-content"
              rows={8}
              className="field font-mono text-xs"
              value={form.contentvi}
              onChange={(e) => setField('contentvi', e.target.value)}
              placeholder="<p>Nội dung HTML…</p>"
            />
            <p className="hint">Hỗ trợ HTML</p>
          </div>

          <ImagePicker
            label="Ảnh đại diện"
            value={form.photo}
            onChange={(v) => setField('photo', v)}
          />

          <div>
            <label className="label" htmlFor="nm-date">Ngày đăng</label>
            <input
              id="nm-date"
              type="date"
              className="field"
              value={form.date_publish}
              onChange={(e) => setField('date_publish', e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Xác nhận xoá */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá bản ghi?"
        message={`Bản ghi "${deleting?.namevi || ''}" sẽ bị xoá vĩnh viễn. Bạn có chắc không?`}
        confirmText="Xoá"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}