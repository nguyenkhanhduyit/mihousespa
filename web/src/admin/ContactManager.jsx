import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import Button from '../components/Button.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';

export default function ContactManager() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const res = await api.contact.adminList({ keyword: keyword || undefined, page, limit });
      if (res?.status !== 'success') throw new Error(res?.message || 'Không tải được dữ liệu');
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, page]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await api.contact.remove(deleting.id);
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
      const res = await api.contact.removeMany(selected);
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Liên hệ &amp; Đặt lịch</h1>
          <p className="mt-1 text-sm text-ink-500">{total} lượt gửi</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="label">Tìm kiếm</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setKeyword(searchInput.trim());
              }}
              className="flex gap-2"
            >
              <input className="field" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tên, email, số điện thoại…" />
              <Button type="submit" variant="admin-outline">Tìm</Button>
              {keyword && (
                <Button type="button" variant="admin-outline" onClick={() => { setSearchInput(''); setKeyword(''); }}>Xoá</Button>
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

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-500">Chưa có lượt liên hệ nào.</p>
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
                  <th>Họ tên</th>
                  <th>Liên hệ</th>
                  <th className="w-32">Loại</th>
                  <th className="w-40">Thời gian</th>
                  <th className="w-32 text-right">Thao tác</th>
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
                    <td className="font-medium text-ink-900">{item.fullname}</td>
                    <td>
                      <p className="text-ink-700">{item.phone}</p>
                      {item.email && <p className="text-xs text-ink-400">{item.email}</p>}
                    </td>
                    <td><span className="badge-gray">{item.type || 'lien-he'}</span></td>
                    <td className="text-xs text-ink-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button variant="admin-outline" size="sm" onClick={() => setViewing(item)}>Xem</Button>
                        <Button variant="admin-danger" size="sm" onClick={() => setDeleting(item)}>Xoá</Button>
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
            <p className="text-xs text-ink-500">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="admin-outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <Button variant="admin-outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={`Liên hệ: ${viewing?.fullname || ''}`}
        size="md"
        footer={
          <Button variant="admin-outline" onClick={() => setViewing(null)}>Đóng</Button>
        }
      >
        {viewing && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Họ tên</dt>
              <dd className="mt-1 text-ink-900">{viewing.fullname}</dd>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Điện thoại</dt>
                <dd className="mt-1">
                  {viewing.phone ? (
                    <a href={`tel:${viewing.phone}`} className="text-brand-700 hover:underline">{viewing.phone}</a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Email</dt>
                <dd className="mt-1">
                  {viewing.email ? (
                    <a href={`mailto:${viewing.email}`} className="text-brand-700 hover:underline">{viewing.email}</a>
                  ) : '—'}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Tiêu đề</dt>
              <dd className="mt-1 text-ink-900">{viewing.subject || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Nội dung</dt>
              <dd className="mt-1 whitespace-pre-line rounded-lg bg-ink-50 p-3 leading-relaxed text-ink-700">
                {viewing.content || '—'}
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá lượt liên hệ?"
        message={`Thông tin của "${deleting?.fullname || ''}" sẽ bị xoá.`}
        confirmText="Xoá"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}