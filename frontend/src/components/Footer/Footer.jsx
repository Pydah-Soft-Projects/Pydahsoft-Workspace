import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#08182b] text-white relative font-sans">
      {/* Top Accent Green Gradient Bar */}
      <div className="h-2.5 w-full bg-gradient-to-r from-[#20b875] via-[#4ade80] to-[#10b981]" />

      {/* Main Content Area - Full Width */}
      <div className="w-full px-8 py-12 lg:px-16 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          
          {/* Column 1: Company Branding & Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black tracking-wider text-white">
                PYDAH<span className="text-[#20b875]">SOFT</span>
              </h2>
              <p className="text-[11px] font-extrabold tracking-[0.25em] uppercase text-[#4ade80] mt-0.5">
                PRIVATE LIMITED
              </p>
            </div>
            
            <p className="text-xs text-gray-300 font-medium leading-relaxed max-w-sm">
              Building future-ready digital solutions that drive innovation and business transformation.
            </p>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#20b875] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#20b875] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#20b875] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links & Services Side-by-Side on Mobile */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-sm font-black text-white tracking-wide mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2.5 text-xs font-medium text-gray-300">
                <li>
                  <a href="#home" className="hover:text-[#20b875] transition-colors inline-block">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-[#20b875] transition-colors inline-block">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-[#20b875] transition-colors inline-block">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-[#20b875] transition-colors inline-block">
                    Solutions
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-[#20b875] transition-colors inline-block">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-[#20b875] transition-colors inline-block">
                    Buy Our Products
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h3 className="text-sm font-black text-white tracking-wide mb-4">
                Services
              </h3>
              <ul className="space-y-2.5 text-xs font-medium text-gray-300">
                <li>
                  <a href="#web" className="hover:text-[#20b875] transition-colors inline-block">
                    Web Development
                  </a>
                </li>
                <li>
                  <a href="#mobile" className="hover:text-[#20b875] transition-colors inline-block">
                    Mobile Apps
                  </a>
                </li>
                <li>
                  <a href="#cloud" className="hover:text-[#20b875] transition-colors inline-block">
                    Cloud Solutions
                </a>
                </li>
                <li>
                  <a href="#ai" className="hover:text-[#20b875] transition-colors inline-block">
                    AI & ML Solutions
                  </a>
                </li>
                <li>
                  <a href="#consulting" className="hover:text-[#20b875] transition-colors inline-block">
                    Tech Consulting
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h3 className="text-sm font-black text-white tracking-wide mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3.5 text-xs font-medium text-gray-300">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#20b875] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="leading-relaxed">
                  Kakinada - Yanam Road, Patavala, Tallarevu (M), Kakinada District, Andhra Pradesh, India Pincode 533461
                </span>
              </li>

              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+919951354444" className="hover:text-[#20b875] transition-colors">
                  +91 9951354444
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:team@pydahsoft.in" className="hover:text-[#20b875] transition-colors">
                  team@pydahsoft.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Horizontal Divider */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 PYDAH SOFT. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
