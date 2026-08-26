'use client';

import { useState, useRef, useCallback, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/shared/ThemeToggle';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Truck,
  MapPin,
  Shield,
  Users,
  Route,
  BarChart3,
  ArrowRight,
  ChevronRight,
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
  { img: '/vehicle-van.png', name: t.landing.vehicle1Name, desc: t.landing.vehicle1Desc, accent: 'border-b-4 border-b-emerald-500' },
  { img: '/vehicle-truck.png', name: t.landing.vehicle2Name, desc: t.landing.vehicle2Desc, accent: 'border-b-4 border-b-amber-500' },
  { img: '/vehicle-hauler.png', name: t.landing.vehicle3Name, desc: t.landing.vehicle3Desc, accent: 'border-b-4 border-b-rose-500' },
];

const stats = [
  { value: '12,500+', label: t.landing.statsLabel.vehicles },
  { value: '2.8M+', label: t.landing.statsLabel.deliveries },
  { value: '850+', label: t.landing.statsLabel.clients },
  { value: '99.97%', label: t.landing.statsLabel.uptime },
];

const socialProofStats = [
  { value: '150+', label: 'Enterprise Clients' },
  { value: '12,500+', label: 'Vehicles Tracked' },
  { value: '2.8M+', label: 'Deliveries Completed' },
  { value: '99.97%', label: 'System Uptime' },
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
      className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${accent}`}
      style={{ transition: 'transform 0.3s ease-out' }}
    >
      <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{desc}</p>
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
  const [launchingDemo, setLaunchingDemo] = useState(false);

  const launchDemo = async () => {
    setLaunchingDemo(true);
    try {
      await login('manager@fleetvane.com', 'Manager123!');
      navigate('/manager/fleet');
    } catch {
      setLaunchingDemo(false);
    }
  };

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Parallax background & scroll progress indicator
  const heroBgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      if (heroBgRef.current) {
        heroBgRef.current.style.transform = `translateY(${scrollTop * 0.25}px)`;
      }
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top scroll progress indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-emerald-500 z-[60] transition-all duration-75 ease-out"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-lg font-bold text-white hover:text-emerald-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <span>{t.brand.name}</span>
            </button>

            <div className="hidden lg:flex items-center gap-8">
              <button type="button" onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-200 hover:text-emerald-400 transition-colors">
                {t.nav.features}
              </button>
              <button type="button" onClick={() => scrollTo('about')} className="text-sm font-medium text-slate-200 hover:text-emerald-400 transition-colors">
                {t.nav.about}
              </button>
              <button type="button" onClick={() => scrollTo('contact')} className="text-sm font-medium text-slate-200 hover:text-emerald-400 transition-colors">
                {t.nav.contact}
              </button>
                <ThemeToggle className="text-slate-200 hover:text-white hover:bg-slate-800" />
              <Button variant="ghost" className="text-white hover:bg-slate-800 hover:text-white" onClick={() => navigate('/login')}>
                {t.nav.login}
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" onClick={() => navigate('/signup')}>
                {t.nav.signup}
              </Button>
            </div>

            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-800"
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
            className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3"
          >
            <button type="button" onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-emerald-400">{t.nav.features}</button>
            <button type="button" onClick={() => scrollTo('about')} className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-emerald-400">{t.nav.about}</button>
            <button type="button" onClick={() => scrollTo('contact')} className="block w-full text-left py-2 text-sm font-medium text-slate-200 hover:text-emerald-400">{t.nav.contact}</button>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <Button variant="outline" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                {t.nav.login}
              </Button>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
                {t.nav.signup}
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-20 md:py-28 overflow-hidden">
          <div
            ref={heroBgRef}
            className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: 'url(/hero-fleet.png)' }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center max-w-3xl mx-auto space-y-6"
            >
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {t.landing.heroTitle}
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                {t.landing.heroSubtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" onClick={launchDemo} disabled={launchingDemo} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2">
                  {launchingDemo ? 'Launching Demo...' : t.landing.heroCta}
                  {!launchingDemo && <ArrowRight className="w-5 h-5" />}
                </Button>
                  <Button size="lg" variant="outline" onClick={() => scrollTo('about')} className="w-full sm:w-auto bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white px-8 py-3 rounded-xl">
                  {t.landing.heroSecondaryCta}
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Stats Grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
            >
              {stats.map((s) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl text-center shadow-lg backdrop-blur-sm"
                >
                  <div className="text-3xl font-extrabold text-white">{s.value}</div>
                  <div className="text-sm font-medium text-emerald-400 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.landing.featuresTitle}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.landing.featuresSubtitle}
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} variants={fadeUp}>
                    <Card className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{f.title}</CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                          {f.desc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0">
                        <button
                          type="button"
                          onClick={() => scrollTo('contact')}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                        >
                          {t.common.view}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="bg-slate-900 dark:bg-slate-950 py-12 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {socialProofStats.map((s) => (
                <motion.div
                  key={s.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="text-3xl font-extrabold text-white">{s.value}</div>
                  <div className="text-sm font-medium text-slate-400 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vehicles Section */}
        <section id="about" className="py-20 md:py-28 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.landing.vehiclesTitle}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
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
        <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Trusted by Industry Leaders
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                See why logistics operators choose FleetVane
              </motion.p>
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
                  <Card className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-0 space-y-4">
                      <Quote className="w-8 h-8 text-emerald-500" />
                      <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed text-sm sm:text-base">
                        "{t_item.text}"
                      </p>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
                          {t_item.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{t_item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t_item.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="relative py-20 md:py-28 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {t.landing.ctaTitle}
            </h2>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              {t.landing.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={launchDemo}
                disabled={launchingDemo}
                className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 py-3 rounded-xl shadow-lg"
              >
                {launchingDemo ? 'Launching Demo...' : t.landing.ctaCta}
                {!launchingDemo && <ArrowRight className="w-5 h-5 ml-2 inline" />}
              </Button>
                <Button size="lg" variant="outline" onClick={openContactSales} className="w-full sm:w-auto bg-transparent border-emerald-400 text-white hover:bg-emerald-700 px-8 py-3 rounded-xl">
                {t.landing.ctaContact}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Truck className="w-5 h-5 text-emerald-500" />
                <span>{t.brand.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.footer.description}
              </p>
            </div>

            {footerColumns.map((col) => (
              <div key={col.heading} className="space-y-3">
                <h4 className="text-white font-bold text-sm">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => {
                    const isContact = link === t.footer.contact;
                    const isPrivacy = link === t.footer.privacyPolicy;
                    const isTerms = link === t.footer.termsOfService;
                    return (
                      <li key={link}>
                        <button
                          type="button"
                          onClick={isContact ? openContactSales : isPrivacy ? () => navigate('/privacy') : () => navigate('/terms')}
                          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
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

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>{t.brand.copyright}</div>
            <div className="flex items-center gap-6">
              <button type="button" onClick={() => navigate('/privacy')} className="hover:text-emerald-400 transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => navigate('/terms')} className="hover:text-emerald-400 transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
