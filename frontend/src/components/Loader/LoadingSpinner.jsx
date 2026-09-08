import React from 'react';

export default function LoadingSpinner({
  size = 'md'
}) {
  const sizeClasses = {
    sm: 'loader-orbit loader-orbit--sm',
    md: 'loader-orbit',
    lg: 'loader-orbit loader-orbit--lg'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const loaderContent = (
    <div className="flex items-center justify-center select-none">
      <div className={currentSize} role="status" aria-label="Loading">
        <div className="loader-assembly">
          <span className="loader-block loader-block--1" />
          <span className="loader-block loader-block--2" />
          <span className="loader-block loader-block--3" />
          <span className="loader-block loader-block--4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="loader-screen" aria-live="polite">
      {loaderContent}
    </div>
  );
}
