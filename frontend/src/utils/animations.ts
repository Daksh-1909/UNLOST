import { Variants } from 'framer-motion';

// Ultra-smooth GPU-accelerated transition timing across the app
export const TRANSITION_BASE = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1],
};

// 1. Page Transitions (Ultra-fast 0.12s opacity & micro-translate)
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.14, ease: 'easeOut' } 
  },
  exit: { 
    opacity: 0, 
    y: -4, 
    transition: { duration: 0.08, ease: 'easeIn' } 
  },
};

// 2. Scroll-triggered Reveal (for lists/cards)
export const scrollRevealVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: TRANSITION_BASE 
  },
};

export const scrollRevealViewport = { once: true, margin: "-20px" };

// 3. Stagger Containers (for Grids/Lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: TRANSITION_BASE
  },
};

// 4. Interactive Elements (Buttons, Cards, Icons)
export const tapHoverVariants = {
  hover: { scale: 1.015, transition: { duration: 0.12, ease: 'easeOut' } },
  tap: { scale: 0.98, transition: { duration: 0.08, ease: 'easeOut' } },
};

export const buttonHoverVariants = {
  hover: { scale: 1.015, filter: 'brightness(1.04)', transition: { duration: 0.12, ease: 'easeOut' } },
  tap: { scale: 0.98, filter: 'brightness(0.96)', transition: { duration: 0.08, ease: 'easeOut' } },
};

