import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import Icon from '../../components/Icon';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
        setSuccessMsg(`Welcome back, ${data.data.name} (${data.data.role.toUpperCase()})!`);
        if (data.data.token) {
          localStorage.setItem('pydahsoft_token', data.data.token);
          localStorage.setItem('pydahsoft_user', JSON.stringify(data.data));
        }
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.data);
          }
          navigate('/dashboard');
        }, 800);
      } else {
        const errorMsg = data.error?.message || data.message || 'Invalid username or password';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Unable to connect to backend server. Please verify backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fcf9] text-[#09233d] flex flex-col justify-between relative overflow-hidden font-sans">
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

      <header className="relative z-10 flex w-full items-center justify-between px-6 py-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5 text-left focus:outline-none group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#27b878] text-xl font-black text-white shadow-[0_8px_20px_rgba(39,184,120,0.25)] transition-transform group-hover:scale-105">
            &lt;&gt;
          </span>
          <span className="leading-none">
            <strong className="block text-lg font-extrabold tracking-[-0.04em]">PydahSoft</strong>
            <small className="mt-1 block text-[8px] font-bold uppercase tracking-[0.18em] text-[#577080]">
              innovations that matters
            </small>
          </span>
        </Link>

        <Link
          to="/"
          className="rounded-full border border-[#d1e8dc] bg-white px-4 py-2 text-xs font-bold text-[#09233d] transition-all hover:bg-[#edf9f2]"
        >
          <span className="inline-flex items-center gap-1.5"><Icon name="arrowLeft" className="w-3.5 h-3.5" /> Back to Landing Page</span>
        </Link>
      </header>

      <main className="login-stage relative z-10 mx-auto my-auto flex w-full max-w-5xl items-center justify-center px-6 py-8 lg:px-12">
        <div className="login-scene">
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

          <div className="login-card rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,48,34,0.08)] backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ef] text-[#169a61]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#09233d]">System Login</h1>
            <p className="mt-1 text-xs font-medium text-[#5e7787]">
              Enter your credentials to access your PydahSoft workspace.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43566a] mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-[#d2e6dc] bg-[#fbfdfc] px-4 py-3 text-sm text-[#09233d] placeholder-[#9cb0bd] focus:border-[#20b875] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20b875]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#43566a] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#d2e6dc] bg-[#fbfdfc] px-4 py-3 text-sm text-[#09233d] placeholder-[#9cb0bd] focus:border-[#20b875] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20b875]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#20b875] py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(32,184,117,0.25)] transition-all hover:bg-[#159e63] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : <span className="inline-flex items-center gap-1.5">Sign In to Workspace <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>}
            </button>
          </form>

            <div className="mt-6 border-t border-[#eaf3ee] pt-4 text-center">
            <p className="text-[11px] text-[#78909e]">
              Supported Roles: <span className="font-semibold text-[#09233d]">SuperAdmin</span>, <span className="font-semibold text-[#09233d]">Superior</span>, <span className="font-semibold text-[#09233d]">Team Lead</span>, <span className="font-semibold text-[#09233d]">Employee</span>
            </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs font-medium text-[#79919f]">
        PydahSoft &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
