import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';

interface TransitionContextType {
  triggerTransition: (callback: () => void) => Promise<void>;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a TransitionProvider');
  }
  return context;
};

export const TransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  // Initialize SVG stroke dasharray and dashoffset
  useEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;

    if (p1 && p2) {
      const len1 = p1.getTotalLength();
      const len2 = p2.getTotalLength();

      // Setup initial styles
      p1.style.strokeDasharray = `${len1}`;
      p1.style.strokeDashoffset = `${len1}`;

      p2.style.strokeDasharray = `${len2}`;
      p2.style.strokeDashoffset = `${len2}`;
    }
  }, []);

  const leave = () => {
    return new Promise<void>((resolve) => {
      const p1 = path1Ref.current;
      const p2 = path2Ref.current;

      if (!p1 || !p2) {
        resolve();
        return;
      }

      const tl = gsap.timeline({ onComplete: resolve });

      // Animating paths drawing in
      tl.to(p1, {
        strokeDashoffset: 0,
        attr: { "stroke-width": 700 },
        duration: 0.85,
        ease: "power2.inOut",
      }, 0);

      tl.to(p2, {
        strokeDashoffset: 0,
        attr: { "stroke-width": 700 },
        duration: 0.85,
        ease: "power2.inOut",
      }, 0.08); // Slight stagger for depth
    });
  };

  const enter = () => {
    return new Promise<void>((resolve) => {
      const p1 = path1Ref.current;
      const p2 = path2Ref.current;

      if (!p1 || !p2) {
        resolve();
        return;
      }

      const len1 = p1.getTotalLength();
      const len2 = p2.getTotalLength();

      const tl = gsap.timeline({ onComplete: resolve });

      // Animating paths drawing out
      tl.to(p1, {
        strokeDashoffset: -len1,
        attr: { "stroke-width": 200 },
        duration: 0.85,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(p1, { strokeDashoffset: len1 });
        }
      }, 0);

      tl.to(p2, {
        strokeDashoffset: -len2,
        attr: { "stroke-width": 200 },
        duration: 0.85,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(p2, { strokeDashoffset: len2 });
        }
      }, 0.08);
    });
  };

  const triggerTransition = async (callback: () => void) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Draw transition overlay
    await leave();

    // Execute the navigation or state change
    callback();

    // Give React a tiny moment to paint the new route before unwiping
    setTimeout(async () => {
      // Wipe transition overlay away
      await enter();
      setIsTransitioning(false);
    }, 50);
  };

  return (
    <TransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
      {children}
      
      {/* SVG Transition Layer */}
      <div 
        className={`fixed -inset-[30%] z-[999999] flex items-center justify-center ${
          isTransitioning ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <svg
          viewBox="0 0 2453 2535"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Background wipe layer (Website Surface Color) */}
          <path
            ref={path1Ref}
            d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
            stroke="rgb(var(--color-surface))"
            strokeWidth="200"
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
          {/* Foreground wipe layer (Website Primary Color) */}
          <path
            ref={path2Ref}
            d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
            stroke="rgb(var(--color-primary))"
            strokeWidth="200"
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
        </svg>
      </div>
    </TransitionContext.Provider>
  );
};
