/**
 * FleetVane Theme Configuration
 * All Tailwind class literals are centralized here.
 * Components MUST consume these strings — NO hardcoded styling.
 */

export const theme = {
  // Brand colors - FleetVane uses a deep teal/emerald palette
  brand: {
    primary: 'bg-emerald-700',
    primaryHover: 'hover:bg-emerald-800',
    primaryText: 'text-emerald-700',
    primaryForeground: 'text-emerald-50',
    primaryBorder: 'border-emerald-700',
    secondary: 'bg-slate-800',
    secondaryHover: 'hover:bg-slate-900',
    secondaryText: 'text-slate-800',
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',
    accentText: 'text-amber-500',
    gradient: 'bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900',
    gradientLight: 'bg-gradient-to-br from-emerald-50 to-slate-50',
    gradientHero: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900',
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
    base: 'rounded-xl border shadow-sm transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    bg: 'bg-white dark:bg-slate-900',
    bgHover: 'hover:shadow-lg hover:-translate-y-1',
    padding: 'p-6',
    paddingLg: 'p-8',
    border: 'border-slate-200 dark:border-slate-800',
    vehicleCard: 'rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer',
    vehicleImgWrapper: 'relative h-48 sm:h-56 overflow-hidden',
    vehicleImg: 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110',
    vehicle3DEffect: 'perspective-1000',
    vehicle3DCard: 'transform-style-preserve-3d transition-transform duration-500 hover:rotate-y-6',
  },

  // Buttons
  button: {
    primary: 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
    primarySm: 'bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all duration-200',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg px-6 py-3 transition-all duration-200',
    outline: 'border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-lg px-6 py-3 transition-all duration-200',
    outlineSm: 'border border-emerald-700 text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg px-4 py-2 text-sm transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200',
    ghost: 'hover:bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-2 text-sm transition-all duration-200',
    iconBtn: 'p-2 rounded-lg hover:bg-slate-100 transition-colors',
  },

  // Navigation
  nav: {
    topBar: 'fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-lg pt-[env(safe-area-inset-top)]',
    sidebar: 'w-64 border-r bg-card h-screen sticky top-0',
    sidebarCollapsed: 'w-16 border-r bg-card h-screen sticky top-0',
    sidebarItem: 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
    sidebarItemActive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    sidebarItemInactive: 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100',
    mobileMenuBtn: 'lg:hidden p-2 rounded-lg hover:bg-slate-100',
    link: 'text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors',
    linkActive: 'text-sm font-medium text-emerald-700 border-b-2 border-emerald-700 pb-1',
  },

  // Typography
  typography: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white',
    h3: 'text-2xl font-semibold text-slate-900 dark:text-slate-100',
    h4: 'text-xl font-semibold text-slate-900 dark:text-slate-100',
    h5: 'text-lg font-medium text-slate-900 dark:text-slate-100',
    body: 'text-base text-slate-600 dark:text-slate-300 leading-relaxed',
    bodyLg: 'text-lg text-slate-600 dark:text-slate-300 leading-relaxed',
    caption: 'text-sm text-slate-500 dark:text-slate-400',
    label: 'text-sm font-medium text-slate-700 dark:text-slate-200',
    heroTitle: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white',
    heroSubtitle: 'text-lg sm:text-xl text-slate-200 dark:text-slate-300 max-w-2xl',
    sectionTitle: 'text-3xl md:text-4xl font-bold text-slate-900 dark:text-white',
    sectionSubtitle: 'text-lg text-slate-600 dark:text-slate-300 max-w-2xl',
    statValue: 'text-3xl font-bold text-slate-900 dark:text-white',
    statLabel: 'text-sm text-slate-500 dark:text-slate-400',
  },

  // Forms
  form: {
    input: 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all',
    inputError: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    label: 'block text-sm font-medium text-slate-700 mb-1.5',
    helper: 'text-xs text-slate-500 mt-1',
    select: 'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none',
    textarea: 'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none',
  },

  // Badges / Status
  status: {
    requested: 'bg-amber-100 text-amber-800 border-amber-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    inTransit: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    delivered: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-slate-100 text-slate-800',
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
  },

  // Map
  map: {
    container: 'w-full h-full rounded-xl overflow-hidden border',
    containerFixed: 'w-full h-[500px] rounded-xl overflow-hidden border',
    containerModal: 'w-full h-[400px] rounded-lg overflow-hidden',
    marker: '',
    popup: 'text-sm font-medium',
  },

  // Milestone bar
  milestone: {
    track: 'relative flex items-center justify-between w-full',
    line: 'absolute top-5 left-0 h-0.5 w-full bg-slate-200',
    lineProgress: 'absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-700',
    step: 'relative z-10 flex flex-col items-center',
    circle: 'w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all',
    circleComplete: 'bg-emerald-500 border-emerald-500 text-white',
    circleActive: 'bg-white border-emerald-500 text-emerald-500',
    circlePending: 'bg-white border-slate-300 text-slate-400',
    label: 'text-xs mt-2 font-medium text-center max-w-[80px]',
    labelActive: 'text-emerald-700',
    labelPending: 'text-slate-400',
  },

  // Misc
  misc: {
    overlay: 'absolute inset-0 bg-black/50 backdrop-blur-sm z-0',
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    pulse: 'animate-pulse',
    skeleton: 'bg-slate-200 dark:bg-slate-700 rounded skeleton-smooth',
    divider: 'border-t border-slate-200 dark:border-slate-700',
    scrollArea: 'max-h-96 overflow-y-auto',
    scrollAreaCustom: 'max-h-96 overflow-y-auto scrollbar-thin',
  },

  // Live indicator
  liveIndicator: {
    dot: 'w-2.5 h-2.5 rounded-full',
    dotLive: 'w-2.5 h-2.5 rounded-full bg-emerald-500',
    dotOffline: 'w-2.5 h-2.5 rounded-full bg-slate-400',
    pulseRing: 'absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping',
    label: 'text-sm font-medium',
    labelLive: 'text-sm font-medium text-emerald-700 dark:text-emerald-400',
    labelOffline: 'text-sm font-medium text-slate-400',
    wrapper: 'flex items-center gap-2',
  },

  // Notification bell & panel
  notification: {
    panel: 'w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl p-0 overflow-hidden',
    item: 'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer',
    itemUnread: 'bg-emerald-50/60 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500',
    badge: 'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1',
    empty: 'flex flex-col items-center justify-center py-12 text-center',
  },

  // Dialog overlay & content
  dialog: {
    overlay: 'bg-black/50 backdrop-blur-sm',
    content: 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  },

  // Scroll progress bar
  scrollProgress: {
    bar: 'fixed top-0 left-0 h-0.5 bg-emerald-500 z-[60] transition-[width] duration-100 ease-out',
  },

  // Vehicle card accent borders
  vehicleAccent: {
    van: 'border-b-4 border-b-emerald-500',
    truck: 'border-b-4 border-b-amber-500',
    hauler: 'border-b-4 border-b-rose-500',
  },

  // Stat card accent borders (left border)
  statCard: {
    emerald: 'border-l-4 border-l-emerald-500',
    amber: 'border-l-4 border-l-amber-500',
    blue: 'border-l-4 border-l-blue-500',
    slate: 'border-l-4 border-l-slate-400',
    purple: 'border-l-4 border-l-purple-500',
    rose: 'border-l-4 border-l-rose-500',
    hover: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  },

  // Sidebar enhancements
  sidebar: {
    gradientTop: 'h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400',
    itemActive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-l-[3px] border-l-emerald-500',
    itemTransition: 'transition-all duration-200',
    avatarCircle: 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
    avatarBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },

  // Table row zebra striping
  table: {
    zebraRow: 'even:bg-slate-50 dark:even:bg-slate-900/50',
    scrollCard: 'p-0 custom-scrollbar overflow-y-auto',
  },

  // Empty state card
  emptyState: {
    card: 'border-2 border-dashed rounded-xl relative overflow-hidden',
    pattern: 'absolute inset-0 empty-state-pattern pointer-events-none',
  },

  // CTA shimmer button
  cta: {
    shimmer: 'cta-shimmer',
  },

  // Footer link animation
  footer: {
    base: 'mt-auto border-t bg-slate-900 text-slate-300',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1 sm:pt-10 sm:pb-6',
    grid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8',
    link: 'text-slate-400 hover:text-white transition-colors text-sm footer-link-anim',
    heading: 'text-white font-semibold mb-3 text-sm',
    bottomBar: 'border-t border-slate-800 mt-4 sm:mt-8 pt-3 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-slate-500',
    brandCol: 'col-span-2 sm:col-span-3 lg:col-span-1',
    brandName: 'text-white text-base font-semibold flex items-center gap-2 mb-2',
    brandDesc: 'text-xs sm:text-sm text-slate-400 leading-relaxed',
  },

  // Dark mode convenience classes
  // Components can also use Tailwind dark: directly
  darkMode: {
    // Page backgrounds
    pageBg: 'bg-slate-50 dark:bg-slate-950',
    // Sidebar
    sidebarBg: 'bg-card dark:bg-slate-900',
    // Topbar
    topBarBg: 'bg-white/80 dark:bg-slate-900/80',
    // Card surfaces
    cardSurface: 'bg-white dark:bg-slate-900',
    // Auth pages
    authBg: 'bg-slate-50 dark:bg-slate-950',
    // Text adjustments
    headingText: 'text-slate-900 dark:text-slate-100',
    bodyText: 'text-slate-600 dark:text-slate-400',
    captionText: 'text-slate-500 dark:text-slate-500',
    labelText: 'text-slate-700 dark:text-slate-300',
    // Borders
    borderColor: 'border-slate-200 dark:border-slate-700',
    // Hover backgrounds
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-800',
    // Active sidebar item
    sidebarActive: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
    // Inactive sidebar item
    sidebarInactive: 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    // Avatar
    avatarBg: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    // Icon button hover
    iconBtnHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    // Mobile menu button
    mobileMenuHover: 'lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
    // Gradient sections (dark overrides)
    gradientLightDark: 'bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-slate-900 dark:to-slate-950',
    // Content area
    contentBg: 'bg-background',
  },
} as const;

export type ThemeKeys = keyof typeof theme;
