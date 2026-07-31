import { Variants } from 'framer-motion';

// Consistent transition timing across the app
export const TRANSITION_BASE = {
  duration: 0.25,
  ease: 'easeOut',
};

// 1. Page Transitions
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

// 2. Scroll-triggered Reveal (for lists/cards)
export const scrollRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: TRANSITION_BASE 
  },
};

export const scrollRevealViewport = { once: true, margin: "-50px" };

// 3. Stagger Containers (for Grids/Lists)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: TRANSITION_BASE
  },
};

// 4. Interactive Elements (Buttons, Cards, Icons)
export const tapHoverVariants = {
  hover: { scale: 1.02, transition: { duration: 0.15, ease: 'easeOut' } },
  tap: { scale: 0.96, transition: { duration: 0.1, ease: 'easeOut' } },
};

export const buttonHoverVariants = {
  hover: { scale: 1.02, filter: 'brightness(1.05)', transition: { duration: 0.15, ease: 'easeOut' } },
  tap: { scale: 0.96, filter: 'brightness(0.95)', transition: { duration: 0.1, ease: 'easeOut' } },
};
