import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AudienceSplit from '@/components/AudienceSplit';
import ServicesHome from '@/components/ServicesHome';
import ServicesBusiness from '@/components/ServicesBusiness';
import TrustedBy from '@/components/TrustedBy';
import HowItWorks from '@/components/HowItWorks';
import WhyUs from '@/components/WhyUs';
import LocationMap from '@/components/LocationMap';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import { faqJsonLd } from '@/lib/jsonld';

export default function Home() {
  return (
    <>
      {/* FAQPage schema: solo acá, donde las preguntas son visibles en el HTML. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <Header />
      <main>
        <Hero />
        <AudienceSplit />
        <ServicesHome />
        <ServicesBusiness />
        <TrustedBy />
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
