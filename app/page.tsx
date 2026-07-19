import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AudienceSplit from '@/components/AudienceSplit';
import ServicesHome from '@/components/ServicesHome';
import ServicesBusiness from '@/components/ServicesBusiness';
import HowItWorks from '@/components/HowItWorks';
import WhyUs from '@/components/WhyUs';
import LocationMap from '@/components/LocationMap';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AudienceSplit />
        <ServicesHome />
        <ServicesBusiness />
        <HowItWorks />
        <WhyUs />
        <LocationMap />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
