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
import { FileText, ArrowLeft, Calendar, Building2, Mail, Globe } from 'lucide-react';

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
  { id: 'acceptance-of-terms', label: '1. Acceptance of Terms' },
  { id: 'service-description', label: '2. Service Description' },
  { id: 'account-registration', label: '3. Account Registration & Security' },
  { id: 'user-roles', label: '4. User Roles & Permissions' },
  { id: 'role-manager', label: '4.1 Manager' },
  { id: 'role-client', label: '4.2 Client' },
  { id: 'role-driver', label: '4.3 Driver' },
  { id: 'acceptable-use', label: '5. Acceptable Use Policy' },
  { id: 'subscription-payment', label: '6. Subscription & Payment Terms' },
  { id: 'intellectual-property', label: '7. Intellectual Property' },
  { id: 'data-privacy', label: '8. Data & Privacy' },
  { id: 'service-availability', label: '9. Service Availability & SLA' },
  { id: 'limitation-of-liability', label: '10. Limitation of Liability' },
  { id: 'indemnification', label: '11. Indemnification' },
  { id: 'termination', label: '12. Termination' },
  { id: 'dispute-resolution', label: '13. Dispute Resolution' },
  { id: 'miscellaneous', label: '14. Miscellaneous' },
  { id: 'contact-information', label: '15. Contact Information' },
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

export default function LegalTermsPage() {
  const { navigate } = useRouter();
  const [activeSection, setActiveSection] = useState<string>('acceptance-of-terms');

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
                <FileText className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className={`${theme.typography.h2} ${theme.darkMode.headingText}`}>
                  Terms &amp; Conditions
                </h1>
                <p className={`text-slate-500 dark:text-slate-500 mt-1 ${theme.typography.caption}`}>
                  FleetVane Technologies Pvt. Ltd. — Legal terms governing your use of our platform and services
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
                                  entry.id.startsWith('4.')
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
                    {/* ── 1. Acceptance of Terms ── */}
                    <Section id="acceptance-of-terms" title="1. Acceptance of Terms">
                      <p>
                        These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and FleetVane Technologies Pvt. Ltd. (&quot;FleetVane,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a company incorporated under the Companies Act, 2013 and registered in Maharashtra, India. These Terms govern your access to and use of our website at{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">www.fleetvane.com</span> (the &quot;Website&quot;) and our fleet management platform, mobile applications, application programming interfaces (APIs), and all related services (collectively, the &quot;Services&quot;).
                      </p>
                      <p>
                        By registering for an account, accessing, or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety, as a valid contract under the Indian Contract Act, 1872. If you do not agree with any part of these Terms, you must not access or use our Services.
                      </p>
                      <p>
                        You represent and warrant that you are at least eighteen (18) years of age, possess the legal capacity to enter into a binding agreement, and are not prohibited from using the Services under any applicable law. If you are using the Services on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 2. Service Description ── */}
                    <Section id="service-description" title="2. Service Description">
                      <p>
                        FleetVane provides a Software-as-a-Service (&quot;SaaS&quot;) platform designed to assist businesses in India with end-to-end fleet management and logistics optimisation. Our Services include, but are not limited to, the following features:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Fleet Management:</span> Centralised dashboard for managing vehicle inventories, maintenance schedules, fuel consumption records, and fleet performance metrics across your entire operation.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Vehicle Tracking:</span> Real-time GPS-based tracking of vehicles, route visualisation on interactive maps, geofence alerts, speed monitoring, and historical route replay for analysis and compliance.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Shipment Management:</span> End-to-end shipment lifecycle management including creation, assignment, status tracking, proof of delivery, and milestone-based progress updates for all consignments.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Driver Management:</span> Driver profile management, licence verification, performance monitoring, duty hour tracking, and communication tools to coordinate driver assignments and instructions.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Analytics &amp; Reporting:</span> Data-driven insights including fleet utilisation reports, delivery performance analytics, cost-per-kilometre calculations, driver behaviour analysis, and customisable dashboards for informed decision-making.
                        </li>
                      </ul>
                      <p>
                        The specific features available to you may depend on your subscription tier, user role, and any separate service-level agreements. FleetVane reserves the right to modify, suspend, or discontinue any feature or aspect of the Services at any time, with reasonable notice where practicable.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 3. Account Registration & Security ── */}
                    <Section id="account-registration" title="3. Account Registration & Security">
                      <p>
                        To access the full functionality of our Services, you are required to register for an account. In doing so, you agree to the following obligations:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Accurate Information:</span> You must provide accurate, current, and complete information during registration and keep your profile information updated at all times. Providing false or misleading information may result in immediate suspension or termination of your account.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Password Security:</span> You are responsible for maintaining the confidentiality of your password. You must choose a strong password and must not share it with any third party. You agree to notify FleetVane immediately of any unauthorised use of your account or any other breach of security.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Account Responsibility:</span> You are solely responsible for all activities that occur under your account, whether or not you authorised such activities. FleetVane shall not be liable for any loss or damage arising from your failure to maintain account security.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">JWT Token Management:</span> Our platform uses JSON Web Tokens (JWT) for authentication. The token is stored in your browser&apos;s <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">localStorage</span> under the key <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">fv_token</span>. You must not extract, share, or expose this token. Tokens have a defined expiration; you must re-authenticate when prompted. Using public or shared devices to access the Services may compromise your token security, and you do so at your own risk.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Notification of Unauthorised Access:</span> If you suspect or become aware of any unauthorised access to your account, you must notify FleetVane immediately at{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span>. We recommend changing your password and clearing browser storage on any device that may have been compromised.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">One Account Per Person:</span> Each individual may maintain only one account. Creating multiple accounts, impersonating another person or entity, or using fraudulent credentials is strictly prohibited and constitutes a material breach of these Terms.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 4. User Roles & Permissions ── */}
                    <Section id="user-roles" title="4. User Roles & Permissions">
                      <p>
                        FleetVane assigns each registered user one of three roles, each with distinct permissions, responsibilities, and limitations. Your role is determined during registration or as assigned by a Manager within your organisation. Role assignments are subject to verification by FleetVane.
                      </p>

                      <SubSection id="role-manager" title="4.1 Manager">
                        <p>
                          Managers are fleet managers or administrators responsible for overseeing fleet operations. Manager responsibilities and permissions include:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>Full visibility into all vehicles, shipments, and drivers within their managed fleet or organisation.</li>
                          <li>Ability to create, edit, and delete vehicle records, shipment entries, and driver profiles.</li>
                          <li>Authority to assign drivers to vehicles and shipments, and to modify route assignments.</li>
                          <li>Access to all analytics, reports, and administrative features.</li>
                          <li>Responsibility for ensuring that all data entered into the platform is accurate and lawful.</li>
                          <li>Obligation to ensure that drivers registered under their management have valid commercial driving licences and consent to GPS tracking.</li>
                          <li>Accountability for any actions taken under their account, including those by sub-users they have authorised.</li>
                        </ul>
                        <p>
                          Managers may not share their login credentials with non-registered individuals or grant access to unauthorised third parties. Managers are liable for ensuring compliance with these Terms by all users under their management.
                        </p>
                      </SubSection>

                      <SubSection id="role-client" title="4.2 Client">
                        <p>
                          Clients are businesses or individuals who ship goods through the FleetVane platform. Client responsibilities and permissions include:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>Ability to create and manage shipment requests, including providing accurate pickup and delivery addresses, consignment details, and contact information.</li>
                          <li>Visibility into the status of their own shipments, including real-time tracking of assigned vehicles and estimated delivery times.</li>
                          <li>Access to shipment history, delivery receipts, and basic reporting related to their own consignments.</li>
                          <li>Responsibility for ensuring that all goods shipped through the platform are legal and do not violate any applicable Indian laws, including but not limited to the Motor Vehicles Act, 1988, the Indian Penal Code, 1860, and the Narcotic Drugs and Psychotropic Substances Act, 1985.</li>
                          <li>Obligation to provide accurate weight, dimensions, and hazard classifications for all shipments as required.</li>
                          <li>No access to driver personal details beyond what is necessary for shipment coordination (name and contact number only).</li>
                        </ul>
                      </SubSection>

                      <SubSection id="role-driver" title="4.3 Driver">
                        <p>
                          Drivers are truck drivers who operate vehicles tracked on the FleetVane platform. Driver responsibilities and permissions include:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          <li>Access to their own assigned shipments, routes, and delivery schedules.</li>
                          <li>Ability to update shipment status (e.g., picked up, in transit, delivered) and upload proof of delivery.</li>
                          <li>Visibility into their own performance metrics, duty hours, and route history.</li>
                          <li>Obligation to maintain an active GPS connection via the FleetVane mobile application during assigned trips to enable real-time tracking.</li>
                          <li>Responsibility for the accuracy of status updates and timely reporting of delays, incidents, or deviations from assigned routes.</li>
                          <li>Requirement to hold a valid commercial driving licence as prescribed under the Motor Vehicles Act, 1988, and to keep such licence current at all times during the use of our Services.</li>
                          <li>No access to other drivers&apos; information, client billing details, or fleet-wide administrative settings.</li>
                        </ul>
                        <p>
                          Drivers acknowledge and consent to GPS location tracking during active assignments. Drivers may disable location services outside of working hours. FleetVane does not track drivers outside of their assigned duties.
                        </p>
                      </SubSection>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 5. Acceptable Use Policy ── */}
                    <Section id="acceptable-use" title="5. Acceptable Use Policy">
                      <p>
                        You agree to use the Services only for lawful purposes and in accordance with these Terms. The following activities are strictly prohibited:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Illegal Use:</span> Using the Services for any purpose that violates applicable Indian laws, including but not limited to the Indian Penal Code, 1860, the Information Technology Act, 2000, the Motor Vehicles Act, 1988, and any state or central regulations. This includes using the platform to transport illegal, prohibited, or dangerous goods without proper authorisation.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">GPS &amp; Tracking Tampering:</span> Interfering with, disabling, spoofing, or otherwise manipulating GPS tracking devices, vehicle telematics hardware, or the FleetVane mobile application to provide false location data, conceal vehicle location, or circumvent geofence alerts. Any such tampering constitutes a material breach of these Terms.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Impersonation:</span> Creating an account or using the Services while impersonating another person, entity, or organisation, or using fraudulent identification documents during registration or verification.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Data Scraping &amp; Unauthorised Access:</span> Using automated scripts, bots, crawlers, scrapers, or any other means to extract, collect, or harvest data from the Services without prior written consent from FleetVane. This includes unauthorised access to APIs, database queries, or any attempt to reverse-engineer, decompile, or disassemble any part of the Services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">System Interference:</span> Introducing malicious code, viruses, worms, trojans, or any other harmful components into the Services; attempting to overload, flood, or disrupt the platform&apos;s infrastructure; or conducting any form of denial-of-service attack.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Unauthorised Sharing:</span> Sharing your account credentials, JWT tokens, or access to the Services with unauthorised individuals, or reselling, sublicensing, or redistributing access to the Services without FleetVane&apos;s explicit written consent.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Misrepresentation:</span> Falsifying shipment details, vehicle information, delivery confirmations, or any other data within the platform.
                        </li>
                      </ul>
                      <p>
                        FleetVane reserves the right to investigate, suspend, or terminate any account suspected of violating this Acceptable Use Policy, and to cooperate with law enforcement authorities in the event of suspected illegal activity.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 6. Subscription & Payment Terms ── */}
                    <Section id="subscription-payment" title="6. Subscription & Payment Terms">
                      <p>
                        Certain features of the FleetVane platform may require a paid subscription (&quot;Subscription&quot;). Where applicable, the following terms govern your Subscription:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Pricing:</span> Specific subscription plans, pricing tiers, and included features are set forth in separate pricing agreements, order forms, or schedules (collectively, &quot;Pricing Documents&quot;) made available to you prior to or at the time of subscription. In the event of any conflict between these Terms and a Pricing Document, the Pricing Document shall prevail with respect to pricing and payment matters only.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Payment:</span> All fees are payable in Indian Rupees (INR) unless otherwise agreed in writing. Payment is due within the period specified in the applicable Pricing Document. FleetVane reserves the right to suspend access to the Services for accounts with overdue payments after providing reasonable notice.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Taxes:</span> All fees are exclusive of applicable Goods and Services Tax (GST) and any other statutory levies, which shall be borne by you and charged in addition to the subscription fees as required under Indian tax law.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Renewal:</span> Subscriptions automatically renew for successive periods of the same duration unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current subscription period.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Price Changes:</span> FleetVane reserves the right to adjust subscription fees with at least thirty (30) days&apos; prior written notice. Such changes shall take effect at the start of the next subscription period. Continued use of the Services after the effective date constitutes acceptance of the revised fees.
                        </li>
                      </ul>
                      <p>
                        For the avoidance of doubt, free-tier or trial access, if offered, is provided &quot;as is&quot; and may be limited in functionality, duration, or data capacity. FleetVane may modify or discontinue free-tier access at any time without liability.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 7. Intellectual Property ── */}
                    <Section id="intellectual-property" title="7. Intellectual Property">
                      <p>
                        All intellectual property rights in and to the Services, including but not limited to the platform&apos;s software, source code, object code, user interface design, graphics, logos, trademarks, service marks, trade names, documentation, and all other content (collectively, &quot;FleetVane IP&quot;), are and shall remain the sole and exclusive property of FleetVane Technologies Pvt. Ltd. or its licensors.
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Limited License:</span> Subject to your compliance with these Terms and the payment of all applicable fees, FleetVane grants you a non-exclusive, non-transferable, non-sublicensable, revocable, limited license to access and use the Services for your internal business purposes during the subscription period. This license does not include the right to modify, adapt, or create derivative works of the Services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Reverse Engineering:</span> You shall not, and shall not permit any third party to, reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Services, or create any derivative works based on the Services, except to the extent that such restriction is expressly prohibited by applicable law notwithstanding a contractual prohibition.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Trademarks:</span> &quot;FleetVane&quot; and the FleetVane logo are trademarks of FleetVane Technologies Pvt. Ltd. You may not use these marks without our prior written consent. All other trademarks, service marks, and trade names used in the Services are the property of their respective owners.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">User Content:</span> You retain ownership of any data, information, or content you upload or submit to the Services (&quot;User Content&quot;). By submitting User Content, you grant FleetVane a worldwide, non-exclusive, royalty-free license to use, process, store, and display such content solely for the purpose of providing the Services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Feedback:</span> Any feedback, suggestions, or ideas you provide regarding the Services may be used by FleetVane without any obligation of compensation or attribution to you.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 8. Data & Privacy ── */}
                    <Section id="data-privacy" title="8. Data & Privacy">
                      <p>
                        Your privacy is important to us. Our collection, use, storage, and sharing of your personal information is governed by our{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">Privacy Policy</span>, which is incorporated into these Terms by reference. By using the Services, you acknowledge that you have read and understood our Privacy Policy.
                      </p>
                      <p>
                        Key privacy principles applicable under these Terms include:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Data Processing Consent:</span> By using the Services, you consent to the processing of your personal information, including location data for vehicle tracking purposes, as described in our Privacy Policy and in accordance with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Driver Location Consent:</span> Drivers explicitly consent to GPS location tracking during active trip assignments. Tracking is limited to working hours and assigned routes unless otherwise required for safety or compliance purposes.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Data Accuracy:</span> You are responsible for ensuring the accuracy and lawfulness of all data you submit to the platform.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Security Cooperation:</span> You agree to cooperate with FleetVane in maintaining the security of your data and to promptly report any suspected data breaches or security vulnerabilities.
                        </li>
                      </ul>
                      <p>
                        To the extent that these Terms and the Privacy Policy conflict, the Privacy Policy shall prevail with respect to data protection and privacy matters.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 9. Service Availability & SLA ── */}
                    <Section id="service-availability" title="9. Service Availability & SLA">
                      <p>
                        FleetVane strives to provide reliable and continuous access to the Services. However, the Services are provided on a &quot;best efforts&quot; basis, and you acknowledge the following:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Guaranteed Uptime:</span> FleetVane does not guarantee that the Services will be available at all times, uninterrupted, or error-free. Temporary interruptions may occur due to scheduled maintenance, system upgrades, infrastructure changes, or circumstances beyond our reasonable control.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Maintenance Windows:</span> FleetVane may perform scheduled maintenance during designated maintenance windows. We will endeavour to provide at least forty-eight (48) hours&apos; advance notice of scheduled maintenance via email or in-app notification, except in cases of emergency maintenance required to address critical security vulnerabilities or system failures.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Third-Party Dependencies:</span> The Services rely on third-party infrastructure, including cloud hosting providers, mapping services, and telecommunications networks. FleetVane is not responsible for disruptions, outages, or degraded performance caused by failures of such third-party services.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">GPS Limitations:</span> GPS tracking accuracy is subject to environmental factors including signal availability, weather conditions, urban canyon effects, and device hardware limitations. FleetVane does not guarantee the accuracy or availability of real-time GPS data at any given time.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Liability for Outages:</span> To the fullest extent permitted by applicable law, FleetVane shall not be liable for any loss, damage, or inconvenience caused by service outages, data unavailability, or degraded performance, including but not limited to lost profits, missed delivery deadlines, or operational disruptions.
                        </li>
                      </ul>
                      <p>
                        Specific service-level commitments, if any, are set forth in separate service-level agreements (&quot;SLAs&quot;) executed between the parties. In the absence of a separate SLA, the Services are provided without any specific uptime or performance guarantees.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 10. Limitation of Liability ── */}
                    <Section id="limitation-of-liability" title="10. Limitation of Liability">
                      <p>
                        To the maximum extent permitted by applicable Indian law, including the Indian Contract Act, 1872, and the Consumer Protection Act, 2019:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Liability Cap:</span> FleetVane&apos;s total aggregate liability arising out of or in connection with these Terms, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, shall not exceed the total subscription fees actually paid by you to FleetVane during the twelve (12) month period immediately preceding the event giving rise to the claim, or INR 5,00,000 (Five Lakh Rupees), whichever is greater.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Consequential Damages:</span> In no event shall FleetVane be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including but not limited to loss of profits, loss of revenue, loss of business opportunities, loss of goodwill, business interruption, or loss of data, even if FleetVane has been advised of the possibility of such damages.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Liability for User Actions:</span> FleetVane is not liable for any loss, damage, injury, or legal consequence arising from the actions, omissions, or misconduct of users, drivers, or third parties using the Services, including but not limited to accidents, cargo damage, or regulatory violations.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Liability for Data Accuracy:</span> FleetVane does not guarantee the accuracy, completeness, or timeliness of data displayed on the platform, including GPS coordinates, ETA calculations, or driver status information. Users should verify critical information independently.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Force Majeure:</span> FleetVane shall not be liable for any failure or delay in performing its obligations under these Terms to the extent that such failure or delay is caused by circumstances beyond its reasonable control, including but not limited to natural disasters, pandemics, wars, terrorism, civil unrest, government actions (including internet shutdowns or restrictions), power failures, cyber-attacks by third parties, or failures of underlying telecommunications or internet infrastructure. During a force majeure event, FleetVane&apos;s obligations shall be suspended for the duration of the event, and FleetVane shall use reasonable efforts to resume performance as soon as practicable.
                        </li>
                      </ul>
                      <p>
                        The limitations of liability in this section apply regardless of the legal theory on which the claim is based and even if FleetVane has been advised of the possibility of the damages in question. These limitations shall survive termination of these Terms.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 11. Indemnification ── */}
                    <Section id="indemnification" title="11. Indemnification">
                      <p>
                        You agree to indemnify, defend, and hold harmless FleetVane Technologies Pvt. Ltd., its directors, officers, employees, agents, affiliates, successors, and assigns (collectively, the &quot;FleetVane Parties&quot;) from and against any and all claims, demands, suits, actions, proceedings, losses, damages, liabilities, costs, and expenses (including reasonable attorney&apos;s fees and court costs) arising out of or in connection with:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>Your breach of any provision of these Terms, including the Acceptable Use Policy.</li>
                        <li>Your violation of any applicable law, regulation, or third-party right.</li>
                        <li>Your negligent or wrongful acts or omissions in connection with the Services.</li>
                        <li>Any content, data, or material you upload, submit, or transmit through the Services.</li>
                        <li>Any dispute between you and other users, clients, or drivers arising from the use of the Services.</li>
                        <li>Any claims related to the goods you ship through the platform, including but not limited to claims for damage, loss, misdescription, or illegal content of shipments.</li>
                        <li>Any unauthorised use of your account or credentials due to your failure to maintain adequate security.</li>
                      </ul>
                      <p>
                        FleetVane will provide you with prompt written notice of any such claim and shall have the right to participate in the defence of such claim at its own expense. You shall not settle any claim without FleetVane&apos;s prior written consent if such settlement would impose any obligation on the FleetVane Parties or admit any fault or liability on their part.
                      </p>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 12. Termination ── */}
                    <Section id="termination" title="12. Termination">
                      <p>
                        The provisions governing termination of these Terms are as follows:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Termination by User:</span> You may terminate your account and these Terms at any time by providing written notice to FleetVane at{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span> or through the account settings within the platform. Upon termination, your right to access the Services will cease immediately.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Termination by FleetVane:</span> FleetVane may suspend or terminate your account and access to the Services at any time, with or without cause, upon thirty (30) days&apos; written notice. FleetVane may terminate immediately and without prior notice in cases of: (a) material breach of these Terms; (b) fraudulent, abusive, or illegal activity; (c) conduct that causes harm to FleetVane, other users, or third parties; or (d) compliance with a court order or government directive.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Effect of Termination:</span> Upon termination, your license to use the Services shall immediately cease. All provisions of these Terms that by their nature should survive termination shall remain in effect, including but not limited to Intellectual Property, Limitation of Liability, Indemnification, and Dispute Resolution.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Data Retention After Termination:</span> Upon termination, FleetVane will retain your data for a period of ninety (90) days, during which you may request an export of your data. After this period, personal data will be deleted or anonymised in accordance with our Privacy Policy and applicable data retention requirements. Shipment records, route histories, and transactional data may be retained for longer periods as required under applicable Indian laws and regulations, including tax and transport record-keeping requirements.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Refund Policy:</span> Unless otherwise specified in a separate agreement or Pricing Document, subscription fees paid are non-refundable. This includes fees paid for partial subscription periods, whether termination is initiated by you or by FleetVane. Any prepaid fees for future service periods that have not yet commenced at the time of termination may, at FleetVane&apos;s sole discretion, be refunded on a pro-rata basis.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 13. Dispute Resolution ── */}
                    <Section id="dispute-resolution" title="13. Dispute Resolution">
                      <p>
                        Any dispute, controversy, or claim arising out of or in connection with these Terms, including their formation, validity, interpretation, performance, breach, or termination, shall be resolved as follows:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-2 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Amicable Resolution:</span> The parties shall first attempt to resolve any dispute through good-faith negotiation. Either party may initiate this process by providing written notice to the other party describing the nature of the dispute. The parties shall have a period of thirty (30) days from such notice to attempt to resolve the dispute amicably.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Arbitration:</span> If the dispute cannot be resolved through negotiation within the thirty-day period, it shall be referred to and finally resolved by binding arbitration conducted in accordance with the Arbitration and Conciliation Act, 1996 (as amended). The arbitration shall be conducted by a sole arbitrator appointed by mutual agreement of the parties, or failing such agreement, by the Hon&apos;ble Chief Justice of the Bombay High Court or his/her nominee.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Seat and Language:</span> The seat and venue of arbitration shall be Mumbai, Maharashtra, India. The language of the arbitration proceedings and all submissions shall be English.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Interim Relief:</span> Nothing in this clause shall prevent either party from seeking interim injunctive relief or other provisional measures from a court of competent jurisdiction to prevent irreparable harm pending the outcome of arbitration.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Governing Law:</span> These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of laws principles. The Indian Contract Act, 1872, the Information Technology Act, 2000, the Consumer Protection Act, 2019, and other applicable Indian statutes shall apply.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Jurisdiction:</span> Subject to the arbitration clause above, the courts of Mumbai, Maharashtra, India shall have exclusive jurisdiction over any legal proceedings arising out of or in connection with these Terms.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 14. Miscellaneous ── */}
                    <Section id="miscellaneous" title="14. Miscellaneous">
                      <ul className="list-disc list-inside ml-4 space-y-3 text-slate-600 dark:text-slate-400">
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Severability:</span> If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court or arbitrator of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall continue in full force and effect. The invalidity of any provision shall not affect the validity or enforceability of the remaining provisions.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Waiver:</span> No failure or delay by FleetVane in exercising any right, power, or remedy under these Terms shall operate as a waiver thereof, nor shall any single or partial exercise of any such right, power, or remedy preclude any other or further exercise of that or any other right, power, or remedy. A waiver shall be effective only if made in writing and signed by the waiving party.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Entire Agreement:</span> These Terms, together with the Privacy Policy, any applicable Pricing Documents, and any separate service-level agreements or addenda executed between the parties, constitute the entire agreement between you and FleetVane with respect to the subject matter hereof, and supersede all prior or contemporaneous communications, representations, or agreements, whether oral or written, relating to such subject matter.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Amendments:</span> FleetVane reserves the right to amend or modify these Terms at any time. Material changes will be communicated to registered users via email or in-app notification at least fifteen (15) days before the revised Terms take effect. We will also update the &quot;Last updated&quot; date at the top of this page. Your continued use of the Services after the effective date of any amendment constitutes your acceptance of the revised Terms. If you do not agree with the amended Terms, you must cease using the Services and terminate your account.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Notices:</span> All notices required or permitted under these Terms shall be in writing and shall be deemed duly given when: (a) sent by email to the address associated with your account (for notices from FleetVane to you); or (b) sent by email to{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">fleetvaneinfo@gmail.com</span> (for notices from you to FleetVane). Notices shall be deemed received upon transmission if sent during business hours (10:00 AM to 6:00 PM IST), and on the next business day if sent outside business hours.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Assignment:</span> You may not assign, transfer, or delegate your rights or obligations under these Terms without FleetVane&apos;s prior written consent. FleetVane may assign its rights and obligations under these Terms to any affiliate, successor, or acquirer in connection with a merger, acquisition, corporate reorganisation, or sale of all or substantially all of its assets, without requiring your consent.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">No Agency:</span> Nothing in these Terms creates an agency, partnership, joint venture, or employment relationship between you and FleetVane. Each party is an independent contractor with respect to the other.
                        </li>
                        <li>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Survival:</span> The provisions of these Terms that by their nature should survive termination or expiration, including but not limited to Intellectual Property (Section 7), Data &amp; Privacy (Section 8), Limitation of Liability (Section 10), Indemnification (Section 11), Dispute Resolution (Section 13), and Miscellaneous (Section 14), shall survive any termination or expiration of these Terms.
                        </li>
                      </ul>
                    </Section>

                    <Separator className="my-6" />

                    {/* ── 15. Contact Information ── */}
                    <Section id="contact-information" title="15. Contact Information">
                      <p>
                        If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us:
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
                        For legal notices or formal correspondence, please send documents to the address above with the subject line &quot;Legal Notice — Terms &amp; Conditions&quot; and include your registered email address, full name, and a detailed description of your inquiry. We will acknowledge receipt within five (5) business days.
                      </p>
                    </Section>
                  </motion.div>

                  {/* ── Disclaimer ── */}
                  <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                      These Terms and Conditions are for informational purposes and do not constitute legal advice. FleetVane recommends consulting with a qualified legal professional for specific legal concerns. This document has been prepared in compliance with Indian contract law, information technology law, and consumer protection law as of August 2025.
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
                      entry.id.startsWith('4.') ? 'pl-6' : ''
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
