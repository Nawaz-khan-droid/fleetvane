/**
 * FleetVane Theme Configuration — v2.0
 * Blue/Navy SaaS palette — deep navy dark, electric blue primary, clean white surfaces.
 * Components MUST consume these strings — NO hardcoded styling.
 */

export const theme = {
  // Brand colors — Electric blue / deep navy
  brand: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryForeground: 'text-white',
    primaryBorder: 'border-blue-600',
    secondary: 'bg-slate-700',
    secondaryHover: 'hover:bg-slate-800',
    secondaryText: 'text-slate-700',
    accent: 'bg-blue-400',
    accentHover: 'hover:bg-blue-500',
    accentText: 'text-blue-500',
    gradient: 'bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900',
    gradientLight: 'bg-gradient-to-br from-blue-50 to-slate-100',
    gradientHero: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
  },

  // Layout
  layout: {
    pageWrapper: 'min-h-screen flex flex-col',
    contentArea: 'flex-1',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    containerNarrow: 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8',
    sectionPadding: 'py-16 md:py-24',
    cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    statGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-4',
  },

  // Cards
  card: {
    base: 'rounded-2xl border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    bg: 'bg-white dark:bg-slate-900',
    bgHover: 'hover:shadow-md transition-shadow duration-200',
    padding: 'p-5',
    paddingLg: 'p-6',
    border: 'border-slate-200 dark:border-slate-800',
    vehicleCard: 'rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer',
    vehicleImgWrapper: 'relative h-44 overflow-hidden',
    vehicleImg: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
    vehicle3DEffect: '',
    vehicle3DCard: '',
  },

  // Buttons
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center gap-2 disabled:opacity-60 disabled:pointer-events-none',
    primarySm: 'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-3.5 py-1.5 text-sm transition-all duration-200 inline-flex items-center gap-1.5',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 inline-flex items-center gap-2',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 inline-flex items-center gap-2',
    outlineSm: 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-medium rounded-lg px-3.5 py-1.5 text-sm transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 inline-flex items-center gap-2',
    dangerSm: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-3.5 py-1.5 text-sm transition-all duration-200',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-lg px-3 py-2 text-sm transition-colors inline-flex items-center gap-2',
    iconBtn: 'p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-200 inline-flex items-center gap-2',
  },

  // Navigation
  nav: {
    topBar: 'h-14 flex items-center border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 shrink-0 gap-3',
    sidebar: 'w-64 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0',
    sidebarCollapsed: 'w-16 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0',
    sidebarItem: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none',
    sidebarItemActive: 'bg-blue-600 text-white shadow-sm',
    sidebarItemInactive: 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    mobileMenuBtn: 'lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
    link: 'text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
    linkActive: 'text-sm font-medium text-blue-600 dark:text-blue-400',
    bottomNav: 'fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 h-16',
    bottomNavItem: 'flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer',
    bottomNavActive: 'text-blue-600 dark:text-blue-400',
    bottomNavInactive: 'text-slate-400 dark:text-slate-500',
  },

  // Typography
  typography: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white',
    h3: 'text-xl font-semibold text-slate-900 dark:text-slate-100',
    h4: 'text-lg font-semibold text-slate-900 dark:text-slate-100',
    h5: 'text-base font-medium text-slate-900 dark:text-slate-100',
    body: 'text-sm text-slate-600 dark:text-slate-300 leading-relaxed',
    bodyLg: 'text-base text-slate-600 dark:text-slate-300 leading-relaxed',
    caption: 'text-xs text-slate-500 dark:text-slate-400',
    label: 'text-sm font-medium text-slate-700 dark:text-slate-200',
    heroTitle: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white',
    heroSubtitle: 'text-lg sm:text-xl text-slate-200 max-w-2xl',
    sectionTitle: 'text-3xl md:text-4xl font-bold text-slate-900 dark:text-white',
    sectionSubtitle: 'text-lg text-slate-500 dark:text-slate-400 max-w-2xl',
    statValue: 'text-2xl font-bold text-slate-900 dark:text-white',
    statLabel: 'text-xs text-slate-500 dark:text-slate-400 font-medium',
    headingText: 'text-slate-900 dark:text-slate-100',
    bodyText: 'text-slate-600 dark:text-slate-400',
    captionText: 'text-slate-500 dark:text-slate-500',
    labelText: 'text-slate-700 dark:text-slate-300',
  },

  // Forms
  form: {
    input: 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    inputError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    label: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5',
    helper: 'text-xs text-slate-500 dark:text-slate-400 mt-1',
    select: 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100',
    textarea: 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900 dark:text-slate-100',
  },

  // Badges / Status
  status: {
    requested: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    assigned: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    inTransit: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    cancelled: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    maintenance: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1',
  },

  // Map
  map: {
    container: 'w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700',
    containerFixed: 'w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700',
    containerModal: 'w-full h-[380px] rounded-xl overflow-hidden',
    containerFullHeight: 'w-full rounded-none overflow-hidden',
    marker: '',
    popup: 'text-sm font-medium',
  },

  // Milestone bar
  milestone: {
    track: 'relative flex items-center justify-between w-full',
    line: 'absolute top-4 left-0 h-0.5 w-full bg-slate-200 dark:bg-slate-700',
    lineProgress: 'absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-700',
    step: 'relative z-10 flex flex-col items-center',
    circle: 'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
    circleComplete: 'bg-blue-600 border-blue-600 text-white',
    circleActive: 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600',
    circlePending: 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400',
    label: 'text-xs mt-2 font-medium text-center max-w-[72px]',
    labelActive: 'text-blue-700 dark:text-blue-400',
    labelPending: 'text-slate-400 dark:text-slate-500',
  },

  // Misc
  misc: {
    overlay: 'absolute inset-0 bg-black/50 backdrop-blur-sm z-0',
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    pulse: 'animate-pulse',
    skeleton: 'bg-slate-200 dark:bg-slate-800 rounded-lg',
    divider: 'border-t border-slate-200 dark:border-slate-800',
    scrollArea: 'max-h-96 overflow-y-auto',
    scrollAreaCustom: 'max-h-96 overflow-y-auto scrollbar-thin',
  },

  // Live indicator
  liveIndicator: {
    dot: 'w-2 h-2 rounded-full',
    dotLive: 'w-2 h-2 rounded-full bg-emerald-500',
    dotOffline: 'w-2 h-2 rounded-full bg-slate-400',
    pulseRing: 'absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping',
    label: 'text-sm font-medium',
    labelLive: 'text-sm font-medium text-emerald-600 dark:text-emerald-400',
    labelOffline: 'text-sm font-medium text-slate-400',
    wrapper: 'flex items-center gap-2',
  },

  // Notification bell & panel
  notification: {
    panel: 'w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden',
    item: 'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
    itemUnread: 'bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-l-blue-500',
    badge: 'absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1',
    empty: 'flex flex-col items-center justify-center py-12 text-center',
  },

  // Dialog overlay & content
  dialog: {
    overlay: 'bg-black/50 backdrop-blur-sm',
    content: 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  },

  // Scroll progress bar
  scrollProgress: {
    bar: 'fixed top-0 left-0 h-0.5 bg-blue-500 z-[60] transition-[width] duration-100 ease-out',
  },

  // Vehicle card accent borders
  vehicleAccent: {
    van: 'border-b-4 border-b-blue-500',
    truck: 'border-b-4 border-b-amber-500',
    hauler: 'border-b-4 border-b-purple-500',
  },

  // Stat card accent borders (left border)
  statCard: {
    blue: 'border-l-4 border-l-blue-500',
    emerald: 'border-l-4 border-l-emerald-500',
    amber: 'border-l-4 border-l-amber-500',
    slate: 'border-l-4 border-l-slate-400',
    purple: 'border-l-4 border-l-purple-500',
    rose: 'border-l-4 border-l-rose-500',
    hover: 'hover:shadow-md transition-shadow duration-200',
  },

  // Sidebar enhancements
  sidebar: {
    gradientTop: 'h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400',
    itemActive: 'bg-blue-600 text-white shadow-sm',
    itemTransition: 'transition-all duration-150',
    avatarCircle: 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
    avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },

  // Table row zebra striping
  table: {
    zebraRow: 'even:bg-slate-50/50 dark:even:bg-slate-800/20',
    scrollCard: 'p-0 overflow-y-auto',
  },

  // Empty state card
  emptyState: {
    card: 'border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl',
    pattern: 'absolute inset-0 pointer-events-none',
  },

  // CTA shimmer button
  cta: {
    shimmer: 'cta-shimmer',
  },

  // Footer link animation
  footer: {
    base: 'mt-auto border-t bg-slate-900 text-slate-300',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6',
    grid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8',
    link: 'text-slate-400 hover:text-white transition-colors text-sm footer-link-anim',
    heading: 'text-white font-semibold mb-3 text-sm',
    bottomBar: 'border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-slate-500',
    brandCol: 'col-span-2 sm:col-span-3 lg:col-span-1',
    brandName: 'text-white text-base font-semibold flex items-center gap-2 mb-2',
    brandDesc: 'text-xs sm:text-sm text-slate-400 leading-relaxed',
  },

  // Dark mode convenience classes
  darkMode: {
    pageBg: 'bg-slate-50 dark:bg-slate-950',
    sidebarBg: 'bg-white dark:bg-slate-900',
    topBarBg: 'bg-white dark:bg-slate-900',
    cardSurface: 'bg-white dark:bg-slate-900',
    authBg: 'bg-slate-50 dark:bg-slate-950',
    headingText: 'text-slate-900 dark:text-slate-100',
    bodyText: 'text-slate-600 dark:text-slate-400',
    captionText: 'text-slate-500 dark:text-slate-500',
    labelText: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800',
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-800',
    sidebarActive: 'bg-blue-600 text-white shadow-sm',
    sidebarInactive: 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    avatarBg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    iconBtnHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    mobileMenuHover: 'lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
    gradientLightDark: 'bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950',
    contentBg: 'bg-slate-50 dark:bg-slate-950',
  },
} as const;

export type ThemeKeys = keyof typeof theme;
