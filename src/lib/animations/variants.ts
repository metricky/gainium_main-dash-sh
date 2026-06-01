/* eslint-disable @typescript-eslint/no-explicit-any */
// Variants type definition for Framer Motion animations
type Variants = {
  [key: string]: {
    [key: string]: any;
    transition?: any;
  };
};

// Common easing curves for consistent animation feel
export const EASINGS = {
  smooth: [0.25, 0.1, 0.25, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  quick: [0.4, 0, 0.2, 1],
  gentle: [0.25, 0.46, 0.45, 0.94],
} as const;

// Animation durations for consistency
export const DURATIONS = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  drawer: 0.3,
} as const;

// Fade animations
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Slide animations
export const slideVariants: Variants = {
  hiddenLeft: {
    x: -20,
    opacity: 0,
  },
  hiddenRight: {
    x: 20,
    opacity: 0,
  },
  hiddenUp: {
    y: -20,
    opacity: 0,
  },
  hiddenDown: {
    y: 20,
    opacity: 0,
  },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Scale animations for buttons and cards
export const scaleVariants: Variants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Drawer/Modal animations
export const drawerVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: DURATIONS.drawer,
      ease: EASINGS.smooth,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: DURATIONS.drawer,
      ease: EASINGS.quick,
    },
  },
};

// Backdrop animations
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Stagger animations for lists
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
};

// Button hover animations
export const buttonHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Table row hover animations
export const tableRowVariants: Variants = {
  rest: {
    backgroundColor: 'transparent',
  },
  hover: {
    backgroundColor: 'rgba(var(--muted), 0.5)',
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Card hover animations
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Form input focus animations
export const inputFocusVariants: Variants = {
  rest: {
    borderColor: 'rgba(var(--border), 1)',
    boxShadow: 'none',
  },
  focus: {
    borderColor: 'rgba(var(--primary), 1)',
    boxShadow: '0 0 0 2px rgba(var(--primary), 0.2)',
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Success/Error feedback animations
export const feedbackVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: -10,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.bounce,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Page transition animations
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.quick,
    },
  },
};

// Export common motion props for quick usage
export const MOTION_PROPS = {
  // Quick fade in
  fadeIn: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: fadeVariants,
  },

  // Quick slide from left
  slideInLeft: {
    initial: 'hiddenLeft',
    animate: 'visible',
    exit: 'exit',
    variants: slideVariants,
  },

  // Quick slide from right
  slideInRight: {
    initial: 'hiddenRight',
    animate: 'visible',
    exit: 'exit',
    variants: slideVariants,
  },

  // Scale animation
  scaleIn: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: scaleVariants,
  },

  // Drawer animation
  drawer: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: drawerVariants,
  },

  // Page transition
  page: {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: pageVariants,
  },

  // Button hover
  buttonHover: {
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
    variants: buttonHoverVariants,
  },

  // Card hover
  cardHover: {
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
    variants: cardHoverVariants,
  },

  // Stagger container
  staggerContainer: {
    initial: 'hidden',
    animate: 'visible',
    variants: staggerContainerVariants,
  },

  // Stagger item
  staggerItem: {
    variants: staggerItemVariants,
  },
} as const;
