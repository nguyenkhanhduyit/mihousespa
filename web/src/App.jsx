import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import BookingModal from './components/BookingModal.jsx';

import Home from './pages/Home.jsx';
import {
  StaticPage,
  ServicePage,
  PricePage,
  TrainingPage,
  NewsListPage,
  NewsDetailPage,
  GalleryPage,
  ContactPage,
} from './pages/NewsPages.jsx';

import AdminApp from './admin/AdminApp.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteLayout({ children, onOpenBooking }) {
  return (
    <div className="site-layout">
      <Header onOpenBooking={onOpenBooking} />
      <main id="main-primary" className="site-layout__main">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="wrap-main">
      <div className="wrap-content text-center">
        <h1 className="home__title ff:title fsz:60 text:theme-brand">404</h1>
        <p className="my:2rem">Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển đi.</p>
        <Link className="home__btn" to="/">
          <span>Về trang chủ</span>
          <span className="fa-regular fa-arrow-right-long" />
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);

  const layout = (node) => <SiteLayout onOpenBooking={openBooking}>{node}</SiteLayout>;

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', padding: '12px 16px', fontSize: '14px' },
          success: { iconTheme: { primary: '#7A431A', secondary: '#fff' } },
          error: { iconTheme: { primary: '#c2000b', secondary: '#fff' } },
        }}
      />

      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Trang chủ */}
        <Route path="/" element={layout(<Home onOpenBooking={openBooking} />)} />

        {/* Trang con theo site mẫu */}
        <Route path="/gioi-thieu" element={layout(<StaticPage title="Giới thiệu" slug="gioi-thieu" type="gioi-thieu" />)} />
        <Route path="/dich-vu" element={layout(<ServicePage />)} />
        <Route path="/bang-gia" element={layout(<PricePage />)} />
        <Route path="/dao-tao" element={layout(<TrainingPage />)} />
        <Route path="/album-anh" element={layout(<GalleryPage title="Album ảnh" group="album-anh" />)} />
        <Route path="/khong-gian" element={layout(<GalleryPage title="Không gian" group="khong-gian" />)} />
        <Route path="/nail-hottrend" element={layout(<GalleryPage title="Nail hottrend" group="nail-hottrend" />)} />
        <Route path="/tin-tuc" element={layout(<NewsListPage />)} />
        <Route path="/tin-tuc/:slug" element={layout(<NewsDetailPage />)} />
        <Route path="/lien-he" element={layout(<ContactPage />)} />

        {/* Chính sách quy định (footer links) */}
        <Route
          path="/chinh-sach"
          element={layout(<StaticPage title="Chính sách quy định" slug="chinh-sach" type="chinh-sach" />)}
        />
        <Route
          path="/chinh-sach-ho-tro"
          element={layout(<StaticPage title="Chính sách hỗ trợ" slug="chinh-sach-ho-tro" type="chinh-sach-ho-tro" />)}
        />
        <Route
          path="/chinh-sach-thanh-toan"
          element={layout(<StaticPage title="Chính sách thanh toán" slug="chinh-sach-thanh-toan" type="chinh-sach-thanh-toan" />)}
        />
        <Route
          path="/chinh-sach-huong-dan"
          element={layout(<StaticPage title="Chính sách hướng dẫn" slug="chinh-sach-huong-dan" type="chinh-sach-huong-dan" />)}
        />
        <Route
          path="/chinh-sach-bao-hanh"
          element={layout(<StaticPage title="Chính sách bảo hành" slug="chinh-sach-bao-hanh" type="chinh-sach-bao-hanh" />)}
        />
        <Route
          path="/chinh-sach-dich-vu"
          element={layout(<StaticPage title="Chính sách dịch vụ" slug="chinh-sach-dich-vu" type="chinh-sach-dich-vu" />)}
        />

        {/* Dịch vụ chi tiết */}
        <Route path="/dich-vu/:slug" element={layout(<NewsDetailPage />)} />
        <Route path="/dao-tao/:slug" element={layout(<NewsDetailPage />)} />
        <Route path="/nail-hottrend/:slug" element={layout(<NewsDetailPage />)} />

        <Route path="*" element={layout(<NotFound />)} />
      </Routes>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
