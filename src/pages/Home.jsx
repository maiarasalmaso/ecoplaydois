import WelcomeHero from '@/components/home/WelcomeHero';
import SustainabilitySpecs from '@/components/home/SustainabilitySpecs';
import OnboardingMissions from '@/components/onboarding/OnboardingMissions';

const Home = () => {
  return (
    <div className="pb-12">
      <WelcomeHero />
      <div className="mx-4 mb-10">
      </div>
      <SustainabilitySpecs />
    </div>
  );
};

export default Home;
