import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="customer-theme min-h-screen flex flex-col bg-background text-on-background font-sans">
      <Header />
      <main className="min-w-0 flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
