import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  if (isAuthPage) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="lg:ml-64 p-0">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
