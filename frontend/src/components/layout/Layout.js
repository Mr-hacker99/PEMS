import React, { useState } from 'react';
import Sidebar, { TopHeader } from './Sidebar';

const Layout = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <TopHeader onMenuOpen={() => setMobileOpen(true)} title={title} />

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
