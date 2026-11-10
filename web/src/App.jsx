import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import BookingModal from './components/BookingModal.jsx';

import Home from './pages/Home.jsx';
import NewsList, { NewsDetail, StaticPage } from './pages/NewsPages.jsx';
import Gallery, { PricePage } from './pages/Gallery.jsx';

import AdminApp from './admin/AdminApp.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
  return null;
}

function SiteLayout({ children, onOpenBooking }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenBooking={onOpenBooking} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', padding: '12px 16px', fontSize: '14px' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />

      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />

        <Route
          path="/"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <Home onOpenBooking={openBooking} />
            </SiteLayout>
          }
        />

        <Route
          path="/gioi-thieu"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <StaticPage
                type="gioi-thieu"
                title="Giới thiệu"
                fallback="Mi House Spa là điểm đến chăm sóc sức khoẻ và làm đẹp hàng đầu với dịch vụ gội đầu dưỡng sinh, massage trị liệu và chăm sóc móng chuyên nghiệp."
              />
            </SiteLayout>
          }
        />

        <Route
          path="/lien-he"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <StaticPage
                type="lien-he"
                title="Liên hệ"
                fallback="Vui lòng liên hệ hotline 0909 123 456 hoặc ghé trực tiếp địa chỉ Gò Vấp, TP. Hồ Chí Minh."
              />
            </SiteLayout>
          }
        />

        <Route
          path="/chinh-sach"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <StaticPage type="chinh-sach" title="Chính sách bảo mật" />
            </SiteLayout>
          }
        />

        <Route
          path="/dich-vu"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsList
                type="dich-vu"
                title="Dịch vụ"
                subtitle="Dịch vụ gội đầu dưỡng sinh, massage trị liệu và chăm sóc móng tại Mi House Spa."
              />
            </SiteLayout>
          }
        />
        <Route
          path="/dich-vu/:slug"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsDetail type="dich-vu" backLabel="Về danh sách dịch vụ" />
            </SiteLayout>
          }
        />

        <Route
          path="/bang-gia"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <PricePage />
            </SiteLayout>
          }
        />

        <Route
          path="/dao-tao"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsList
                type="dao-tao"
                title="Đào tạo nghề"
                subtitle="Khoá đào tạo nghề dưỡng sinh chuyên nghiệp tại Mi House Spa."
              />
            </SiteLayout>
          }
        />
        <Route
          path="/dao-tao/:slug"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsDetail type="dao-tao" backLabel="Về danh sách đào tạo" />
            </SiteLayout>
          }
        />

        <Route
          path="/album-anh"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <Gallery title="Album ảnh" subtitle="Khám phá không gian và trải nghiệm tại Mi House Spa." album="album-anh" />
            </SiteLayout>
          }
        />
        <Route
          path="/khong-gian"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <Gallery title="Không gian" subtitle="Hình ảnh về cơ sở vật chất của Mi House Spa." album="khong-gian" />
            </SiteLayout>
          }
        />
        <Route
          path="/nail-hottrend"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsList type="nail-hottrend" title="Nail Hottrend" subtitle="Xu hướng móng mới nhất và bảng màu độc quyền." />
            </SiteLayout>
          }
        />
        <Route
          path="/nail-hottrend/:slug"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsDetail type="nail-hottrend" backLabel="Về Nail Hottrend" />
            </SiteLayout>
          }
        />

        <Route
          path="/tin-tuc"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsList type="tin-tuc" title="Tin tức" subtitle="Cập nhật tin tức, kiến thức làm đẹp từ Mi House Spa." />
            </SiteLayout>
          }
        />
        <Route
          path="/tin-tuc/:slug"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <NewsDetail type="tin-tuc" backLabel="Về danh sách tin tức" />
            </SiteLayout>
          }
        />

        <Route
          path="*"
          element={
            <SiteLayout onOpenBooking={openBooking}>
              <div className="container-site py-24 text-center">
                <p className="font-serif text-7xl text-brand-200">404</p>
                <h1 className="mt-4 text-3xl">Không tìm thấy trang</h1>
                <p className="mt-3 text-ink-500">Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển đi.</p>
                <a href="/" className="btn btn-primary mt-8">
                  Về trang chủ
                </a>
              </div>
            </SiteLayout>
          }
        />
      </Routes>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}