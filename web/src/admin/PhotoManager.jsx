import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

const PHOTO_TYPES = [
  { value: 'menu', label: 'Menu' },
  { value: 'banner', label: 'Banner / Slideshow' },
  { value: 'slideshow', label: 'Slideshow' },
  { value: 'logo', label: 'Logo' },
  { value: 'favicon', label: 'Favicon' },
  { value: 'brands', label: 'Thương hiệu' },
  { value: 'mang-xa-hoi', label: 'Mạng xã hội' },
  { value: 'album', label: 'Album ảnh' },
  { value: 'khong-gian', label: 'Không gian' },
  { value: 'other', label: 'Khác' },
];

const EMPTY = { namevi: '', nameen: '', descvi: '', descen: '', type: 'menu', com: 'photo', photo: '', link: '', numb: 0 };

export default function PhotoManager() {
  const [type, setType] = useState('menu');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState([]);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    api.photo.types().then((res) => setTypes(res?.data || [])).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.photo.adminList({ type, keyword: keyword || undefined, limit: 100 });
      if (res?.status !== 'success') throw new Error(res?.message || 'Không tải được dữ liệu');
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setSelected([]);
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, keyword]);

  function openCreate() {
    setForm({ ...EMPTY, type });
    setFormErrors({});
    setEditing('new');
  }

  function openEdit(item) {
    setForm({
      namevi: item.namevi || '',
      nameen: item.nameen || '',
      descvi: item.descvi || '',
      descen: item.descen || '',
      type: item.type || type,
      com: item.com || 'photo',
      photo: item.photo || '',
      link: item.link || '',
      numb: item.numb || 0,
    });
    setFormErrors({});
    setEditing(item);
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate() {
    const e = {};
    if (!form.namevi.trim()) e.namevi = 'Tên là bắt buộc';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng nhập tên');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, numb: Number(form.numb) || 0 };
      const res = editing === 'new'
        ? await api.photo.create(payload)
        : await api.photo.update(editing.id, payload);
      if (res?.status !== 'success') throw new Error(res?.message || 'Lưu thất bại');
      toast.success(res.message || 'Lưu thành công');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await api.photo.remove(deleting.id);
      if (res?.status !== 'success') throw new Error(res?.message || 'Xoá thất bại');
      toast.success(res.message || 'Xoá thành công');
      setDeleting(null);
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
      const res = await api.photo.removeMany(selected);
      if (res?.status !== 'success') throw new Error(res?.message || 'Xoá thất bại');
      toast.success(res.message || 'Xoá thành công');
      await load();
    } catch (err) {
      toast.error(err.message || 'Không thể xoá');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Ảnh &amp; Album</h1>
          <p className="mt-1 text-sm text-ink-500">{total} ảnh</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden rounded-lg border border-ink-200 bg-white p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${viewMode === 'grid' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              Lưới
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${viewMode === 'table' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              Bảng
            </button>
          </div>
          <Button variant="admin" onClick={openCreate}>Thêm ảnh</Button>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="label">Loại ảnh</label>
            <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
              {PHOTO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <label className="label">Tìm kiếm</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setKeyword(searchInput.trim());
              }}
              className="flex gap-2"
            >
              <input className="field" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm theo tên…" />
              <Button type="submit" variant="admin-outline">Tìm</Button>
              {keyword && (
                <Button type="button" variant="admin-outline" onClick={() => { setSearchInput(''); setKeyword(''); }}>Xoá</Button>
              )}
            </form>
          </div>
          {selected.length > 0 && (
            <Button variant="admin-danger" onClick={handleDeleteMany} loading={deleteLoading}>
              Xoá {selected.length} ảnh
            </Button>
          )}
        </div>

        {types.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
            {types.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(t.type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  type === t.type ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-brand-50'
                }`}
              >
                {t.type} ({t.c})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="skeleton aspect-square" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-500">Chưa có ảnh nào trong nhóm này.</p>
            <Button variant="admin" onClick={openCreate} className="mt-5">Tải ảnh lên</Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
                <div className="aspect-square">
                  <img src={item.photo_url || item.photo} alt={item.namevi} className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink-900/90 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">{item.namevi}</p>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEdit(item)} className="rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-ink-800 hover:bg-white">
                      Sửa
                    </button>
                    <button type="button" onClick={() => setDeleting(item)} className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700">
                      Xoá
                    </button>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() =>
                    setSelected((s) => (s.includes(item.id) ? s.filter((x) => x !== item.id) : [...s, item.id]))
                  }
                  className="absolute left-2 top-2 h-4 w-4 rounded border-white/50 text-brand-600"
                  aria-label={`Chọn ${item.namevi}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.length === items.length}
                      onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    />
                  </th>
                  <th className="w-16">Ảnh</th>
                  <th>Tên</th>
                  <th className="w-28">Loại</th>
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
                        onChange={() =>
                          setSelected((s) => (s.includes(item.id) ? s.filter((x) => x !== item.id) : [...s, item.id]))
                        }
                        className="h-4 w-4 rounded border-ink-300 text-brand-600"
                      />
                    </td>
                    <td>
                      <img src={item.photo_url || item.photo} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-ink-100" />
                    </td>
                    <td className="font-medium text-ink-900">{item.namevi}</td>
                    <td><span className="badge-gray">{item.type}</span></td>
                    <td className="text-ink-600">{item.numb ?? 0}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button variant="admin-outline" size="sm" onClick={() => openEdit(item)}>Sửa</Button>
                        <Button variant="admin-danger" size="sm" onClick={() => setDeleting(item)}>Xoá</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Thêm ảnh' : `Sửa: ${editing?.namevi || ''}`}
        size="md"
        footer={
          <>
            <Button variant="admin-outline" onClick={() => setEditing(null)} disabled={saving}>Huỷ</Button>
            <Button variant="admin" onClick={handleSave} loading={saving} type="submit" form="photo-form">
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form id="photo-form" onSubmit={handleSave} noValidate className="space-y-5">
          <div>
            <label className="label" htmlFor="ph-name">Tên ảnh *</label>
            <input id="ph-name" className="field" value={form.namevi} onChange={(e) => setField('namevi', e.target.value)} placeholder="Nhập tên…" />
            {formErrors.namevi && <p className="error-text">{formErrors.namevi}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ph-type">Loại</label>
              <select id="ph-type" className="field" value={form.type} onChange={(e) => setField('type', e.target.value)}>
                {PHOTO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ph-numb">Thứ tự</label>
              <input id="ph-numb" type="number" className="field" value={form.numb} onChange={(e) => setField('numb', e.target.value)} />
            </div>
          </div>

          <ImagePicker label="Tệp ảnh" value={form.photo} onChange={(v) => setField('photo', v)} />

          <div>
            <label className="label" htmlFor="ph-desc">Mô tả</label>
            <textarea id="ph-desc" rows={3} className="field resize-none" value={form.descvi} onChange={(e) => setField('descvi', e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="ph-link">Liên kết</label>
            <input id="ph-link" className="field" value={form.link} onChange={(e) => setField('link', e.target.value)} placeholder="/dich-vu hoặc https://…" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá ảnh?"
        message={`Ảnh "${deleting?.namevi || ''}" sẽ bị xoá khỏi hệ thống.`}
        confirmText="Xoá"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}