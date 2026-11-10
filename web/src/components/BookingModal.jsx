import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import api from '../api/client.js';

const SERVICES = [
  'Gội đầu dưỡng sinh',
  'Massage trị liệu',
  'Chăm sóc móng (Nail)',
  'Combo dưỡng sinh + Massage',
  'Khác',
];

/**
 * Modal đặt lịch. Gửi dữ liệu thật về API /contact.
 */
export default function BookingModal({ open, onClose }) {
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    email: '',
    service: SERVICES[0],
    date: '',
    time: '',
    content: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      setForm((f) => ({ ...f, date: f.date || iso }));
    }
  }, [open]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate() {
    const e = {};
    if (!form.fullname.trim()) e.fullname = 'Vui lòng nhập họ và tên';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9+\s.-]{8,15}$/.test(form.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
    if (!form.date) e.date = 'Vui lòng chọn ngày';
    else if (form.date < new Date().toISOString().slice(0, 10)) e.date = 'Ngày không thể là trong quá khứ';
    if (!form.time) e.time = 'Vui lòng chọn giờ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }
    setLoading(true);
    try {
      const content = [
        `Dịch vụ: ${form.service}`,
        form.date && form.time ? `Thời gian mong muốn: ${form.date} ${form.time}` : '',
        form.content ? `Ghi chú: ${form.content}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await api.contact.submit({
        fullname: form.fullname,
        phone: form.phone,
        email: form.email,
        subject: form.service,
        content,
        type: 'dat-lich',
      });

      if (res?.status !== 'success') throw new Error(res?.message || 'Gửi thất bại');

      toast.success(res.message || 'Đặt lịch thành công! Chúng tôi sẽ liên hệ lại với bạn.');
      setForm({ fullname: '', phone: '', email: '', service: SERVICES[0], date: '', time: '', content: '' });
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30', '20:00'];

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title="Đặt lịch hẹn"
      subtitle="Chúng tôi sẽ gọi lại xác nhận trong thời gian sớm nhất."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={loading} className="btn btn-ghost">
            Huỷ
          </button>
          <button type="submit" form="booking-form" disabled={loading} className="btn btn-primary">
            {loading ? 'Đang gửi…' : 'Xác nhận đặt lịch'}
          </button>
        </>
      }
    >
      <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bk-name">Họ và tên *</label>
            <input
              id="bk-name"
              className="field"
              value={form.fullname}
              onChange={(e) => set('fullname', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullname && <p className="error-text">{errors.fullname}</p>}
          </div>
          <div>
            <label className="label" htmlFor="bk-phone">Số điện thoại *</label>
            <input
              id="bk-phone"
              className="field"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="0901234567"
              inputMode="tel"
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bk-email">Email</label>
            <input
              id="bk-email"
              className="field"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="email@example.com"
              inputMode="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="bk-service">Dịch vụ</label>
            <select id="bk-service" className="field" value={form.service} onChange={(e) => set('service', e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bk-date">Ngày hẹn *</label>
            <input
              id="bk-date"
              type="date"
              className="field"
              min={new Date().toISOString().slice(0, 10)}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
            {errors.date && <p className="error-text">{errors.date}</p>}
          </div>
          <div>
            <label className="label" htmlFor="bk-time">Giờ *</label>
            <select id="bk-time" className="field" value={form.time} onChange={(e) => set('time', e.target.value)}>
              <option value="">-- Chọn giờ --</option>
              {timeSlots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.time && <p className="error-text">{errors.time}</p>}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="bk-note">Ghi chú</label>
          <textarea
            id="bk-note"
            rows={3}
            className="field resize-none"
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Ghi chú thêm cho chuyên viên…"
          />
        </div>
      </form>
    </Modal>
  );
}