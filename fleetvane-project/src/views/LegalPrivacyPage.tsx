'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '@/context/RouterContext';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ArrowLeft, Calendar, Building2, Mail, Globe } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const fadeInStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;

/* ------------------------------------------------------------------ */
/*  Table of Contents entries                                          */
/* ------------------------------------------------------------------ */

interface TOCEntry {
  id: string;
  label: string;
}

const tocEntries: TOCEntry[] = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'data-controller', label: '2. Data Controller' },
  { id: 'types-of-data', label: '3. Types of Data Collected' },
  { id: 'personal-information', label: '3.1 Personal Information' },
  { id: 'location-data', label: '3.2 Location Data' },
  { id: 'usage-data', label: '3.3 Usage Data' },
  { id: 'cookies', label: '3.4 Cookies & Tracking Technologies' },
  { id: 'purpose-of-collection', label: '4. Purpose of Collection' },
  { id: 'data-sharing', label: '5. Data Sharing & Disclosure' },
  { id: 'data-security', label: '6. Data Security' },
  { id: 'data-retention', label: '7. Data Retention' },
  { id: 'user-rights', label: '8. Your Rights' },
  { id: 'childrens-privacy', label: '9. Children\'s Privacy' },
  { id: 'third-party-links', label: '10. Third-Party Links' },
  { id: 'changes-to-policy', label: '11. Changes to This Policy' },
  { id: 'governing-law', label: '12. Governing Law & Jurisdiction' },
  { id: 'contact-information', label: '13. Contact Information' },
];

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className={`text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 ${theme.typography.h4}`}>
        {title}
      </h2>
      <div className="text-slate-600 dark:text-slate-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mt-6">
      <h3 className={`text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 ${theme.typography.h5}`}>
        {title}
      </h3>
      <div className="text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function LegalPrivacyPage() {
  const { navigate } = useRouter();
  const [activeSection, setActiveSection] = useState<string>('introduction');

  // Intersection observer to highlight active TOC section
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id);
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [handleIntersection]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`${theme.layout.pageWrapper} ${theme.darkMode.pageBg}`}>
      {/* ─── Header ─── */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40">
        <div className={theme.layout.container}>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Last updated: August 2025
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Page Title ─── */}
      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b">
        <div className={theme.layout.container}>
          <motion.div
            className="py-12 md:py-16"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                <Shield className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className={`${theme.typography.h2} ${theme.darkMode.headingText}`}>
                  Privacy Policy
                </h1>
                <p className={`text-slate-500 dark:text-slate-500 mt-1 ${theme.typography.caption}`}>
                  FleetVane Technologies Pvt. Ltd. — How we collect, use, and protect your information
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <main className="flex-1">
        <div className={theme.layout.container}>
          <div className="py-8 md:py-12 flex gap-8 lg:gap-12">
            {/* ─── Sidebar TOC (desktop only) ─── */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <Card className="shadow-none border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Table of Contents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-[calc(100vh-200px)]">
                      <nav>
                        <ul className="space-y-0.5">
                          {tocEntries.map((entry) => (
                            <li key={entry.id}>
                              <button
                                onClick={() => scrollToSection(entry.id)}
                                className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                  entry.id === activeSection
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                } ${
                                  entry.id.startsWith('3.')
                                    ? 'pl-6'
                                    : ''
                                }`}
                              >
                                {entry.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* ─── Main Content ─── */}
            <motion.div
              className="flex-1 min-w-0 max-w-3xl"
              initial="hidden"
              animate="visible"
              variants={fadeInStagger}
            >
              <Card className="shadow-none border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6 space-y-8">
                  <motion.div variants={fadeIn}>
                    {/* ── 1. Introduction ── */}
                    <Section id="introduction" title="1. Introduction">
                      <p>
                        FleetVane Technologies Pvt. Ltd. (&quot;FleetVane,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting and respecting your privacy. This Privacy Policy (&quot;Policy&quot;) describes how we collect, use, store, disclose, and safeguard your information when you visit our website at{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">www.fleetvane.com</span> (the &quot;Website&quot;) or use our fleet management platform, mobile applications, and related services (collectively, the &quot;Services&quot;).
                      </p>
                      <p>
                        This Policy applies to all users of our Services, including clients, drivers, fleet managers, and visitors. By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by the terms of this Privacy Policy, in compliance with the Information Technology Act, 2000 (&quot;IT Act&quot;) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;) of India.
                      </p>
                      <p>
                        If you do not agree with the terms of this Privacy Policy, please do not access or use our Services.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 2. Data Controller ── */}
                    <Section id="data-controller" title="2. Data Controller">
                      <p>
                        The entity responsible for the processing of your personal information under this Policy is:
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-3 space-y-1">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            FleetVane Technologies Pvt. Ltd.
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                          301, Peninsula Business Park, Lower Parel, Mumbai, Maharashtra 400013, India
                        </p>
                      </div>
                      <p className="mt-2">
                        For any privacy-related inquiries, please contact our Data Protection Officer at{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          fleetvaneinfo@gmail.com
                        </span>.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 3. Types of Data Collected ── */}
                    <Section id="types-of-data" title="3. Types of Data Collected">
                      <p>
                        We collect and process different categories of information to provide and improve our Services. The types of data we collect include:
                      </p>

                      {/* 3.1 Personal Information */}
                      <SubSection id="personal-information" title="3.1 Personal Information">
                        <p>
                          We may collect the following personal information (&quot;Sensitive Personal Data or Information&quot; as defined under the SPDI Rules) when you register for an account or use our Services:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Identity Data:</span> Full name, date of birth, gender, profile photograph, and government-issued identification documents (such as Aadhaar number, PAN, driver&apos;s license number) where required for verification purposes.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Contact Data:</span> Email address, phone number, physical address, and billing address.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Account Credentials:</span> Username, hashed password, and security questions/answers for authentication.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Professional Data:</span> Company name, job title, role designation (Manager, Client, Driver), and employer details.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Financial Data:</span> Bank account details, GST number, and payment information processed through secure third-party payment gateways.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Vehicle &amp; License Data:</span> Vehicle registration numbers, license plate numbers, vehicle type, make, model, and driver&apos;s license information.
                          </li>
                        </ul>
                      </SubSection>

                      {/* 3.2 Location Data */}
                      <SubSection id="location-data" title="3.2 Location Data">
                        <p>
                          As a fleet management platform, real-time location tracking is core to our Services. We collect:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">GPS Coordinates:</span> Real-time latitude and longitude data from vehicles and driver devices, transmitted via onboard tracking hardware or mobile applications.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Route History:</span> Records of routes traveled, including start/end points, waypoints, speed data, and timestamps.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Geofence Data:</span> Information about vehicle entry and exit from defined geographic boundaries (geofences).
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Device Location:</span> Approximate location derived from IP addresses and device identifiers for users accessing the platform via web or mobile.
                          </li>
                        </ul>
                        <p>
                          Location data is collected with the explicit consent of vehicle owners, fleet operators, and drivers. Drivers are informed of active tracking through in-app notifications and dashboard indicators.
                        </p>
                      </SubSection>

                      {/* 3.3 Usage Data */}
                      <SubSection id="usage-data" title="3.3 Usage Data">
                        <p>
                          We automatically collect technical and usage information when you interact with our Services:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Device Information:</span> Hardware model, operating system, browser type and version, screen resolution, and device identifiers.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Log Data:</span> IP address, access timestamps, pages viewed, features used, click patterns, and navigation paths.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Performance Data:</span> Application crash reports, error logs, load times, and system performance metrics.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Communication Data:</span> Contents of support tickets, in-app messages, and email correspondence with our support team.
                          </li>
                        </ul>
                      </SubSection>

                      {/* 3.4 Cookies & Tracking */}
                      <SubSection id="cookies" title="3.4 Cookies & Tracking Technologies">
                        <p>
                          We use cookies, web beacons, pixels, and similar tracking technologies to enhance your experience and analyze usage patterns:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Essential Cookies:</span> Required for authentication (JWT token storage), session management, and core platform functionality. These cannot be disabled.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Analytics Cookies:</span> Help us understand how users interact with our Services, enabling us to improve performance and user experience.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Preference Cookies:</span> Remember your settings, such as language preference, theme selection (light/dark mode), and display preferences.
                          </li>
                          <li>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Security Cookies:</span> Used to detect and prevent security threats, including cross-site scripting (XSS) and cross-site request forgery (CSRF).
                          </li>
                        </ul>
                        <p>
                          You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of our Services. Our platform stores authentication tokens in <span className="font-medium text-slate-700 dark:text-slate-300">localStorage</span> under the key <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">fv_token</span> for session persistence.
                        </p>
                      </SubSection>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 4. Purpose of Collection ── */}
                    <Section id="purpose-of-collection" title="4. Purpose of Collection">
                      <p>
                        We collect and process your data for the following purposes, in accordance with the principles of purpose limitation under the IT Act:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Service Provision:</span> To create and manage your account, authenticate your identity, and provide the full range of fleet management features including shipment tracking, driver assignment, and route optimization.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Fleet Tracking &amp; Operations:</span> To enable real-time GPS tracking of vehicles, monitor delivery progress, generate route analytics, and provide estimated arrival times.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Communication:</span> To send you transactional notifications (shipment updates, delivery confirmations), account alerts, system maintenance notices, and respond to your support inquiries.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Safety &amp; Compliance:</span> To monitor driver behavior, detect incidents, ensure regulatory compliance, and maintain records as required under the Motor Vehicles Act, 1988 and related transport regulations.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Improvement &amp; Analytics:</span> To analyze usage patterns, identify performance issues, conduct research and development, and improve the quality and functionality of our Services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Security &amp; Fraud Prevention:</span> To detect, prevent, and respond to fraudulent activities, unauthorized access attempts, and security breaches.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Legal Obligations:</span> To comply with applicable laws, regulations, legal processes, or enforceable governmental requests.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 5. Data Sharing & Disclosure ── */}
                    <Section id="data-sharing" title="5. Data Sharing & Disclosure">
                      <p>
                        We do not sell, rent, or trade your personal information to third parties. However, we may share your data in the following circumstances:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Within the Platform:</span> Data is shared between authorized users based on their role (Manager, Client, Driver). For example, clients can view their shipment details and assigned driver information; managers have broader fleet-wide visibility.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Service Providers:</span> We engage trusted third-party vendors for hosting (cloud infrastructure), mapping services (OpenStreetMap/Leaflet), payment processing, and analytics. These vendors are contractually obligated to protect your data and use it solely for the purposes specified.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Legal Requirements:</span> We may disclose your information when required by law, regulation, court order, or governmental authority. This includes compliance with the IT Act, SPDI Rules, and any applicable Indian tax or transport regulations.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Business Transfers:</span> In the event of a merger, acquisition, reorganization, or sale of assets, your personal information may be transferred to the acquiring entity with continued protection under this Policy.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">With Your Consent:</span> We may share your data with third parties when you have given explicit consent for such disclosure.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Emergency Situations:</span> We may disclose information to prevent imminent harm, protect the safety of individuals, or address life-threatening emergencies involving drivers or vehicles.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 6. Data Security ── */}
                    <Section id="data-security" title="6. Data Security">
                      <p>
                        In compliance with Section 43A of the IT Act and the SPDI Rules, we implement comprehensive security measures to protect your personal information:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Encryption:</span> All data in transit is encrypted using TLS/SSL protocols. Sensitive data at rest, including passwords, is encrypted using industry-standard hashing algorithms (bcrypt).
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Authentication &amp; Access Control:</span> JWT-based authentication with token expiration, role-based access control (RBAC) enforcing least-privilege principles across Manager, Client, and Driver roles.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Infrastructure Security:</span> Our platform runs on secure cloud infrastructure with firewall protection, intrusion detection systems, and regular vulnerability assessments.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Database Protection:</span> All user data is stored in a secure SQLite database with controlled access. Regular backups are performed with encrypted storage.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Audit &amp; Monitoring:</span> We maintain comprehensive audit logs of all data access and system activities. Real-time monitoring systems detect and alert on anomalous behavior.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Employee Training:</span> All employees and contractors with data access undergo regular privacy and security training and are bound by confidentiality agreements.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Incident Response:</span> We maintain a documented incident response plan to promptly address any data breaches in accordance with the requirements of the IT Act, including notification to affected users and the relevant authorities.
                        </li>
                      </ul>
                      <p>
                        While we employ robust security measures, no system is completely immune to breaches. We recommend using strong, unique passwords and enabling all available security features on your account.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 7. Data Retention ── */}
                    <Section id="data-retention" title="7. Data Retention">
                      <p>
                        We retain your personal information only for as long as necessary to fulfill the purposes described in this Policy:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Active Accounts:</span> Personal information is retained for the duration of your active account and continued use of our Services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Shipment Records:</span> Transactional data, including shipment details, route histories, and delivery records, is retained for a minimum of three (3) years after completion for regulatory compliance and dispute resolution.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Location Data:</span> Real-time GPS data is processed for active tracking purposes and historical route data is retained for six (6) months, after which it is aggregated into anonymized analytics.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Server Logs:</span> System logs and access records are retained for ninety (90) days for security and debugging purposes.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Deleted/Deactivated Accounts:</span> Upon account deletion, personal information is removed from our active databases within thirty (30) days, except where retention is required by applicable law.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Legal Holds:</span> Data may be retained beyond standard periods if required for legal proceedings, regulatory investigations, or government requests.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 8. User Rights ── */}
                    <Section id="user-rights" title="8. Your Rights">
                      <p>
                        Under the Information Technology Act, 2000, and the SPDI Rules, 2011, you have the following rights regarding your personal data:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Access:</span> You have the right to request a copy of the personal information we hold about you. You can access most of your data directly through your account dashboard. For additional data access requests, contact us at{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span>.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Correction:</span> You may request correction of any inaccurate or incomplete personal information. You can update most details through your account profile settings, or contact our support team for assistance with corrections that cannot be made self-service.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Deletion:</span> You may request the deletion of your personal information, subject to certain exceptions (such as ongoing legal obligations, pending transactions, or regulatory record-keeping requirements). Upon verified request, we will delete your data within thirty (30) days and provide confirmation.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Withdraw Consent:</span> Where processing is based on your consent, you may withdraw consent at any time by contacting us or adjusting your account settings. Withdrawal of consent does not affect the lawfulness of processing carried out before such withdrawal.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Opt-Out of Communications:</span> You may opt out of non-essential communications (newsletters, promotional emails) at any time by clicking the unsubscribe link or updating your notification preferences. Note that transactional communications (shipment updates, security alerts) cannot be opted out of.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Right to Grievance Redressal:</span> Under the SPDI Rules, you have the right to lodge a grievance regarding any violation of your privacy. We commit to acknowledging your complaint within thirty (30) days and resolving it within sixty (60) days.
                        </li>
                      </ul>
                      <p>
                        To exercise any of these rights, please submit a request via email to{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span> with the subject line &quot;Privacy Request — [Your Name] — [Account Email].&quot; We may require identity verification before processing your request.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 9. Children's Privacy ── */}
                    <Section id="childrens-privacy" title="9. Children's Privacy">
                      <p>
                        FleetVane is not intended for use by individuals under the age of 18 (&quot;Children&quot;). We do not knowingly collect, store, or process personal information from Children. If you are a parent or guardian and become aware that a Child has provided us with personal information, please contact us immediately at{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span>, and we will take prompt steps to delete such information from our systems.
                      </p>
                      <p>
                        Driver accounts are restricted to individuals who hold a valid commercial driving license and are at least 18 years of age. We verify age and license validity during the driver registration process.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 10. Third-Party Links ── */}
                    <Section id="third-party-links" title="10. Third-Party Links">
                      <p>
                        Our Website and Services may contain links to third-party websites, services, or resources, including mapping providers, payment gateways, and logistics partners. These third-party services are governed by their own privacy policies, which we encourage you to review.
                      </p>
                      <p>
                        FleetVane does not control and is not responsible for the privacy practices, data collection, or content of any third-party websites or services. The inclusion of any link does not imply our endorsement. Your interaction with third-party services is at your own risk and subject to their respective terms and privacy policies.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 11. Changes to Policy ── */}
                    <Section id="changes-to-policy" title="11. Changes to This Policy">
                      <p>
                        We reserve the right to update or modify this Privacy Policy at any time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes to this Policy:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                        <li>We will update the &quot;Last updated&quot; date at the top of this page.</li>
                        <li>We will notify registered users via email or in-app notification at least fifteen (15) days before the changes take effect.</li>
                        <li>We will post a prominent notice on our Website.</li>
                      </ul>
                      <p>
                        Your continued use of our Services after the effective date of any changes constitutes your acceptance of the revised Privacy Policy. We encourage you to review this Policy periodically to stay informed about how we protect your information.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 12. Governing Law & Jurisdiction ── */}
                    <Section id="governing-law" title="12. Governing Law & Jurisdiction">
                      <p>
                        This Privacy Policy shall be governed by and construed in accordance with the laws of India, including but not limited to:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                        <li>The Information Technology Act, 2000 and its amendments</li>
                        <li>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
                        <li>The Indian Contract Act, 1872</li>
                        <li>Any other applicable Indian laws, rules, and regulations pertaining to data protection and privacy</li>
                      </ul>
                      <p>
                        Any disputes arising out of or in connection with this Privacy Policy shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India. You hereby consent to the personal jurisdiction and venue of such courts and waive any objection to the inconvenience of such forum.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 13. Contact Information ── */}
                    <Section id="contact-information" title="13. Contact Information">
                      <p>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 mt-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">FleetVane Technologies Pvt. Ltd.</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              301, Peninsula Business Park, Lower Parel,<br />
                              Mumbai, Maharashtra 400013, India
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Email:{' '}
                            <a
                              href="mailto:fleetvaneinfo@gmail.com"
                              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              fleetvaneinfo@gmail.com
                            </a>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Website:{' '}
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              www.fleetvane.com
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="mt-3">
                        For privacy-related complaints or grievances, please email us with the subject line &quot;Privacy Grievance&quot; and include your registered email address and a description of your concern. We will respond to all verified requests within thirty (30) days as required under the SPDI Rules.
                      </p>
                    </Section>
                  </motion.div>

                  {/* ── Disclaimer ── */}
                  <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                      This Privacy Policy is for informational purposes and does not constitute legal advice. FleetVane recommends consulting with a qualified legal professional for specific privacy-related concerns. This document has been prepared in compliance with Indian data protection laws as of August 2025.
                    </p>
                  </div>

                  {/* ── Bottom Back to Home ── */}
                  <div className="mt-8 pt-4 flex justify-center">
                    <Button
                      onClick={() => navigate('/')}
                      className={`${theme.button.primary} flex items-center gap-2`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ─── Mobile Inline TOC ─── */}
      <div className="lg:hidden">
        <div className="border-t bg-slate-50 dark:bg-slate-900">
          <div className={theme.layout.container}>
            <details className="py-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Table of Contents
              </summary>
              <nav className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 pb-4">
                {tocEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => scrollToSection(entry.id)}
                    className={`block text-left text-sm px-3 py-2 rounded-md transition-colors ${
                      entry.id === activeSection
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    } ${
                      entry.id.startsWith('3.') ? 'pl-6' : ''
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className={`mt-auto border-t bg-slate-900 text-slate-400`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; 2025 FleetVane Technologies Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              www.fleetvane.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
