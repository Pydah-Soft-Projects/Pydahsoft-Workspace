import React from 'react';

export default function LoadingSpinner({
  message = 'Loading workspace view...',
  fullScreen = false,
  size = 'md'
}) {
  const sizeClasses = {
    sm: { container: 'w-10 h-10', ring: 'border-2', icon: 'w-4 h-4' },
    md: { container: 'w-14 h-14', ring: 'border-3', icon: 'w-6 h-6' },
    lg: { container: 'w-20 h-20', ring: 'border-4', icon: 'w-8 h-8' }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4 select-none p-6">
      {/* Animated Glowing Spinner Ring Container */}
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Outer glowing ambient halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#10b981] via-[#20b875] to-[#06b6d4] blur-md opacity-40 animate-pulse" />

        {/* Outer spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#20b875] border-b-transparent border-l-transparent animate-spin duration-700" />

        {/* Inner reverse-spinning cyan accent ring */}
        <div className="absolute inset-1.5 rounded-full border-b-2 border-l-2 border-cyan-400 border-t-transparent border-r-transparent animate-spin duration-1000" />

        {/* Center branded logo mark with subtle breathing pulse */}
        <div className="w-7 h-7 rounded-xl bg-[#09233d] border border-emerald-400/40 shadow-lg flex items-center justify-center text-[#20b875] z-10">
          <svg className={currentSize.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>

      {/* Animated Text Label with Typing Dots effect */}
      {message && (
        <div className="flex items-center gap-1 text-xs font-bold tracking-wide text-[#09233d]">
          <span>{message}</span>
          <span className="flex items-center gap-0.5 ml-0.5">
            <span className="w-1 h-1 rounded-full bg-[#20b875] animate-ping" />
            <span className="w-1 h-1 rounded-full bg-[#20b875] animate-ping" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[calc(100vh-8rem)] w-full flex items-center justify-center bg-slate-50/50 backdrop-blur-xs rounded-2xl">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="w-full py-10 flex items-center justify-center">
      {loaderContent}
    </div>
  );
}
