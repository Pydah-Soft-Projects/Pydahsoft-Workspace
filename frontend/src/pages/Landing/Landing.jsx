import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon';
import Footer from '../../components/Footer/Footer';

const presenterImg = '/project_leadership_presenter.png';
const aboutImg = '/about_collaboration.jpg';
const servicesImg = '/services_analytics.jpg';
const card1Img = '/service_governance.jpg';
const card2Img = '/service_agile_sprints.jpg';

export default function Landing({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const [processedImg, setProcessedImg] = useState(null);
  const [processedAboutImg, setProcessedAboutImg] = useState(null);
  const [processedServicesImg, setProcessedServicesImg] = useState(null);
  const [processedCard1, setProcessedCard1] = useState(null);
  const [processedCard2, setProcessedCard2] = useState(null);

  // Quick Action Navigation State
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form State
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  useEffect(() => {
    document.title = 'PydahSoft | Enterprise Management System';

    function processImage(src, setter) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setter(canvas.toDataURL('image/png'));
      };
    }

    processImage(presenterImg, setProcessedImg);
    processImage(aboutImg, setProcessedAboutImg);
    processImage(servicesImg, setProcessedServicesImg);
    processImage(card1Img, setProcessedCard1);
    processImage(card2Img, setProcessedCard2);
  }, []);

  // Smooth scroll handler for Quick Actions with fixed header offset
  const handleNavClick = (e, targetId) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    setActiveNav(targetId);

    const element = document.getElementById(targetId);
    if (element) {
      const yOffset = -85; // Fixed header height offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    window.history.pushState(null, '', `#${targetId}`);
  };

  // Real-time active section tracking as user scrolls the page
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'solutions', 'contact'];
      const scrollPosition = window.scrollY + 180;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to location pathname/hash changes
  useEffect(() => {
    const pathSection = location.pathname.replace('/', '');
    const hashSection = window.location.hash.replace('#', '').replace('/', '');
    const validSections = ['home', 'about', 'services', 'solutions', 'contact'];
    const target = (pathSection && validSections.includes(pathSection))
      ? pathSection
      : (hashSection && validSections.includes(hashSection))
        ? hashSection
        : null;

    if (target) {
      setActiveNav(target);
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          const yOffset = -85;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 120);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal-on-scroll, .reveal-slide-left, .reveal-slide-right, .reveal-scale');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let W, H;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function fade() {
      ctx.fillStyle = 'rgba(242, 251, 246, 0.06)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = '#f2fbf6';
    ctx.fillRect(0, 0, W, H);

    function hash(x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    }
    function noise2(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const a = hash(xi, yi), b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    let mouseX = W / 2, mouseY = H / 2, mouseActive = false;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const PARTICLE_COUNT = 700;
    const particles = [];
    const colors = ['#0f9d63', '#3fb884', '#7ecda5', '#bfe6d3'];

    function resetParticle(p) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.life = 0;
      p.maxLife = 120 + Math.random() * 200;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.width = Math.random() < 0.15 ? 1.6 : 0.7;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = {};
      resetParticle(p);
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const SCALE = 0.0028;
    let t = 0;

    function animate() {
      fade();
      t += 0.0025;

      particles.forEach((p) => {
        const angle = noise2(p.x * SCALE, p.y * SCALE + t) * Math.PI * 4;
        let vx = Math.cos(angle) * 1.15;
        let vy = Math.sin(angle) * 1.15;

        if (mouseActive) {
          const dx = p.x - mouseX, dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (1 - dist / 160) * 1.6;
            vx += (dx / (dist + 0.01)) * force;
            vy += (dy / (dist + 0.01)) * force;
          }
        }

        const px = p.x, py = p.y;
        p.x += vx;
        p.y += vy;
        p.life++;

        const fadeIn = Math.min(p.life / 20, 1);
        const fadeOut = Math.min((p.maxLife - p.life) / 30, 1);
        const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.55;

        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (p.life > p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          resetParticle(p);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactFormSubmitted(true);
    setTimeout(() => {
      setContactFormSubmitted(false);
      setContactFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  return (
    <main className="landing-background min-h-screen pt-20 text-[#09233d] font-sans relative">
      <canvas ref={canvasRef} id="bg-canvas" className="fixed inset-0 w-full h-full pointer-events-none -z-10" />

      {/* Fixed Sticky Header Section at Top Viewport */}
      <header className="landing-header-sticky fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-4 lg:px-10 xl:px-14 bg-white/95 backdrop-blur-xl border-b border-[#dfeee6] shadow-sm transition-all duration-200">
        <Link to="/" onClick={(e) => handleNavClick(e, 'home')} className="flex items-center gap-2.5" aria-label="PydahSoft home">
          <img src="/pydahsoft_logo.png" alt="PydahSoft - Innovations that matters" className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 hover:scale-105" />
        </Link>

        {/* Header Quick Actions Buttons (Desktop Nav Bar with Smooth Hover & Active Underline Indicator) */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-sm font-semibold text-[#43566a]" aria-label="Quick Actions Navigation">
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeNav === 'home'
                ? 'text-[#20b875] font-black after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2.5px] after:bg-[#20b875] after:rounded-full'
                : 'hover:text-[#119b62] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2.5px] after:bg-[#20b875]/70 hover:after:w-full after:transition-all after:duration-300'
              }`}
          >
            Home
          </a>
          <a
            href="#about"
            onClick={(e) => handleNavClick(e, 'about')}
            className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeNav === 'about'
                ? 'text-[#20b875] font-black after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2.5px] after:bg-[#20b875] after:rounded-full'
                : 'hover:text-[#119b62] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2.5px] after:bg-[#20b875]/70 hover:after:w-full after:transition-all after:duration-300'
              }`}
          >
            About Us
          </a>
          <a
            href="#services"
            onClick={(e) => handleNavClick(e, 'services')}
            className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeNav === 'services'
                ? 'text-[#20b875] font-black after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2.5px] after:bg-[#20b875] after:rounded-full'
                : 'hover:text-[#119b62] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2.5px] after:bg-[#20b875]/70 hover:after:w-full after:transition-all after:duration-300'
              }`}
          >
            Services
          </a>
          <a
            href="#solutions"
            onClick={(e) => handleNavClick(e, 'solutions')}
            className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeNav === 'solutions'
                ? 'text-[#20b875] font-black after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2.5px] after:bg-[#20b875] after:rounded-full'
                : 'hover:text-[#119b62] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2.5px] after:bg-[#20b875]/70 hover:after:w-full after:transition-all after:duration-300'
              }`}
          >
            Solutions
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className={`relative py-1.5 transition-all duration-200 cursor-pointer ${activeNav === 'contact'
                ? 'text-[#20b875] font-black after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2.5px] after:bg-[#20b875] after:rounded-full'
                : 'hover:text-[#119b62] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2.5px] after:bg-[#20b875]/70 hover:after:w-full after:transition-all after:duration-300'
              }`}
          >
            Contact
          </a>
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-[#20b875] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#169a61] hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-1.5">Go to Dashboard <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 rounded-full bg-[#20b875] px-6 py-2.5 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(32,184,117,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#169a61] hover:shadow-[0_10px_22px_rgba(32,184,117,0.4)]"
            >
              <span>Sign In</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </Link>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Navigation Drawer (Fixed Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed top-[73px] left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 px-6 py-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#20b875] mb-2">Quick Actions</p>
          <div className="flex flex-col gap-2">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, 'home')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${activeNav === 'home' ? 'bg-[#20b875] text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
            >
              <span>Home</span>
              <span className="text-[10px] opacity-75">#home</span>
            </a>
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${activeNav === 'about' ? 'bg-[#20b875] text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
            >
              <span>About Us</span>
              <span className="text-[10px] opacity-75">#about</span>
            </a>
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, 'services')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${activeNav === 'services' ? 'bg-[#20b875] text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
            >
              <span>Services</span>
              <span className="text-[10px] opacity-75">#services</span>
            </a>
            <a
              href="#solutions"
              onClick={(e) => handleNavClick(e, 'solutions')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${activeNav === 'solutions' ? 'bg-[#20b875] text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
            >
              <span>Solutions</span>
              <span className="text-[10px] opacity-75">#solutions</span>
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, 'contact')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${activeNav === 'contact' ? 'bg-[#20b875] text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
            >
              <span>Contact</span>
              <span className="text-[10px] opacity-75">#contact</span>
            </a>

            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 w-full text-center py-3 bg-[#20b875] text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Sign In to Workspace
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Section #home (Hero) */}
      <section id="home" className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-4 sm:pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="animate-[fade-up_700ms_ease-out_both]">
          <p className="mb-2 sm:mb-6 flex items-center gap-2.5 sm:gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#119b62]">
            <span className="h-px w-6 sm:w-8 bg-[#27b878]" /> Project operations, connected
          </p>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.065em] text-[#09233d] sm:text-6xl lg:text-[5.5rem]">
            Make every project <span className="text-[#169a61]">count.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#61798a]">
            Manage projects, teams, daily tasks, time, and performance in one connected workspace built for complete accountability.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="hidden sm:inline-flex rounded-full bg-[#20b875] px-7 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(32,184,117,0.2)] transition-all hover:-translate-y-1 hover:bg-[#159e63]"
            >
              <span className="inline-flex items-center gap-1.5">Explore the system <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
            </button>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="px-3 py-3 text-sm font-bold text-[#09233d] transition-colors hover:text-[#159e63]">
              <span className="inline-flex items-center gap-1.5">How it works <Icon name="arrowDown" className="w-3.5 h-3.5" /></span>
            </a>
          </div>

          {/* Compact Stats & Metrics Bar */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#dfeee6] pt-6">
            <div className="border-r border-[#dfeee6] pr-2">
              <span className="block text-lg font-black text-[#09233d]">12</span>
              <span className="text-[11px] font-semibold text-[#708794] leading-tight">Connected modules</span>
            </div>
            <div className="border-r border-[#dfeee6] px-2">
              <span className="block text-lg font-black text-[#09233d]">360°</span>
              <span className="text-[11px] font-semibold text-[#708794] leading-tight">Project visibility</span>
            </div>
            <div className="border-r border-[#dfeee6] px-2">
              <span className="block text-lg font-black text-[#09233d]">1</span>
              <span className="text-[11px] font-semibold text-[#708794] leading-tight">Source of truth</span>
            </div>
            <div className="pl-2">
              <span className="block text-lg font-black text-[#09233d]">Live</span>
              <span className="text-[11px] font-semibold text-[#708794] leading-tight">Performance signals</span>
            </div>
          </div>
        </div>

        {/* Seamless Executive Graphic */}
        <div className="relative min-h-0 sm:min-h-[560px] animate-[fade-up_900ms_150ms_ease-out_both] flex items-center justify-center my-2 sm:my-0">
          <div className="relative w-full bg-transparent p-0">
            <div className="relative overflow-visible flex justify-center">
              <img
                src={processedImg || presenterImg}
                alt="Executive Presenter & Architecture Flowchart"
                className="w-full h-auto max-h-[340px] sm:max-h-[520px] max-w-[340px] sm:max-w-none object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section #about */}
      <section id="about" className="reveal-on-scroll border-y border-[#dfeee6] bg-[#edf9f2]/40 backdrop-blur-xs">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-24">
          <div className="reveal-slide-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#169a61]">About the platform</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-tight tracking-[-0.05em] text-[#09233d]">
              One unbroken chain of accountability.
            </h2>
            <p className="mt-4 text-sm font-semibold text-[#119b62]">
              Superior → Project → Team → Team Lead → Members → Daily Tasks → Time Tracking → Performance
            </p>
            <div className="mt-6 space-y-3 text-base leading-7 text-[#61798a]">
              <p>
                <strong>EPTPMS</strong> manages enterprise projects across their complete lifecycle — from initial creation down to daily task execution, real-time time tracking, and performance analytics.
              </p>
              <p>
                Every hour logged and task completed directly feeds into team efficiency metrics and employee performance scores.
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-center reveal-slide-right">
            <img
              src={processedAboutImg || aboutImg}
              alt="Team Project Collaboration & Workflow Illustration"
              className="float-animation w-full h-auto max-h-[440px] object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)] transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 lg:pb-24 reveal-on-scroll">
          <div className="group rounded-2xl border border-[#b9dfc8] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:bg-[#eaf8f0] hover:border-[#20b875] hover:shadow-[0_16px_36px_rgba(32,184,117,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b875]/10 transition-colors duration-300 group-hover:bg-[#20b875]">
              <svg className="w-5 h-5 text-[#169a61] transition-colors duration-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-[#09233d]">Superior / Manager Scope</h3>
            <p className="mt-2 text-xs leading-6 text-[#61798a]">
              Full organizational visibility. Define projects, assign teams and Team Leads, monitor live project health, track company-wide time utilization, and generate executive performance reports.
            </p>
          </div>

          <div className="group rounded-2xl border border-[#b9dfc8] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:bg-[#eaf8f0] hover:border-[#20b875] hover:shadow-[0_16px_36px_rgba(32,184,117,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b875]/10 transition-colors duration-300 group-hover:bg-[#20b875]">
              <svg className="w-5 h-5 text-[#169a61] transition-colors duration-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-[#09233d]">Team Lead Delegation</h3>
            <p className="mt-2 text-xs leading-6 text-[#61798a]">
              Break high-level projects into structured modules, prepare daily work plans, assign tasks to members, manage sprint timelines, and approve or reject completed task submissions.
            </p>
          </div>

          <div className="group rounded-2xl border border-[#b9dfc8] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:bg-[#eaf8f0] hover:border-[#20b875] hover:shadow-[0_16px_36px_rgba(32,184,117,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b875]/10 transition-colors duration-300 group-hover:bg-[#20b875]">
              <svg className="w-5 h-5 text-[#169a61] transition-colors duration-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-[#09233d]">Employee Daily Execution</h3>
            <p className="mt-2 text-xs leading-6 text-[#61798a]">
              Clear, focused daily view of assigned work. Track active hours with an integrated stopwatch, log completion remarks and work evidence, and submit tasks for review smoothly.
            </p>
          </div>

          <div className="group rounded-2xl border border-[#b9dfc8] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:bg-[#eaf8f0] hover:border-[#20b875] hover:shadow-[0_16px_36px_rgba(32,184,117,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20b875]/10 transition-colors duration-300 group-hover:bg-[#20b875]">
              <svg className="w-5 h-5 text-[#169a61] transition-colors duration-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-[#09233d]">Immutable Audit Trail</h3>
            <p className="mt-2 text-xs leading-6 text-[#61798a]">
              Every system action, status change, deadline revision, and time log is recorded in full audit logs, ensuring complete transparency and zero data ambiguity.
            </p>
          </div>
        </div>
      </section>

      {/* Section #services */}
      <section id="services" className="reveal-on-scroll border-y border-[#dfeee6] bg-gradient-to-b from-[#f4faf6] to-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">

          {/* Top Banner with Text & Services Illustration Image */}
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] mb-16">
            <div className="reveal-slide-left">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#169a61]">Enterprise IT Services &amp; Digital Solutions</p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-0.04em] text-[#09233d]">
                Services We Provide
              </h2>
              <div className="mt-6 space-y-4 text-base leading-8 text-[#61798a]">
                <p>
                  <strong>PydahSoft</strong> delivers high-impact IT services and specialized software management platforms engineered to accelerate business operations and elevate team productivity across corporate projects.
                </p>
                <p>
                  Empowering modern enterprises with custom web applications, mobile experiences, scalable cloud infrastructure, CRM systems, data intelligence, and operational ERP.
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-center reveal-slide-right">
              <img
                src={processedServicesImg || servicesImg}
                alt="Services Capabilities & Performance Analytics Illustration"
                className="float-animation w-full h-auto max-h-[380px] object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)] transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* 6 Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Web Solutions */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Web Solutions</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Beautiful, responsive websites that captivate your audience and drive engagement. We create digital experiences that leave lasting impressions.
                </p>
              </div>
            </div>

            {/* Card 2: Mobile Experiences */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="7" y="3" width="10" height="18" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Mobile Experiences</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Seamless mobile applications that users love. We build intuitive interfaces with fluid navigation and delightful interactions.
                </p>
              </div>
            </div>

            {/* Card 3: Cloud Architecture */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="6" rx="2" />
                    <rect x="4" y="14" width="16" height="6" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M8 17h.01" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Cloud Architecture</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Future-proof cloud infrastructure designed for scalability and performance. We optimize your digital foundation for growth.
                </p>
              </div>
            </div>

            {/* Card 4: Data Intelligence */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V12M13 19V8M17 19V14" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Data Intelligence</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Transform raw data into actionable insights. Our analytics solutions help you make informed business decisions with confidence.
                </p>
              </div>
            </div>

            {/* Card 5: Customer Relationship Management (CRM) */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Customer Relationship Management</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Powerful CRM platforms engineered to streamline client communication, manage sales pipelines, track customer interactions, and boost retention with intelligent automation.
                </p>
              </div>
            </div>

            {/* Card 6: Enterprise ERP Solutions */}
            <div className="bg-white rounded-3xl p-8 border border-[#e0f0e6] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eaf6f0] text-[#118855] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7m4 0v10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[#09233d] tracking-tight mb-3">Enterprise ERP Solutions</h3>
                <p className="text-sm text-[#61798a] leading-relaxed font-normal">
                  Comprehensive ERP frameworks that automate core business workflows, unite organizational data, and optimize workforce operational efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section #solutions */}
      <section id="solutions" className="reveal-on-scroll border-y border-[#dfeee6] bg-[#f4faf6]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#169a61]">Tailored Enterprise Solutions</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#09233d]">
              Specialized Management Systems &amp; Software Platforms
            </h2>
            <p className="mt-4 text-sm font-semibold text-[#61798a]">
              PydahSoft provides end-to-end, industry-tailored management software engineered to digitize operations, automate routine administration, and enhance decision-making across institutions and hospitality enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 01: Hotel Resource Management System */}
            <div className="bg-white rounded-3xl p-8 border border-[#d2eadc] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf6f0] text-[#169a61] flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                    01
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-[#169a61] rounded-full border border-emerald-200">
                    Hospitality ERP
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#09233d] mb-3">Human Resource Management System</h3>
                <p className="text-xs text-[#61798a] leading-relaxed mb-6">
                  An all-in-one hospitality management platform that unifies front desk reservations, room inventory control, housekeeping schedules, guest billing, and staff resource allocation. Drive higher guest satisfaction while maximizing occupancy rates and revenue performance.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Real-time Room Inventory &amp; Front-Desk Reservation Engine
                </li>
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Automated Housekeeping Dispatch &amp; Staff Shift Rostering
                </li>
              </ul>
            </div>

            {/* 02: Hostel Management System */}
            <div className="bg-white rounded-3xl p-8 border border-[#d2eadc] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf6f0] text-[#169a61] flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                    02
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-[#169a61] rounded-full border border-emerald-200">
                    Residential Operations
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#09233d] mb-3">Hostel Management System</h3>
                <p className="text-xs text-[#61798a] leading-relaxed mb-6">
                  Comprehensive student and resident accommodation management solution designed for educational campuses and corporate housing. Streamline room allotment, digital gate passes, mess meal planning, visitor records, and maintenance requests in real-time.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Smart Room Allocation, Occupancy &amp; Bed Tracking
                </li>
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Digital Out-Pass Generation &amp; Mess Consumption Logs
                </li>
              </ul>
            </div>

            {/* 03: Student Database Management System */}
            <div className="bg-white rounded-3xl p-8 border border-[#d2eadc] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf6f0] text-[#169a61] flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                    03
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-[#169a61] rounded-full border border-emerald-200">
                    EduTech Data Hub
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#09233d] mb-3">Student Database Management System</h3>
                <p className="text-xs text-[#61798a] leading-relaxed mb-6">
                  Centralized institutional repository engineered to manage complete student lifecycle records. Maintain demographic data, academic transcripts, attendance logs, performance metrics, and guardian contact profiles with role-based security access.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Unified Academic Profiles &amp; Cumulative Grade Tracking
                </li>
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Secure Multi-Role Access for Administrators, Faculty &amp; Parents
                </li>
              </ul>
            </div>

            {/* 04: Fee Management System */}
            <div className="bg-white rounded-3xl p-8 border border-[#d2eadc] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#eaf6f0] text-[#169a61] flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
                    04
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-[#169a61] rounded-full border border-emerald-200">
                    FinTech &amp; Billing
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#09233d] mb-3">Fee Management System</h3>
                <p className="text-xs text-[#61798a] leading-relaxed mb-6">
                  Automated financial management software designed for schools, colleges, and training academies. Automate tuition fee structuring, multi-mode digital payments, instant tax-compliant receipts, automated overdue SMS/email reminders, and real-time revenue audits.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs font-semibold text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Online Payment Gateway Integration &amp; Instant E-Receipts
                </li>
                <li className="flex items-center gap-2.5 text-emerald-800">
                  <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  Automated Late-Fee Rules &amp; Real-Time Ledger Analytics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section #contact */}
      <section id="contact" className="reveal-on-scroll border-y border-[#dfeee6] bg-[#edf9f2]/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#b9dfc8] shadow-lg">
              <span className="text-xs font-black uppercase tracking-widest text-[#20b875] block mb-2">Get in Touch</span>
              <h2 className="text-3xl font-black text-[#09233d] tracking-tight">Contact Sales &amp; Support</h2>
              <p className="text-xs text-gray-500 font-medium mt-1 mb-8">
                Have questions or need a custom corporate package? Send us a message and our team will get back to you promptly.
              </p>

              {contactFormSubmitted ? (
                <div className="bg-emerald-50 border-2 border-[#20b875] rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-[#20b875] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-lg font-black text-[#09233d]">Thank You!</h4>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    Your message has been received successfully. Our sales team will reply within 2 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#09233d] mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactFormData.name}
                      onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#09233d] mb-1">Business Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#09233d] mb-1">Subject</label>
                    <select
                      value={contactFormData.subject}
                      onChange={(e) => setContactFormData({ ...contactFormData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Enterprise Custom Solution">Enterprise Custom Solution</option>
                      <option value="Technical Support">Technical Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#09233d] mb-1">Message</label>
                    <textarea
                      required
                      rows="4"
                      value={contactFormData.message}
                      onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                      placeholder="Describe your requirements or questions..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-[#20b875] hover:bg-[#169a61] text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Send Message Now</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </form>
              )}
            </div>

            {/* Direct Contact Information */}
            <div className="space-y-8">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#20b875] block mb-2">Corporate Headquarters</span>
                <h2 className="text-3xl font-black text-[#09233d] tracking-tight">PydahSoft Private Limited</h2>
                <p className="text-xs text-gray-600 font-medium mt-2 leading-relaxed">
                  Building future-ready digital solutions that drive innovation and business transformation.
                </p>
              </div>

              <div className="space-y-5 bg-white p-7 rounded-3xl border border-[#b9dfc8] shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#20b875] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#09233d] uppercase tracking-wider">Office Address</h4>
                    <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
                      Kakinada - Yanam Road, Patavala, Tallarevu (M), Kakinada District, Andhra Pradesh, India Pincode 533461
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#20b875] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#09233d] uppercase tracking-wider">Phone Support</h4>
                    <a href="tel:+919951354444" className="text-xs font-bold text-[#20b875] hover:underline mt-0.5 block">
                      +91 9951354444
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#20b875] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#09233d] uppercase tracking-wider">Email Inquiry</h4>
                    <a href="mailto:team@pydahsoft.in" className="text-xs font-bold text-[#20b875] hover:underline mt-0.5 block">
                      team@pydahsoft.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
