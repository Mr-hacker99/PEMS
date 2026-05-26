import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
           style={{ borderWidth: 3 }} />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading PEMS...</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
