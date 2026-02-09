import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileDock from '@/components/layout/MobileDock';
import DailyBonusNotification from '@/components/ui/DailyBonusNotification';
import TrophyNotification from '@/components/ui/TrophyNotification';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen font-sans text-theme-text-primary relative transition-all duration-300">

      <TrophyNotification />
      <Header />
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <MobileDock />
    </div>
  );
};

export default Layout;
