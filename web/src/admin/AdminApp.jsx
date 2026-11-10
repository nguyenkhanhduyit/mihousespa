import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

import AdminLogin from './AdminLogin.jsx';
import AdminLayout from './AdminLayout.jsx';
import Dashboard from './Dashboard.jsx';
import NewsManager from './NewsManager.jsx';
import PhotoManager from './PhotoManager.jsx';
import StaticManager from './StaticManager.jsx';
import SettingsManager from './SettingsManager.jsx';
import ContactManager from './ContactManager.jsx';
import SeoManager from './SeoManager.jsx';

/**
 * Gác cổng bảo vệ admin.
 * - Chưa đăng nhập → chuyển tới /admin/login
 * - Đã đăng nhập → cho phép
 */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="mt-3 text-sm text-ink-500">Đang xác thực…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function AdminApp() {
  const { isAuthenticated } = useAuth();
  const [key, setKey] = useState(0);

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin />}
      />
      <Route
        path="*"
        element={
          <RequireAuth>
            <AdminLayout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="news" element={<NewsManager />} />
                <Route path="news/:type" element={<NewsManager />} />
                <Route path="photo" element={<PhotoManager />} />
                <Route path="static" element={<StaticManager />} />
                <Route path="settings" element={<SettingsManager />} />
                <Route path="contact" element={<ContactManager />} />
                <Route path="seo" element={<SeoManager />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}