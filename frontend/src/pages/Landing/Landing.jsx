import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const presenterImg = '/project_leadership_presenter.png';
const aboutImg = '/about_collaboration.jpg';
const servicesImg = '/services_analytics.jpg';
const card1Img = '/service_governance.jpg';
const card2Img = '/service_agile_sprints.jpg';

export default function Landing({ user }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [processedImg, setProcessedImg] = useState(null);
  const [processedAboutImg, setProcessedAboutImg] = useState(null);
  const [processedServicesImg, setProcessedServicesImg] = useState(null);
  const [processedCard1, setProcessedCard1] = useState(null);
  const [processedCard2, setProcessedCard2] = useState(null);

  useEffect(() => {
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

          // Make solid white background pixels 100% transparent
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
          // Remove class when scrolled out of view so animation repeats when scrolling back
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

  return (
    <main className="landing-background min-h-screen overflow-hidden text-[#09233d] font-sans relative">
      <canvas ref={canvasRef} id="bg-canvas" className="fixed inset-0 w-full h-full pointer-events-none -z-10" />
      <div className="relative isolate z-10">
        <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-80 w-80 rounded-full bg-[#dff7e9] opacity-80" />
        <div className="pointer-events-none absolute -left-32 top-[28rem] -z-10 h-80 w-80 rounded-full bg-[#e5f2ee]" />

        <header className="flex w-full items-center justify-between px-6 py-7 lg:px-10 xl:px-14">
          <Link to="/" className="flex items-center gap-2.5" aria-label="PydahSoft home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#27b878] text-xl font-black text-white shadow-[0_8px_20px_rgba(39,184,120,0.2)]">&lt;&gt;</span>
            <span className="leading-none">
              <strong className="block text-lg font-extrabold tracking-[-0.04em]">PydahSoft</strong>
              <small className="mt-1 block text-[8px] font-bold uppercase tracking-[0.18em] text-[#577080]">innovations that matters</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#43566a] lg:flex">
            <Link className="transition-colors hover:text-[#119b62]" to="/">Home</Link>
            <a className="transition-colors hover:text-[#119b62]" href="#about">About</a>
            <a className="transition-colors hover:text-[#119b62]" href="#services">Services</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-[#20b875] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full bg-[#20b875] px-6 py-2.5 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(32,184,117,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#169a61] hover:shadow-[0_10px_22px_rgba(32,184,117,0.4)]"
              >
                <span>Sign In</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </Link>
            )}
          </div>
        </header>

        <section id="top" className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-28 lg:pt-20">
          <div className="animate-[fade-up_700ms_ease-out_both]">
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#119b62]">
              <span className="h-px w-8 bg-[#27b878]" /> Project operations, connected
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
                className="rounded-full bg-[#20b875] px-7 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(32,184,117,0.2)] transition-all hover:-translate-y-1 hover:bg-[#159e63]"
              >
                Explore the system <span aria-hidden="true">→</span>
              </button>
              <a href="#about" className="px-3 py-3 text-sm font-bold text-[#09233d] transition-colors hover:text-[#159e63]">
                How it works <span aria-hidden="true">↘</span>
              </a>
            </div>
          </div>

          {/* Seamless Transparent Executive Presenter & Holographic Flowchart */}
          <div className="relative min-h-[500px] animate-[fade-up_900ms_150ms_ease-out_both] sm:min-h-[560px] flex items-center justify-center">
            {/* Completely Transparent Container (No card background, No borders) */}
            <div className="relative w-full bg-transparent p-0">
              {/* Seamless Transparent Presenter & Flowchart Image */}
              <div className="relative overflow-visible flex justify-center">
                <img
                  src={processedImg || presenterImg}
                  alt="Executive Presenter & Holographic Architecture Flowchart"
                  className="w-full h-auto max-h-[520px] object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-[#dfeee6] px-6 py-8 sm:grid-cols-4 lg:px-10">
          <div className="border-r border-[#dfeee6] pr-4">
            <p className="text-2xl font-black text-[#09233d]">12</p>
            <p className="mt-1 text-xs font-semibold text-[#708794]">Connected modules</p>
          </div>
          <div className="border-r border-[#dfeee6] px-4 sm:px-6">
            <p className="text-2xl font-black text-[#09233d]">360°</p>
            <p className="mt-1 text-xs font-semibold text-[#708794]">Project visibility</p>
          </div>
          <div className="border-r border-[#dfeee6] px-4 sm:px-6">
            <p className="text-2xl font-black text-[#09233d]">1</p>
            <p className="mt-1 text-xs font-semibold text-[#708794]">Source of truth</p>
          </div>
          <div className="pl-4 sm:pl-6">
            <p className="text-2xl font-black text-[#09233d]">Live</p>
            <p className="mt-1 text-xs font-semibold text-[#708794]">Performance signals</p>
          </div>
        </div>
      </div>

      {/* Expanded About Section with Seamless Transparent Illustration */}
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

          {/* Seamless Transparent About Section Illustration */}
          <div className="relative flex items-center justify-center reveal-slide-right">
            <img
              src={processedAboutImg || aboutImg}
              alt="Team Project Collaboration & Workflow Illustration"
              className="float-animation w-full h-auto max-h-[440px] object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)] transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* 4 Feature Columns for About with Vector SVG Icons & Interactive Hover */}
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

      {/* Services Section */}
      <section id="services" className="reveal-on-scroll border-y border-[#dfeee6] bg-white/60 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="reveal-slide-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#169a61]">Enterprise IT Services &amp; Platform Capabilities</p>
              <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.04em] text-[#09233d]">
                End-to-end IT services &amp; workforce execution solutions.
              </h2>
              <div className="mt-6 space-y-4 text-base leading-8 text-[#61798a]">
                <p>
                  <strong>PydahSoft</strong> delivers high-impact IT services and specialized software management platforms engineered to accelerate business operations and elevate team productivity across corporate projects.
                </p>
                <p>
                  Our services unite strategic project planning, agile sprint distribution, real-time employee time tracking, multi-tier quality reviews, and executive KPI intelligence into a single connected workflow.
                </p>
              </div>
            </div>

            {/* Seamless Transparent Services Section Illustration */}
            <div className="relative flex items-center justify-center reveal-slide-right">
              <img
                src={processedServicesImg || servicesImg}
                alt="Services Capabilities & Performance Analytics Illustration"
                className="float-animation w-full h-auto max-h-[400px] object-contain drop-shadow-[0_20px_40px_rgba(20,154,97,0.2)] transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="landing-wave-footer" aria-hidden="true">
        <span className="landing-wave landing-wave-light" />
        <span className="landing-wave landing-wave-dark" />
      </div>
    </main>
  );
}
