import React, { useState, useEffect } from 'react';
import { subscribeToPlatformSettings } from '../../services/dbService';
import {
  Wifi,
  Phone,
  Zap,
  Tv,
  CreditCard,
  Printer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  HelpCircle,
  Check,
  Award,
  Layers,
  TrendingUp,
  Lock,
  Server,
  ChevronRight,
  Star,
  Users,
  Clock,
  Headphones,
  Sparkles,
  Menu,
  X,
  Building2,
  FileText,
  BadgeCheck,
  Home,
} from 'lucide-react';
import { ScreenType, UserProfile } from '../../types';

interface LandingPageProps {
  onNavigate: (screen: ScreenType) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  currentUser?: UserProfile | null;
}

export function LandingPage({
  onNavigate,
  isLightMode,
  onToggleTheme,
  currentUser,
}: LandingPageProps) {
  const [activeNetworkTab, setActiveNetworkTab] = useState<'mtn' | 'airtel' | 'glo' | '9mobile' | 'smile'>('mtn');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Live customizable contact & company info from Admin Dashboard
  const [supportPhone, setSupportPhone] = useState('+2347048609646');
  const [supportEmail, setSupportEmail] = useState('support@ajdatasub.com.ng');
  const [officeAddress, setOfficeAddress] = useState('Katsina, Nigeria');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+2347048609646');

  useEffect(() => {
    const unsub = subscribeToPlatformSettings((settings) => {
      if (settings?.supportContacts) {
        if (settings.supportContacts.phone) setSupportPhone(settings.supportContacts.phone);
        if (settings.supportContacts.email) setSupportEmail(settings.supportContacts.email);
        if (settings.supportContacts.whatsapp) setSupportWhatsapp(settings.supportContacts.whatsapp);
        if (settings.supportContacts.officeAddress) setOfficeAddress(settings.supportContacts.officeAddress);
      }
    });
    return () => unsub();
  }, []);

  // Pricing data per network matching the mockup layout
  const rateCards = {
    mtn: [
      { size: '1GB', price: '₦1,000', discountPrice: '₦260', validity: '30 Days', popular: false },
      { size: '2GB', price: '₦1,800', discountPrice: '₦520', validity: '30 Days', popular: false },
      { size: '5GB', price: '₦4,000', discountPrice: '₦1,300', validity: '30 Days', popular: true },
      { size: '10GB', price: '₦7,500', discountPrice: '₦2,600', validity: '30 Days', popular: false },
    ],
    airtel: [
      { size: '1GB', price: '₦1,000', discountPrice: '₦275', validity: '30 Days', popular: false },
      { size: '2GB', price: '₦1,800', discountPrice: '₦550', validity: '30 Days', popular: false },
      { size: '5GB', price: '₦4,000', discountPrice: '₦1,375', validity: '30 Days', popular: true },
      { size: '10GB', price: '₦7,500', discountPrice: '₦2,750', validity: '30 Days', popular: false },
    ],
    glo: [
      { size: '1GB', price: '₦900', discountPrice: '₦250', validity: '30 Days', popular: false },
      { size: '2GB', price: '₦1,700', discountPrice: '₦500', validity: '30 Days', popular: false },
      { size: '5GB', price: '₦3,800', discountPrice: '₦1,250', validity: '30 Days', popular: true },
      { size: '10GB', price: '₦7,000', discountPrice: '₦2,500', validity: '30 Days', popular: false },
    ],
    '9mobile': [
      { size: '1GB', price: '₦950', discountPrice: '₦220', validity: '30 Days', popular: false },
      { size: '2GB', price: '₦1,750', discountPrice: '₦440', validity: '30 Days', popular: false },
      { size: '5GB', price: '₦3,900', discountPrice: '₦1,100', validity: '30 Days', popular: true },
      { size: '10GB', price: '₦7,200', discountPrice: '₦2,200', validity: '30 Days', popular: false },
    ],
    smile: [
      { size: '1.5GB', price: '₦1,200', discountPrice: '₦980', validity: '30 Days', popular: false },
      { size: '3GB', price: '₦2,200', discountPrice: '₦1,900', validity: '30 Days', popular: false },
      { size: '5GB', price: '₦4,200', discountPrice: '₦3,500', validity: '30 Days', popular: true },
      { size: '10GB', price: '₦8,000', discountPrice: '₦6,800', validity: '30 Days', popular: false },
    ],
  };

  const services = [
    {
      id: 'data',
      title: 'Data Bundles',
      description: 'All networks, affordable and instant.',
      icon: Wifi,
      accent: 'from-amber-400 to-amber-500',
    },
    {
      id: 'airtime',
      title: 'Airtime Top-Up',
      description: 'MTN, Airtel, Glo, 9mobile. 2%–3% off.',
      icon: Phone,
      accent: 'from-blue-400 to-blue-500',
    },
    {
      id: 'electricity',
      title: 'Electricity Bills',
      description: 'Pay PHCN and all distribution companies.',
      icon: Zap,
      accent: 'from-amber-400 to-yellow-500',
    },
    {
      id: 'cable',
      title: 'Cable TV',
      description: 'DStv, GOtv, Startimes and more.',
      icon: Tv,
      accent: 'from-sky-400 to-blue-500',
    },
    {
      id: 'scratch-cards',
      title: 'Printable Scratch Cards',
      description: 'WAEC/NECO & Exam Pins instantly.',
      icon: Printer,
      accent: 'from-amber-400 to-orange-500',
    },
    {
      id: 'virtual-accounts',
      title: 'Dedicated Virtual Accounts',
      description: 'Personalized bank accounts for fast auto-funding.',
      icon: Building2,
      accent: 'from-emerald-400 to-teal-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sanusi Abdullahi',
      location: 'Kano',
      quote:
        "Fast and reliable! I've been using AJDATASUB for months now, never disappointed.",
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      initials: 'SA',
    },
    {
      name: 'Amina Yusuf',
      location: 'Kaduna',
      quote:
        "The cheapest data rates I've seen so far. And the delivery is always under 10 seconds!",
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      initials: 'AY',
    },
    {
      name: 'Bello Mohammed',
      location: 'Abuja',
      quote:
        'Their customer support is excellent. I got help within minutes. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      initials: 'BM',
    },
  ];

  const faqs = [
    {
      question: 'Which networks do you support for data & airtime?',
      answer:
        'We support all 4 major Nigerian telecommunication networks: MTN, Airtel, Glo, and 9mobile, offering SME, Corporate Gifting (CG), and direct Gifting data bundles alongside discounted airtime.',
    },
    {
      question: 'How fast is the delivery of bills and data?',
      answer:
        'Delivery is fully automated through direct telecom switch APIs. Orders are dispatched and credited to the recipient mobile line in approximately 3 to 5 seconds.',
    },
    {
      question: 'Is there a minimum amount for wallet funding?',
      answer:
        'No, there is no high minimum limit. You can fund your wallet with any convenient amount starting from ₦100 using your dedicated automated virtual bank accounts (Monnify / Wema / Sterling / Fidelity).',
    },
    {
      question: 'What if my transaction fails?',
      answer:
        'Our system is engineered with automated real-time reconciliation. If a telecom operator experiences downtime, your wallet is automatically refunded immediately without requiring manual support intervention.',
    },
    {
      question: 'Can I resell data or integrate your API?',
      answer:
        'Yes! We offer wholesale rates designed for resellers, students, and businesses. Developers can also integrate our RESTful JSON API with webhook callbacks.',
    },
  ];

  const scrollToSection = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (id === 'top' || id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const cleanId = id.replace(/^#/, '');
    const el = document.getElementById(cleanId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 bg-white selection:bg-[#F5B014] selection:text-slate-950 overflow-x-clip">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Sticky Navy Header with Frosted Glass Effect) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#061838]/95 backdrop-blur-md border-b border-white/10 shadow-md transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white overflow-hidden shadow-md ring-2 ring-white/25 border border-white/40 shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="AJDATASUB"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm sm:text-lg tracking-tight text-white leading-tight">
                AJDATASUB
              </span>
              <span className="text-[9px] sm:text-[11px] text-[#F5B014] font-medium tracking-wide">
                Instant & Automated Telecoms
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-200">
            <button
              type="button"
              onClick={(e) => scrollToSection('top', e)}
              className="text-[#F5B014] hover:text-[#F5B014] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection('services', e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Services
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection('rates', e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Rates
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection('about', e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={(e) => scrollToSection('faq', e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Desktop Auth Controls */}
            {currentUser ? (
              <button
                type="button"
                id="navbar-dashboard-btn"
                onClick={() => onNavigate('home')}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5B014] hover:bg-[#e09e0f] active:bg-[#c98c0a] text-slate-950 transition-all shadow-sm cursor-pointer min-h-[44px]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <button
                  type="button"
                  id="navbar-signin-btn"
                  onClick={() => onNavigate('login')}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white border border-white/25 hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer min-h-[44px]"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="navbar-register-btn"
                  onClick={() => onNavigate('register')}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-950 bg-[#F5B014] hover:bg-[#e09e0f] active:bg-[#c98c0a] transition-all shadow-sm cursor-pointer min-h-[44px]"
                >
                  Open Free Account
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              id="landing-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-[#F5B014]" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Compact Floating Top-Right Popover Menu (Small, neat, top-right with simple options) */}
            {isMobileMenuOpen && (
              <>
                {/* Backdrop to close on tap outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 z-50 md:hidden w-48 rounded-xl bg-[#071838] border border-white/20 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <nav className="flex flex-col space-y-0.5" aria-label="Mobile Navigation">
                    {[
                      { label: 'Home', section: 'top' },
                      { label: 'Services', section: 'services' },
                      { label: 'Rates & Pricing', section: 'rates' },
                      { label: 'About Us', section: 'about' },
                      { label: 'FAQ', section: 'faq' },
                    ].map((item) => (
                      <button
                        key={item.section}
                        type="button"
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
                          scrollToSection(item.section, e);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </nav>

                  {/* Clean Action Controls */}
                  <div className="pt-1.5 mt-1 border-t border-white/10">
                    {currentUser ? (
                      <button
                        type="button"
                        id="mobile-menu-dashboard-btn"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigate('home');
                        }}
                        className="w-full py-2 px-2.5 text-center text-xs font-bold text-slate-950 bg-[#F5B014] hover:bg-[#e09e0f] active:bg-[#c98c0a] rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span>Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          id="mobile-menu-signin-btn"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onNavigate('login');
                          }}
                          className="py-1.5 px-2 text-center text-[11px] font-bold text-white border border-white/20 hover:bg-white/10 active:bg-white/15 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Sign In</span>
                        </button>
                        <button
                          type="button"
                          id="mobile-menu-register-btn"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onNavigate('register');
                          }}
                          className="py-1.5 px-2 text-center text-[11px] font-bold text-slate-950 bg-[#F5B014] hover:bg-[#e09e0f] active:bg-[#c98c0a] rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Register</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Matching Mockup with Kano Minaret & Smartphone Artwork) */}
      {/* ========================================================================= */}
      <section id="home" className="relative bg-[#071838] text-white pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Background Subtle Gradient & Kano Mosque / Minaret Silhouette Artwork */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full object-cover" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
            <path
              d="M0,600 L0,480 Q180,450 360,490 Q540,530 720,470 Q900,410 1080,460 Q1260,510 1440,470 L1440,600 Z"
              fill="#0d285a"
            />
            {/* Minarets and Domes Silhouette on the right */}
            <rect x="1100" y="320" width="30" height="280" fill="#0d285a" rx="4" />
            <path d="M1100,320 Q1115,260 1130,320 Z" fill="#F5B014" opacity="0.4" />
            <rect x="1220" y="360" width="40" height="240" fill="#0d285a" rx="4" />
            <path d="M1210,360 Q1240,300 1270,360 Z" fill="#0d285a" />
            <rect x="1330" y="300" width="25" height="300" fill="#0d285a" rx="4" />
            <path d="M1330,300 Q1342.5,240 1355,300 Z" fill="#F5B014" opacity="0.4" />
          </svg>
        </div>

        {/* Ambient radial glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#F5B014]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left">
              {/* Pill Tag: FAST • SECURE • RELIABLE */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#38BDF8] bg-blue-950/80 border border-blue-800/60 mb-3 sm:mb-6">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span>FAST • SECURE • RELIABLE</span>
              </div>

              {/* H1 Main Heading */}
              <h1 className="text-xl sm:text-4xl lg:text-[54px] font-black tracking-tight leading-[1.2] mb-3 sm:mb-6 text-white">
                Instant Airtime, Data Bundles, Electricity & Utility Bills
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-base text-slate-300 font-normal leading-relaxed mb-4 sm:mb-8 max-w-2xl">
                Top up, pay bills and stay connected — all in one place. Fast, affordable and reliable services for everyone, anytime, anywhere in Nigeria.
              </p>

              {/* CTA Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3.5 max-w-md">
                <button
                  type="button"
                  id="hero-open-account-btn"
                  onClick={() => onNavigate('register')}
                  className="px-3 py-2 sm:px-7 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-[#F5B014] hover:bg-[#e09e0f] active:bg-[#c98c0a] text-slate-950 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] text-center"
                >
                  <span>Open Account</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  id="hero-signin-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3 py-2 sm:px-7 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] text-center"
                >
                  <span>Sign In</span>
                </button>
              </div>
            </div>

            {/* Right Hero Graphic: Smartphone Mockup with Circular Floating Badges */}
            <div className="lg:col-span-5 relative flex items-center justify-center mt-6 lg:mt-0">
              <div className="relative w-full max-w-[210px] sm:max-w-[340px]">
                {/* Floating Service Badge 1: Top-Right (Airtime) */}
                <div className="absolute -top-1.5 -right-1 sm:-right-4 z-20 bg-[#081f4a] border border-sky-400/40 rounded-full px-2 py-1 sm:px-3.5 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5">
                  <div className="w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <Phone className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold text-white tracking-wide">Airtime</span>
                </div>

                {/* Floating Service Badge 2: Left-Middle (Data) */}
                <div className="absolute top-1/4 -left-1.5 sm:-left-6 z-20 bg-[#081f4a] border border-amber-400/40 rounded-full px-2 py-1 sm:px-3.5 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5">
                  <div className="w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-[#F5B014] flex items-center justify-center text-slate-950 font-bold">
                    <Wifi className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold text-white tracking-wide">Data</span>
                </div>

                {/* Floating Service Badge 3: Right-Middle (TV) */}
                <div className="absolute top-1/2 -right-1.5 sm:-right-6 z-20 bg-[#081f4a] border border-sky-400/40 rounded-full px-2 py-1 sm:px-3.5 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5">
                  <div className="w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-sky-500 flex items-center justify-center text-white">
                    <Tv className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold text-white tracking-wide">TV</span>
                </div>

                {/* Floating Service Badge 4: Left-Bottom (Electricity) */}
                <div className="absolute bottom-4 -left-1.5 sm:-left-6 z-20 bg-[#081f4a] border border-amber-400/40 rounded-full px-2 py-1 sm:px-3.5 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5">
                  <div className="w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                    <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold text-white tracking-wide">Electricity</span>
                </div>

                {/* The Smartphone Mockup Container */}
                <div className="relative mx-auto rounded-[28px] sm:rounded-[42px] p-1.5 sm:p-2.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-2xl border sm:border-4 border-slate-700/80">
                  {/* Phone Screen */}
                  <div className="relative rounded-[24px] sm:rounded-[34px] bg-gradient-to-b from-[#091b3d] via-[#051126] to-[#020712] overflow-hidden p-3 sm:p-6 aspect-[9/18.5] flex flex-col items-center justify-between border border-white/10">
                    {/* Top Speaker / Camera Notch */}
                    <div className="w-16 sm:w-24 h-3 sm:h-4 bg-slate-900 rounded-full mb-3 sm:mb-6 mx-auto flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-black/60 mr-1.5"></div>
                      <div className="w-5 sm:w-8 h-1 bg-slate-800 rounded-full"></div>
                    </div>

                    {/* Center AJD Gold Seal Logo with Radial Glow */}
                    <div className="my-auto flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-xl animate-pulse"></div>
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-2xl border-2 border-white/40 overflow-hidden flex items-center justify-center">
                          <img
                            src="/logo.png"
                            alt="AJDATASUB"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <span className="mt-2.5 sm:mt-3 font-heading font-black text-white text-xs sm:text-lg tracking-wider">
                        AJDATASUB
                      </span>
                      <span className="text-[9px] sm:text-xs text-[#F5B014] font-semibold mt-0.5">
                        Nigeria's Premier VTU Switch
                      </span>
                    </div>

                    {/* Bottom Status / Navigation Bar on Screen */}
                    <div className="w-full pt-2.5 sm:pt-4 border-t border-white/10 flex items-center justify-around text-[8px] sm:text-[10px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Online</span>
                      </div>
                      <span>5s Dispatch</span>
                      <span>256-Bit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TRUST STRIP (White Bar Below Hero - Compact & Eye-Friendly) */}
      {/* ========================================================================= */}
      <section className="bg-white border-b border-slate-200 py-3 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-8 items-center text-left">
            {/* Trust 1 */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 p-1.5 sm:p-0 rounded-xl bg-slate-50/60 sm:bg-transparent">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-[#071838] flex items-center justify-center shrink-0 border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-[#071838]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[10px] sm:text-base text-slate-900 leading-tight truncate">100% Secure</h4>
                <p className="text-[8px] sm:text-xs text-slate-500 truncate">Bank Encryption</p>
              </div>
            </div>

            {/* Trust 2 */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 p-1.5 sm:p-0 rounded-xl bg-slate-50/60 sm:bg-transparent">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-[#071838] flex items-center justify-center shrink-0 border border-blue-100">
                <Users className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-[#071838]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[10px] sm:text-base text-slate-900 leading-tight truncate">50,000+ Users</h4>
                <p className="text-[8px] sm:text-xs text-slate-500 truncate">Active Community</p>
              </div>
            </div>

            {/* Trust 3 - Replaces 'Registered with CAC | RC 8153406' */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 p-1.5 sm:p-0 rounded-xl bg-slate-50/60 sm:bg-transparent">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-[#071838] flex items-center justify-center shrink-0 border border-blue-100">
                <Zap className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-[#F5B014]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[10px] sm:text-base text-slate-900 leading-tight truncate">Instant Top-Up</h4>
                <p className="text-[8px] sm:text-xs text-slate-500 truncate">24/7 Automated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OUR SERVICES (Clean Off-White 6-Card Grid) */}
      {/* ========================================================================= */}
      <section id="services" className="py-8 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-1">
              OUR SERVICES
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-[#071838] tracking-tight mb-1.5">
              Fast & Reliable Services
            </h2>
            <p className="text-[11px] sm:text-base text-slate-600">
              Enjoy seamless transactions for all your digital and utility needs with AJDATASUB.
            </p>
          </div>

          {/* 6 Service Cards Grid (2 cols on mobile, 3 cols on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  onClick={() => onNavigate('register')}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-7 border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Navy Circle Icon with Accent Glyph */}
                    <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#071838] flex items-center justify-center text-white mb-2 sm:mb-5 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5B014]" />
                    </div>

                    <h3 className="text-xs sm:text-lg font-bold text-[#071838] mb-1 group-hover:text-blue-700 transition-colors leading-tight">
                      {srv.title}
                    </h3>
                    <p className="text-[10px] sm:text-sm text-slate-600 leading-normal line-clamp-2 sm:line-clamp-none">
                      {srv.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DATA BUNDLES & RATES (Deep Navy Background with 4 White Cards) */}
      {/* ========================================================================= */}
      <section id="rates" className="py-10 sm:py-20 bg-[#071838] text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#F5B014] block mb-1.5">
              DATA BUNDLES & RATES
            </span>
            <h2 className="text-xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Buy Data at the Best Rates
            </h2>
            <p className="text-xs sm:text-base text-slate-300">
              Choose your network and get the best data bundle prices in Nigeria.
            </p>
          </div>

          {/* Side-by-Side Vertical Rectangles: One for each network (MTN, Airtel, Glo, 9mobile) - Non-clickable informational rate cards (Item 7) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {[
              {
                id: 'mtn',
                name: 'MTN NIGERIA',
                badgeText: 'MTN',
                badgeColor: 'bg-yellow-400 text-slate-950',
                headerBg: 'bg-linear-to-r from-amber-400 to-yellow-500 text-slate-950',
                borderStyle: 'border-yellow-400/50',
                plans: [
                  { size: '500MB', price: '₦140', validity: '30 Days' },
                  { size: '1.0GB', price: '₦260', validity: '30 Days' },
                  { size: '2.0GB', price: '₦520', validity: '30 Days' },
                  { size: '3.0GB', price: '₦780', validity: '30 Days' },
                  { size: '5.0GB', price: '₦1,300', validity: '30 Days' },
                  { size: '10.0GB', price: '₦2,600', validity: '30 Days' },
                ],
              },
              {
                id: 'airtel',
                name: 'AIRTEL NIGERIA',
                badgeText: 'AIRTEL',
                badgeColor: 'bg-red-600 text-white',
                headerBg: 'bg-linear-to-r from-red-600 to-rose-700 text-white',
                borderStyle: 'border-red-500/50',
                plans: [
                  { size: '500MB', price: '₦150', validity: '30 Days' },
                  { size: '1.0GB', price: '₦275', validity: '30 Days' },
                  { size: '2.0GB', price: '₦550', validity: '30 Days' },
                  { size: '3.0GB', price: '₦825', validity: '30 Days' },
                  { size: '5.0GB', price: '₦1,375', validity: '30 Days' },
                  { size: '10.0GB', price: '₦2,750', validity: '30 Days' },
                ],
              },
              {
                id: 'glo',
                name: 'GLO NIGERIA',
                badgeText: 'GLO',
                badgeColor: 'bg-emerald-600 text-white',
                headerBg: 'bg-linear-to-r from-emerald-600 to-green-700 text-white',
                borderStyle: 'border-emerald-500/50',
                plans: [
                  { size: '500MB', price: '₦135', validity: '30 Days' },
                  { size: '1.0GB', price: '₦250', validity: '30 Days' },
                  { size: '2.0GB', price: '₦500', validity: '30 Days' },
                  { size: '3.0GB', price: '₦750', validity: '30 Days' },
                  { size: '5.0GB', price: '₦1,250', validity: '30 Days' },
                  { size: '10.0GB', price: '₦2,500', validity: '30 Days' },
                ],
              },
              {
                id: '9mobile',
                name: '9MOBILE',
                badgeText: '9MOBILE',
                badgeColor: 'bg-lime-700 text-white',
                headerBg: 'bg-linear-to-r from-lime-700 to-green-800 text-white',
                borderStyle: 'border-lime-500/50',
                plans: [
                  { size: '500MB', price: '₦120', validity: '30 Days' },
                  { size: '1.0GB', price: '₦220', validity: '30 Days' },
                  { size: '2.0GB', price: '₦440', validity: '30 Days' },
                  { size: '3.0GB', price: '₦660', validity: '30 Days' },
                  { size: '5.0GB', price: '₦1,100', validity: '30 Days' },
                  { size: '10.0GB', price: '₦2,200', validity: '30 Days' },
                ],
              },
            ].map((net) => (
              <div
                key={net.id}
                className={`bg-white rounded-2xl shadow-xl border ${net.borderStyle} overflow-hidden flex flex-col justify-between select-none transition-all hover:shadow-2xl`}
              >
                {/* Network Header */}
                <div className={`${net.headerBg} p-3.5 sm:p-4 text-center`}>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${net.badgeColor} shadow-xs mb-1`}>
                    {net.badgeText}
                  </span>
                  <div className="text-xs sm:text-sm font-black tracking-wide uppercase font-heading">
                    {net.name}
                  </div>
                </div>

                {/* Vertical plan prices (Non-clickable, informational display) */}
                <div className="p-3 sm:p-4 divide-y divide-slate-100 flex-1 flex flex-col justify-between">
                  {net.plans.map((p, idx) => (
                    <div
                      key={idx}
                      className="py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm text-slate-800"
                    >
                      <span className="font-extrabold text-slate-900 font-sans">
                        {p.size}
                      </span>
                      <div className="text-right">
                        <span className="font-black font-sans text-slate-950 tabular-nums">
                          {p.price}
                        </span>
                        <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium">
                          {p.validity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Non-clickable info footer */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">
                    ⚡ Instant Automatic Dispense
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Link to Create Account / Sign In */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('register')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5B014] hover:bg-[#e09e0f] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Create Account to Buy Data</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. OUR IMPACT (Numbers That Speak) */}
      {/* ========================================================================= */}
      <section id="about" className="py-8 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-1">
              OUR IMPACT
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-[#071838] tracking-tight mb-1.5">
              Numbers That Speak
            </h2>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-8 text-center">
            {/* Stat 1 */}
            <div className="flex flex-col items-center p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-[#071838] flex items-center justify-center mb-1.5 sm:mb-4 border border-blue-100">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[#071838]" />
              </div>
              <p className="text-lg sm:text-4xl font-black text-[#071838] mb-0.5">
                50,000+
              </p>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">
                Active Users
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-[#071838] flex items-center justify-center mb-1.5 sm:mb-4 border border-blue-100">
                <span className="text-sm sm:text-xl font-black text-[#071838]">₦</span>
              </div>
              <p className="text-lg sm:text-4xl font-black text-[#071838] mb-0.5">
                ₦1.8B+
              </p>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">
                Value Processed
              </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-[#071838] flex items-center justify-center mb-1.5 sm:mb-4 border border-blue-100">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-[#071838]" />
              </div>
              <p className="text-lg sm:text-4xl font-black text-[#071838] mb-0.5">
                5 Seconds
              </p>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">
                Average Delivery
              </p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-[#071838] flex items-center justify-center mb-1.5 sm:mb-4 border border-blue-100">
                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-[#071838]" />
              </div>
              <p className="text-lg sm:text-4xl font-black text-[#071838] mb-0.5">
                99.98%
              </p>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium">
                Success Rate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. WHY AJDATASUB (Simple. Fast. Reliable.) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-20 bg-[#071838] text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F5B014] block mb-1">
              WHY AJDATASUB
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-white tracking-tight mb-1.5">
              Simple. Fast. Reliable.
            </h2>
            <p className="text-[11px] sm:text-base text-slate-300">
              We built AJDATASUB to make your digital life easier, safer and more affordable.
            </p>
          </div>

          {/* 4 Feature Columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/5 sm:border-0">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#0d285a] border border-blue-700/60 flex items-center justify-center text-[#F5B014] mb-2 sm:mb-5">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5B014]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Blazing Fast</h3>
              <p className="text-[10px] sm:text-sm text-slate-300 leading-tight sm:leading-relaxed">
                Get your data, airtime or bills paid in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/5 sm:border-0">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#0d285a] border border-blue-700/60 flex items-center justify-center text-[#F5B014] mb-2 sm:mb-5">
                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5B014]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Reliable</h3>
              <p className="text-[10px] sm:text-sm text-slate-300 leading-tight sm:leading-relaxed">
                Consistent service, 24/7 without downtime.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/5 sm:border-0">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#0d285a] border border-blue-700/60 flex items-center justify-center text-[#F5B014] mb-2 sm:mb-5">
                <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5B014]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Clear Pricing</h3>
              <p className="text-[10px] sm:text-sm text-slate-300 leading-tight sm:leading-relaxed">
                No hidden charges. What you see is what you pay.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/5 sm:border-0">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#0d285a] border border-blue-700/60 flex items-center justify-center text-[#F5B014] mb-2 sm:mb-5">
                <Headphones className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5B014]" />
              </div>
              <h3 className="text-xs sm:text-lg font-bold text-white mb-0.5 sm:mb-1">24/7 Support</h3>
              <p className="text-[10px] sm:text-sm text-slate-300 leading-tight sm:leading-relaxed">
                Our team is always ready to help you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TESTIMONIALS (What Our Customers Say) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-1">
              TESTIMONIALS
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-[#071838] tracking-tight mb-1.5">
              What Our Customers Say
            </h2>
            <p className="text-[11px] sm:text-base text-slate-600">
              Real words. Real experiences.
            </p>
          </div>

          {/* 3 Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Avatar & Rating */}
                  <div className="flex items-center gap-2.5 mb-2.5 sm:mb-4">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-[11px] sm:text-sm text-slate-700 italic leading-relaxed mb-3 sm:mb-6">
                    "{item.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-2.5 sm:pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-xs sm:text-sm text-[#071838]">{item.name}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. HOW IT WORKS (Get Started in 3 Simple Steps) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-1">
              HOW IT WORKS
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-[#071838] tracking-tight mb-1.5">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          {/* 3 Step Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 text-center relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#F5B014] text-slate-950 font-black text-xs sm:text-lg flex items-center justify-center mb-2 sm:mb-5 shadow-xs">
                1
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-[#071838] mb-0.5 sm:mb-2">Create Account</h3>
              <p className="text-[11px] sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                Register in less than 60 seconds with your phone number and security PIN.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#F5B014] text-slate-950 font-black text-xs sm:text-lg flex items-center justify-center mb-2 sm:mb-5 shadow-xs">
                2
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-[#071838] mb-0.5 sm:mb-2">Fund Your Wallet</h3>
              <p className="text-[11px] sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                Instant bank transfer to your unique dedicated virtual account number.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#F5B014] text-slate-950 font-black text-xs sm:text-lg flex items-center justify-center mb-2 sm:mb-5 shadow-xs">
                3
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-[#071838] mb-0.5 sm:mb-2">Start Transacting</h3>
              <p className="text-[11px] sm:text-sm text-slate-600 max-w-xs leading-relaxed">
                Buy data, airtime, or pay electricity bills instantly with 5-second delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section id="faq" className="py-8 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-1">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-lg sm:text-4xl font-black text-[#071838] tracking-tight mb-1.5">
              Got Questions?
            </h2>
            <p className="text-[11px] sm:text-base text-slate-600">
              Find answers to common questions about our service.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-2 sm:space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl sm:rounded-2xl border border-slate-200 transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full py-2.5 px-3.5 sm:py-4 sm:px-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-base text-[#071838] bg-white hover:bg-slate-50 transition-colors cursor-pointer min-h-[42px] sm:min-h-[44px]"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3 pt-1 sm:px-5 sm:pb-5 text-[11px] sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. CTA BANNER (Join Thousands Today) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-16 bg-[#071838] text-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-8 text-center lg:text-left">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F5B014] block mb-1">
                JOIN THOUSANDS TODAY
              </span>
              <h2 className="text-lg sm:text-3xl font-black text-white tracking-tight mb-1.5">
                Start Enjoying Fast, Reliable and Affordable VTU Services
              </h2>
              <p className="text-[11px] sm:text-sm text-slate-300">
                Open a free account now and experience the difference.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-3 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#F5B014] hover:bg-[#e09e0f] text-slate-950 transition-all shadow-md cursor-pointer min-h-[42px] sm:min-h-[44px] text-center"
              >
                Open Account →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-3 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white border border-white/20 hover:bg-white/10 transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] text-center"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FOOTER (Dark Midnight Navy matching Mockup) */}
      {/* ========================================================================= */}
      <footer className="bg-[#051226] text-slate-400 text-xs py-14 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
            {/* Column 1: Brand Info (5 cols) */}
            <div className="lg:col-span-4">
              <div
                className="flex items-center gap-3 mb-4 cursor-pointer select-none"
                onClick={() => onNavigate('landing')}
              >
                <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shadow-sm border border-white/40 shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src="/logo.png"
                    alt="AJDATASUB"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-heading font-black text-sm text-white block">
                    AJDATASUB
                  </span>
                  <span className="text-[10.5px] text-[#F5B014] font-medium tracking-wide">
                    Instant & Automated Telecoms
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Nigeria's premier automated VTU and digital payment switch. Delivering affordable data, instant airtime discounts, and utility bill settlements nationwide.
              </p>
            </div>

            {/* Column 2: Quick Links (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3.5">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={(e) => scrollToSection('top', e)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-300"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => scrollToSection('services', e)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-300"
                  >
                    Services
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => scrollToSection('rates', e)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-300"
                  >
                    Rates
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => scrollToSection('about', e)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-300"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(e) => scrollToSection('faq', e)}
                    className="hover:text-white transition-colors cursor-pointer text-slate-300"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Company (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3.5">
                Company
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#F5B014]" />
                  <span>{supportPhone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 text-[#F5B014] font-bold">@</span>
                  <span>{supportEmail}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 text-[#F5B014] font-bold">📍</span>
                  <span>{officeAddress}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 text-emerald-400 font-bold">💬</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="text-emerald-400 hover:underline cursor-pointer text-left transition-colors font-medium"
                    title="Sign in or register to chat with our live support agents"
                  >
                    Chat with Live Agent
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Social Links (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3.5">
                Connect With Us
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Stay updated for discount drops, switch status, and updates.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '') || '2347048609646'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F5B014] hover:text-slate-950 flex items-center justify-center text-white transition-colors"
                  title="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F5B014] hover:text-slate-950 flex items-center justify-center text-white transition-colors"
                  title="Twitter / X"
                >
                  <span className="font-bold text-xs">𝕏</span>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F5B014] hover:text-slate-950 flex items-center justify-center text-white transition-colors"
                  title="Facebook"
                >
                  <span className="font-bold text-xs">f</span>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F5B014] hover:text-slate-950 flex items-center justify-center text-white transition-colors"
                  title="Instagram"
                >
                  <span className="font-bold text-xs">ig</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© 2026 AJDATASUB. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#F5B014] cursor-pointer transition-colors" onClick={() => onNavigate('terms')}>
                Terms of Service
              </span>
              <span>•</span>
              <span className="hover:text-[#F5B014] cursor-pointer transition-colors" onClick={() => onNavigate('privacy')}>
                Privacy Policy
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
