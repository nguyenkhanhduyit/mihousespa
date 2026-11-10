import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';

const EMPTY = { namevi: '', slugvi: '', type: '', titlevi: '', descvi: '', keywords: '', contentvi: '' };
export default function SeoManager() {
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
      const res = await api.seo.list();
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
      namevi: item.namevi || '',
      slugvi: item.slugvi || '',
      type: item.type || '',
      titlevi: item.titlevi || '',
      descvi: item.descvi || '',
      keywords: item.keywords || '',
      contentvi: item.contentvi || '',
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
    if (!form.namevi.trim()) e.namevi = 'Tên trang là bắt buộc';
    if (!form.slugvi.trim()) e.slugvi = 'Slug là bắt buộc';
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
        ? await api.seo.create(form)
        : await api.seo.update(editing.id, form);
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
      const res = await api.seo.remove(deleting.id);
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
          <h1 className="text-2xl font-semibold text-ink-900">Quản lý SEO</h1>
          <p className="mt-1 text-sm text-ink-500">{items.length} trang SEO</p>
        </div>
        <Button variant="admin" onClick={openCreate}>Thêm trang SEO</Button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-500">Chưa có trang SEO nào.</p>
            <Button variant="admin" onClick={openCreate} className="mt-5">Tạo trang SEO</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên trang</th>
                  <th className="w-44">Slug</th>
                  <th className="w-32">Loại</th>
                  <th className="w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-ink-900">{item.namevi}</td>
                    <td><code className="text-xs text-ink-500">/{item.slugvi}</code></td>
                    <td><span className="badge-gray">{item.type || '—'}</span></td>
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
        title={editing === 'new' ? 'Thêm trang SEO' : `Sửa: ${editing?.namevi || ''}`}
        size="md"
        footer={
          <>
            <Button variant="admin-outline" onClick={() => setEditing(null)} disabled={saving}>Huỷ</Button>
            <Button variant="admin" onClick={handleSave} loading={saving} type="submit" form="seo-form">
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form id="seo-form" onSubmit={handleSave} noValidate className="space-y-4">
          <div>
            <label className="label" htmlFor="seo-name">Tên trang *</label>
            <input id="seo-name" className="field" value={form.namevi} onChange={(e) => setField('namevi', e.target.value)} />
            {formErrors.namevi && <p className="error-text">{formErrors.namevi}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="seo-slug">Slug *</label>
              <input id="seo-slug" className="field" value={form.slugvi} onChange={(e) => setField('slugvi', e.target.value)} />
              {formErrors.slugvi && <p className="error-text">{formErrors.slugvi}</p>}
            </div>
            <div>
              <label className="label" htmlFor="seo-type">Loại</label>
              <input id="seo-type" className="field" value={form.type} onChange={(e) => setField('type', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="seo-title">SEO Title</label>
            <input id="seo-title" className="field" value={form.titlevi} onChange={(e) => setField('titlevi', e.target.value)} />
            <p className="hint">Khoảng 50-60 ký tự</p>
          </div>
          <div>
            <label className="label" htmlFor="seo-desc">Meta Description</label>
            <textarea id="seo-desc" rows={3} className="field resize-none" value={form.descvi} onChange={(e) => setField('descvi', e.target.value)} />
            <p className="hint">Khoảng 140-160 ký tự</p>
          </div>
          <div>
            <label className="label" htmlFor="seo-kw">Keywords</label>
            <input id="seo-kw" className="field" value={form.keywords} onChange={(e) => setField('keywords', e.target.value)} placeholder="phân cách bằng dấu phẩy" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá trang SEO?"
        message={`"${deleting?.namevi || ''}" sẽ bị xoá.`}
        confirmText="Xoá"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}