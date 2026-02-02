import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StarBackground from '@/components/layout/StarBackground';
import DailyBonusNotification from '@/components/ui/DailyBonusNotification';
import TrophyNotification from '@/components/ui/TrophyNotification';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-theme-bg-primary font-sans text-theme-text-primary relative transition-all duration-300">
      <StarBackground />
      <DailyBonusNotification />
      <TrophyNotification />
      <Header />
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
