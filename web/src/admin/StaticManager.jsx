import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

const EMPTY = { type: '', namevi: '', nameen: '', descvi: '', contentvi: '', slugvi: '', photo: '', is_show: 1 };

export default function StaticManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.staticContent.adminList();
      if (res?.status !== 'success') throw new Error(res?.message || 'Không tải được dữ liệu');
      setItems(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ ...EMPTY });
    setFormErrors({});
    setEditing('new');
  }

  function openEdit(item) {
    setForm({
      type: item.type || '',
      namevi: item.namevi || '',
      nameen: item.nameen || '',
      descvi: item.descvi || '',
      contentvi: item.contentvi || '',
      slugvi: item.slugvi || '',
      photo: item.photo || '',
      is_show: item.is_show ?? 1,
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
    if (!form.type.trim()) e.type = 'Kiểu trang là bắt buộc (vd: gioi-thieu, lien-he)';
    if (!form.namevi.trim()) e.namevi = 'Tiêu đề là bắt buộc';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    setSaving(true);
    try {
      const res = editing === 'new'
        ? await api.staticContent.create(form)
        : await api.staticContent.update(editing.id, form);
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
      const res = await api.staticContent.remove(deleting.id);
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

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Trang tĩnh</h1>
          <p className="mt-1 text-sm text-ink-500">{items.length} trang</p>
        </div>
        <Button variant="admin" onClick={openCreate}>Thêm trang</Button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-500">Chưa có trang tĩnh nào.</p>
            <Button variant="admin" onClick={openCreate} className="mt-5">Tạo trang đầu tiên</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-16">Ảnh</th>
                  <th>Tiêu đề</th>
                  <th className="w-40">Kiểu (URL)</th>
                  <th className="w-24">Trạng thái</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.photo ? (
                        <img src={item.photo_url || item.photo} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-ink-100" />
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
                      <p className="font-medium text-ink-900">{item.namevi}</p>
                      {item.slugvi && <p className="mt-0.5 text-xs text-ink-400">/{item.slugvi}</p>}
                    </td>
                    <td><code className="badge-gray">{item.type}</code></td>
                    <td>
                      <span className={item.is_show ? 'badge-green' : 'badge-red'}>
                        {item.is_show ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
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
        title={editing === 'new' ? 'Thêm trang tĩnh' : `Sửa: ${editing?.namevi || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="admin-outline" onClick={() => setEditing(null)} disabled={saving}>Huỷ</Button>
            <Button variant="admin" onClick={handleSave} loading={saving} type="submit" form="static-form">
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form id="static-form" onSubmit={handleSave} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="st-type">Kiểu trang *</label>
              <input
                id="st-type"
                className="field"
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                placeholder="gioi-thieu, lien-he, chinh-sach…"
                list="static-types"
              />
              <datalist id="static-types">
                <option value="gioi-thieu" />
                <option value="lien-he" />
                <option value="chinh-sach" />
                <option value="footer" />
              </datalist>
              {formErrors.type && <p className="error-text">{formErrors.type}</p>}
              <p className="hint">Dùng làm URL: /{form.type || 'type'}</p>
            </div>
            <div>
              <label className="label" htmlFor="st-slug">Slug</label>
              <input id="st-slug" className="field" value={form.slugvi} onChange={(e) => setField('slugvi', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="st-name">Tiêu đề *</label>
              <input id="st-name" className="field" value={form.namevi} onChange={(e) => setField('namevi', e.target.value)} />
              {formErrors.namevi && <p className="error-text">{formErrors.namevi}</p>}
            </div>
            <div>
              <label className="label" htmlFor="st-name-en">Tiêu đề (EN)</label>
              <input id="st-name-en" className="field" value={form.nameen} onChange={(e) => setField('nameen', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="st-desc">Mô tả</label>
            <textarea id="st-desc" rows={3} className="field resize-none" value={form.descvi} onChange={(e) => setField('descvi', e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="st-content">Nội dung (HTML)</label>
            <textarea id="st-content" rows={10} className="field font-mono text-xs" value={form.contentvi} onChange={(e) => setField('contentvi', e.target.value)} />
          </div>

          <ImagePicker label="Ảnh bìa" value={form.photo} onChange={(v) => setField('photo', v)} />

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={Boolean(form.is_show)}
              onChange={(e) => setField('is_show', e.target.checked ? 1 : 0)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            <span className="text-sm text-ink-700">Hiển thị trang này</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá trang?"
        message={`Trang "${deleting?.namevi || ''}" sẽ bị xoá vĩnh viễn.`}
        confirmText="Xoá"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}