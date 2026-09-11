import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import Icon from '../../components/Icon';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'PydahSoft | Login';
    // Preload dashboard overview module in background for zero-delay login transition
    try {
      import('../Dashboard/DashboardOverview');
    } catch (e) {}
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data.token) {
          sessionStorage.setItem('pydahsoft_token', data.data.token);
          sessionStorage.setItem('pydahsoft_user', JSON.stringify(data.data));
        }
        const redirectTarget = localStorage.getItem('pydahsoft_redirect_after_login');
        if (redirectTarget) {
          localStorage.removeItem('pydahsoft_redirect_after_login');
          localStorage.setItem('pydahsoft_active_tab', 'meetings');
          if (onLoginSuccess) onLoginSuccess(data.data);
          navigate(redirectTarget, { replace: true });
        } else {
          localStorage.setItem('pydahsoft_active_tab', 'overview');
          if (onLoginSuccess) onLoginSuccess(data.data);
          navigate('/dashboard', { replace: true });
        }
      } else {
        const errorMsg = data.error?.message || data.message || 'Invalid username or password';
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to backend server. Please verify backend service is running.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 sm:static sm:min-h-screen bg-[#f7fcf9] text-[#09233d] flex flex-col justify-between overflow-hidden font-sans touch-none select-none">
      <div className="login-background" aria-hidden="true">
        <div className="login-background__grid" />
        <div className="login-background__ring login-background__ring--one" />
        <div className="login-background__ring login-background__ring--two" />
        <div className="login-background__cube login-background__cube--one">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="login-background__cube login-background__cube--two">
          <span /><span /><span /><span /><span /><span />
        </div>
        <span className="login-background__spark login-background__spark--one" />
        <span className="login-background__spark login-background__spark--two" />
        <span className="login-background__spark login-background__spark--three" />
      </div>
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#dff7e9] opacity-70 blur-2xl" />
      <div className="pointer-events-none absolute -left-28 bottom-10 h-96 w-96 rounded-full bg-[#e5f2ee] opacity-80 blur-2xl" />

      <header className="login-header relative z-10 flex w-full items-center justify-between px-4 py-2 sm:py-6 sm:px-6 lg:px-12 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-left focus:outline-none group">
          <span className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-[#27b878] text-base sm:text-xl font-black text-white shadow-[0_8px_20px_rgba(39,184,120,0.25)] transition-transform group-hover:scale-105">
            &lt;&gt;
          </span>
          <span className="leading-none">
            <strong className="block text-base sm:text-lg font-extrabold tracking-[-0.04em]">PydahSoft</strong>
            <small className="mt-0.5 block text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] text-[#577080]">
              innovations that matters
            </small>
          </span>
        </Link>
      </header>

      <main className="login-stage relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-3 py-0 sm:py-8 sm:px-6 lg:px-12 flex-1 min-h-0 overflow-hidden">
        {/* Mobile Vector Illustration Banner (shown on mobile view) */}
        <div className="sm:hidden w-full flex justify-center items-center pt-1 pb-1 px-2 relative z-10 shrink-0">
          <div className="relative w-full max-w-[280px] h-28 flex items-end justify-center">
            {/* Light Bulb floating top left */}
            <div className="absolute top-0 left-12 bg-[#e6f7ef] p-1.5 rounded-full text-[#20b875] shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            {/* Gear floating top right */}
            <div className="absolute top-0 right-12 bg-[#e6f7ef] p-1.5 rounded-full text-[#20b875] shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Plant Pot on Left */}
            <div className="absolute bottom-1 left-2 flex flex-col items-center">
              <svg className="w-11 h-13" viewBox="0 0 48 56" fill="none">
                <path d="M24 28C24 28 14 20 12 12C10 4 22 2 24 14C26 2 38 4 36 12C34 20 24 28 24 28Z" fill="#34d399" />
                <path d="M24 28C24 28 8 26 4 18C0 10 12 8 18 18C24 28 24 28 24 28Z" fill="#10b981" />
                <path d="M24 28C24 28 40 26 44 18C48 10 36 8 30 18C24 28 24 28 24 28Z" fill="#059669" />
                <path d="M16 28H32L30 46H18L16 28Z" fill="#ffffff" stroke="#d1d5db" strokeWidth="2" />
              </svg>
            </div>

            {/* Laptop with </> in Center */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-18 bg-[#09233d] rounded-t-xl border-3 border-slate-700 flex items-center justify-center p-1 shadow-md">
                <div className="w-full h-full bg-slate-900 rounded flex items-center justify-center border border-slate-800">
                  <span className="text-[#20b875] font-mono font-black text-base tracking-widest">&lt;/&gt;</span>
                </div>
              </div>
              <div className="w-38 h-2 bg-slate-300 rounded-b-md border-t border-slate-400 shadow-xs flex justify-center">
                <div className="w-6 h-0.5 bg-slate-400 rounded-full mt-0.5" />
              </div>
            </div>

            {/* Coffee Cup with Steam on Right */}
            <div className="absolute bottom-1 right-2 flex flex-col items-center">
              <div className="flex gap-1 mb-0.5 opacity-60">
                <div className="w-0.5 h-1.5 bg-[#20b875] rounded-full animate-pulse" />
                <div className="w-0.5 h-2.5 bg-[#20b875] rounded-full animate-pulse delay-100" />
              </div>
              <div className="relative w-5.5 h-6.5 bg-[#20b875] rounded-b-md rounded-t-xs">
                <div className="absolute -right-1.5 top-1 w-1.5 h-3 border-2 border-[#20b875] rounded-r-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="login-scene w-full flex justify-center">
          <div className="login-prop login-prop--user" aria-hidden="true">
            <span className="login-prop__user-head" />
            <span className="login-prop__user-body" />
          </div>
          <div className="login-prop login-prop--form" aria-hidden="true">
            <span className="login-prop__form-bar" />
            <span className="login-prop__form-line" />
            <span className="login-prop__form-line login-prop__form-line--short" />
            <span className="login-prop__form-button" />
          </div>
          <div className="login-prop login-prop--lock" aria-hidden="true">
            <span className="login-prop__lock-shackle" />
            <span className="login-prop__lock-body"><i /></span>
          </div>

          <div className="login-card relative rounded-2xl sm:rounded-3xl border border-white/80 bg-white/95 sm:bg-white/90 p-4 sm:p-8 shadow-[0_20px_60px_rgba(15,48,34,0.08)] backdrop-blur-md w-full max-w-[320px] sm:max-w-md">
            <Link
              to="/"
              className="absolute top-3.5 left-3.5 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#d1e8dc] bg-white text-[#09233d] shadow-xs transition-all hover:bg-[#edf9f2] hover:scale-105"
              aria-label="Back to landing page"
            >
              <Icon name="arrowLeft" className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>

            <div className="text-center pt-0.5 sm:pt-2">
              <div className="mx-auto mb-1.5 sm:mb-3 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#e6f7ef] text-[#169a61]">
                {/* Desktop Lock Icon */}
                <svg className="hidden sm:block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {/* Mobile User Profile Symbol */}
                <svg className="sm:hidden h-4.5 w-4.5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#09233d]">
                <span className="hidden sm:inline">System </span>Login
              </h1>
            </div>

            {error && (
              <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-2.5 sm:mt-5 space-y-2.5 sm:space-y-4">
              <div>
                <label className="block text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#43566a] mb-1">
                  USERNAME
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-xl border-0 sm:border border-[#d2e6dc] bg-[#eef4f8] sm:bg-[#fbfdfc] px-3 py-2 text-xs sm:text-sm text-[#09233d] placeholder-[#9cb0bd] focus:border-[#20b875] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20b875]/20"
                />
              </div>

              <div>
                <label className="block text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#43566a] mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-0 sm:border border-[#d2e6dc] bg-[#eef4f8] sm:bg-[#fbfdfc] px-3 py-2 text-xs sm:text-sm text-[#09233d] placeholder-[#9cb0bd] focus:border-[#20b875] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20b875]/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#20b875] py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-[0_10px_20px_rgba(32,184,117,0.25)] transition-all hover:bg-[#159e63] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : <span className="inline-flex items-center justify-center gap-1.5 w-full">Sign In to Workspace <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>}
              </button>
            </form>

            <div className="hidden sm:block mt-6 border-t border-[#eaf3ee] pt-4 text-center">
              <p className="text-[11px] text-[#78909e]">
                Supported Roles: <span className="font-semibold text-[#09233d]">SuperAdmin</span>, <span className="font-semibold text-[#09233d]">Superior</span>, <span className="font-semibold text-[#09233d]">Team Lead</span>, <span className="font-semibold text-[#09233d]">Employee</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-1.5 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-[#79919f] shrink-0">
        PydahSoft &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
