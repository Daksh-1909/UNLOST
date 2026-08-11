import React from 'react';

interface AmbientGlowBgProps {
  children: React.ReactNode;
  className?: string;
}

export const AmbientGlowBg: React.FC<AmbientGlowBgProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative w-full h-full overflow-x-hidden ${className}`}>
      {/* Decorative Ambient Glowing Background Blobs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/30 dark:bg-primary/40 rounded-full blur-[100px] opacity-40 dark:opacity-50 pointer-events-none -z-10"></div>
      <div className="absolute top-[600px] left-1/2 -translate-x-1/2 w-[120%] max-w-5xl h-[400px] bg-secondary/20 dark:bg-secondary/30 rounded-full blur-[120px] opacity-30 pointer-events-none -z-10"></div>
      
      {/* Interactive Content Layer */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

export default AmbientGlowBg;
