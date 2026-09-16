'use client';

import { useState, useRef, useCallback, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import t from '@/locales/en.json';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/shared/ThemeToggle';
import {
  Truck,
  MapPin,
  Shield,
  Users,
  Route,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  Quote,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const features = [
  { icon: MapPin, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
  { icon: BarChart3, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
  { icon: Users, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
  { icon: Route, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
  { icon: Shield, title: t.landing.feature5Title, desc: t.landing.feature5Desc },
  { icon: Truck, title: t.landing.feature6Title, desc: t.landing.feature6Desc },
];

const vehicles = [
  { img: '/vehicle-van.png', name: t.landing.vehicle1Name, desc: t.landing.vehicle1Desc, accent: 'border-b-4 border-b-blue-500' },
  { img: '/vehicle-hauler.png', name: t.landing.vehicle2Name, desc: t.landing.vehicle2Desc, accent: 'border-b-4 border-b-indigo-500' },
  { img: '/vehicle-hauler.png', name: t.landing.vehicle3Name, desc: t.landing.vehicle3Desc, accent: 'border-b-4 border-b-slate-500' },
];

const stats = [
  { value: '12,500+', label: t.landing.statsLabel.vehicles },
  { value: '2.8M+', label: t.landing.statsLabel.deliveries },
  { value: '850+', label: t.landing.statsLabel.clients },
  { value: '99.97%', label: t.landing.statsLabel.uptime },
];

const testimonials = [
  {
    name: 'Rahul Mehta',
    role: 'Operations Head, QuickDel Logistics',
    text: 'FleetVane cut our delivery times by 35% in the first month. The real-time tracking alone saved us countless support calls.',
    avatar: 'RM',
  },
  {
    name: 'Sneha Kapoor',
    role: 'Fleet Manager, TransIndia Corp',
    text: 'The driver management and route intelligence features are game-changers. We reduced fuel costs by 22% since switching.',
    avatar: 'SK',
  },
  {
    name: 'Arjun Desai',
    role: 'CTO, ExpressFreight',
    text: 'We evaluated 6 fleet platforms. FleetVane won on UX, API flexibility, and fast onboarding.',
    avatar: 'AD',
  },
];

const footerColumns = [
  { heading: t.footer.company, links: [t.footer.contact] },
  { heading: t.footer.legal, links: [t.footer.privacyPolicy, t.footer.termsOfService] },
];

/* ------------------------------------------------------------------ */
/*  3D Tilt Card Component                                            */
/* ------------------------------------------------------------------ */

function TiltCard({ img, name, desc, accent, onContactClick }: { img: string; name: string; desc: string; accent: string; onContactClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = ((y - height / 2) / (height / 2)) * -6;
    const rotateY = ((x - width / 2) / (width / 2)) * 6;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  }, []);

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
  }, []);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      whileInView="visible"
      initial="hidden"
      viewport={{ once: true, amount: 0.2 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onContactClick}
      className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${accent}`}
      style={{ transition: 'transform 0.3s ease-out' }}
    >
      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-serif">{name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-sans">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Main LandingPage                                                   */
/* ================================================================== */

export default function LandingPage() {
  const { navigate } = useRouter();
  const { login } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openContactSales = useCallback(() => {
    const subject = encodeURIComponent('FleetVane Sales Inquiry');
    const body = encodeURIComponent('Hi FleetVane team,\n\nI would like to learn more about FleetVane for my fleet operations.\n\nThank you!');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=fleetvaneinfo@gmail.com&su=${subject}&body=${body}`, '_blank');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
      {/* Top scroll progress indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-blue-600 z-[60] transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <span className="font-serif tracking-tight">{t.brand.name}</span>
            </button>

            <div className="hidden lg:flex items-center gap-8">
              <button type="button" onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t.nav.features}
              </button>
              <button type="button" onClick={() => scrollTo('about')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t.nav.about}
              </button>
              <button type="button" onClick={() => scrollTo('contact')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t.nav.contact}
              </button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
              <ThemeToggle className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800" />
              <Button variant="ghost" className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => navigate('/login')}>
                {t.nav.login}
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm" onClick={() => navigate('/signup')}>
                {t.nav.signup}
              </Button>
            </div>

            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 shadow-lg"
          >
            <button type="button" onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600">{t.nav.features}</button>
            <button type="button" onClick={() => scrollTo('about')} className="block w-full text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600">{t.nav.about}</button>
            <button type="button" onClick={() => scrollTo('contact')} className="block w-full text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600">{t.nav.contact}</button>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                {t.nav.login}
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
                {t.nav.signup}
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative bg-[#F8FAFC] dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800 py-24 md:py-32 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center max-w-3xl mx-auto space-y-8"
            >
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-serif font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {t.landing.heroTitle}
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-sans">
                {t.landing.heroSubtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="flex justify-center pt-4">
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-6 text-lg rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2">
                  {t.landing.heroCta}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-20"
            >
              {stats.map((s) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  className="px-6 py-4 flex flex-col items-center"
                >
                  <div className="text-3xl md:text-4xl font-serif font-extrabold text-slate-900 dark:text-white">{s.value}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Feature Section */}
        <section id="features" className="py-24 md:py-32 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
            >
              {/* Sticky Heading Column */}
              <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-6">
                <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {t.landing.featuresTitle}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {t.landing.featuresSubtitle}
                </motion.p>
              </div>

              {/* Scrolling Feature List */}
              <div className="lg:col-span-7 space-y-12">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <motion.div key={f.title} variants={fadeUp} className="flex gap-6 group">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div className="pt-2">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-sans max-w-xl">
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Vehicles / About Section */}
        <section id="about" className="py-24 md:py-32 bg-[#F8FAFC] dark:bg-[#020617]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="text-center max-w-3xl mx-auto mb-20 space-y-6"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.landing.vehiclesTitle}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                {t.landing.vehiclesSubtitle}
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {vehicles.map((v) => (
                <TiltCard key={v.name} {...v} onContactClick={() => scrollTo('contact')} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 md:py-32 bg-white dark:bg-[#0F172A] border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="mb-16 space-y-6 max-w-2xl"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Trusted by Industry Leaders
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((t_item) => (
                <motion.div key={t_item.name} variants={fadeUp}>
                  <div className="h-full bg-[#F8FAFC] dark:bg-[#020617] rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <Quote className="w-8 h-8 text-blue-600 mb-6 opacity-80" />
                      <p className="text-slate-900 dark:text-slate-100 font-serif text-lg leading-relaxed mb-8">
                        "{t_item.text}"
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center font-sans shadow-sm border border-blue-200 dark:border-blue-800">
                        {t_item.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{t_item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t_item.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Deep Navy CTA Section */}
        <section id="contact" className="py-24 md:py-32 bg-[#0F172A] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight">
              {t.landing.ctaTitle}
            </h2>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
              {t.landing.ctaSubtitle}
            </p>
            <div className="flex justify-center pt-8">
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-6 text-lg rounded-xl shadow-sm transition-transform active:scale-95">
                {t.landing.ctaCta}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#020617] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
                <Truck className="w-6 h-6 text-blue-600" />
                <span className="font-serif">{t.brand.name}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                {t.footer.description}
              </p>
            </div>

            {footerColumns.map((col) => (
              <div key={col.heading} className="space-y-6">
                <h4 className="text-slate-900 dark:text-white font-bold text-sm tracking-wide uppercase">{col.heading}</h4>
                <ul className="space-y-4">
                  {col.links.map((link) => {
                    const isContact = link === t.footer.contact;
                    const isPrivacy = link === t.footer.privacyPolicy;
                    return (
                      <li key={link}>
                        <button
                          type="button"
                          onClick={isContact ? openContactSales : isPrivacy ? () => navigate('/privacy') : () => navigate('/terms')}
                          className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors footer-link-anim text-left"
                        >
                          {link}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-500">
            <div>{t.brand.copyright}</div>
            <div className="flex items-center gap-8">
              <button type="button" onClick={() => navigate('/privacy')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => navigate('/terms')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
