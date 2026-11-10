import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const next = new URLSearchParams(location.search).get('next') || '/admin';

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function validate() {
    const e = {};
    if (!form.username.trim()) e.username = 'Vui lòng nhập tài khoản';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      toast.success(`Chào mừng ${user?.name || user?.username || 'bạn'}!`);
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
      setErrors({ username: ' ', password: ' ' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3c0 3-3 3.5-3 7a3 3 0 0 0 6 0c0-3.5-3-4-3-7Z" />
              <path d="M12 21c4-2 7-5 7-9a7 7 0 1 0-14 0c0 4 3 7 7 9Z" opacity=".5" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-xl font-semibold text-white">Mi House</span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-brand-400">Spa &amp; Wellness</span>
          </span>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-ink-900">Đăng nhập quản trị</h1>
          <p className="mt-1.5 text-sm text-ink-500">Nhập thông tin tài khoản quản trị viên.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            <div>
              <label className="label" htmlFor="ad-user">Tài khoản</label>
              <input
                id="ad-user"
                className="field"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="admin"
                autoComplete="username"
              />
              {errors.username && <p className="error-text">{errors.username}</p>}
            </div>

            <div>
              <label className="label" htmlFor="ad-pass">Mật khẩu</label>
              <div className="relative">
                <input
                  id="ad-pass"
                  type={showPass ? 'text' : 'password'}
                  className="field pr-11"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-400 transition hover:text-ink-700"
                >
                  {showPass ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-admin w-full !py-3">
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
            <p className="font-medium text-ink-700">Tài khoản mặc định (môi trường dev):</p>
            <p className="mt-1 font-mono">admin / Admin@2026</p>
          </div>
        </div>

        <Link to="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-white/70 transition hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m6-6-6 6 6 6" strokeLinecap="round" />
          </svg>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}