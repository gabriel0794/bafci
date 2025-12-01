import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { NotificationProvider } from '../contexts/NotificationContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  if (isAuthPage) {
    return children;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-14 lg:ml-64">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default Layout;
