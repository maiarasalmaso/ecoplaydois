import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DailyBonusNotification from '@/components/ui/DailyBonusNotification';
import TrophyNotification from '@/components/ui/TrophyNotification';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen font-sans text-theme-text-primary relative transition-all duration-300">

      <TrophyNotification />

      <Header />

      <main className="flex-grow relative z-10 w-full">
        {children}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
