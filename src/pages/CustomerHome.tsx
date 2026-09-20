import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const heroSlides = [
  { url: new URL('../assets/homepage-slides/10847722_880613165310967_4093794898509583352_o.jpg', import.meta.url).href, alt: 'Garden of Peace memorial park entrance' },
  { url: new URL('../assets/homepage-slides/16708282_1468951193129536_2703755447561134449_n.jpg', import.meta.url).href, alt: 'Garden of Peace memorial park view' },
  { url: new URL('../assets/homepage-slides/images (1).jpg', import.meta.url).href, alt: 'Garden of Peace memorial chapel' },
  { url: new URL('../assets/homepage-slides/images (2).jpg', import.meta.url).href, alt: 'Garden of Peace grounds and cross memorial' },
  { url: new URL('../assets/homepage-slides/images (3).jpg', import.meta.url).href, alt: 'Garden of Peace building and grounds' },
  { url: new URL('../assets/homepage-slides/images (4).jpg', import.meta.url).href, alt: 'Garden of Peace altar and chapel details' },
  { url: new URL('../assets/homepage-slides/images.jpg', import.meta.url).href, alt: 'Garden of Peace family and park scenery' },
];

const CustomerHome = () => {
  const { userProfile } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);

  const firstName = (() => {
    const first = userProfile?.first_name?.trim();
    if (first) return first;

    const fullName = userProfile?.full_name?.trim();
    if (fullName) {
      return fullName.split(/\s+/).filter(Boolean)[0] || 'Customer';
    }

    return 'Customer';
  })();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);


  return (
    <div className="-mx-8 -mt-8 min-h-screen bg-[#1F4035] md:-mx-10 lg:-mx-12">
      <section className="relative overflow-hidden bg-[#1F4035]">
        <div className="relative h-screen min-h-[560px] w-full overflow-hidden">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.url}
              src={slide.url}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f1b]/10 via-transparent to-[#0b1f1b]/15" />

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="w-full max-w-3xl rounded-[1.5rem] border border-white/10 bg-[#10251f]/35 p-5 text-center shadow-xl shadow-[#10251f]/20 backdrop-blur-[2px] md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E7D6A5]">Garden of Peace</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#F5F0E7] md:text-5xl">Hai, {firstName}! 👋</h1>

              <div className="mt-6 flex justify-center">
                <Link to="/plots" className="inline-flex items-center justify-center rounded-xl bg-[#E7D6A5] px-5 py-3 font-bold text-[#1F4035] shadow-lg shadow-[#0d1c1a]/20 transition hover:bg-[#f0e0ad]">
                  View Site
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="bg-[#F7F4EC] px-6 py-14 md:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#E1E7E2] bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2F5D50]">Location</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1F4035] md:text-3xl">God the Father Fatima, Inabanga, Bohol</h2>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=God+the+Father+Fatima+Inabanga+Bohol"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[#1F4035] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2F5D50]"
            >
              Open in Google Maps
            </a>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#E1E7E2] bg-[#F4F7F3]">
            <iframe
              title="God the Father Fatima Inabanga Bohol map"
              src="https://www.google.com/maps?q=God%20the%20Father%20Fatima%20Inabanga%20Bohol&z=14&output=embed"
              className="h-[360px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default CustomerHome;