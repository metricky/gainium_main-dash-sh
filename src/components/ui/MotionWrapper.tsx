import { MOTION_PROPS } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { buttonVariants } from './button-variants';

// Common motion wrapper props
interface BaseMotionWrapperProps {
  children: ReactNode;
  className?: string;
  animationType?: keyof typeof MOTION_PROPS;
  custom?: object;
  enableReducedMotion?: boolean;
}

// Motion wrapper with predefined animations
type MotionWrapperProps = BaseMotionWrapperProps &
  Omit<ComponentProps<typeof motion.div>, 'children' | 'className'>;

export const MotionWrapper = forwardRef<HTMLDivElement, MotionWrapperProps>(
  (
    {
      children,
      className,
      animationType = 'fadeIn',
      custom,
      enableReducedMotion = true,
      ...motionProps
    },
    ref
  ) => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      enableReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Get predefined animation props
    const animationProps = MOTION_PROPS[animationType];

    // Merge custom props with predefined ones
    const finalProps = {
      ...animationProps,
      ...custom,
      ...motionProps,
      className,
      ref,
    };

    // If user prefers reduced motion, render without animations
    if (prefersReducedMotion) {
      return (
        <div className={className} ref={ref}>
          {children}
        </div>
      );
    }

    return <motion.div {...finalProps}>{children}</motion.div>;
  }
);

MotionWrapper.displayName = 'MotionWrapper';

// Specific motion components for common use cases
export const FadeIn = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>((props, ref) => (
  <MotionWrapper {...props} animationType="fadeIn" ref={ref} />
));
FadeIn.displayName = 'FadeIn';

export const SlideInLeft = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>((props, ref) => (
  <MotionWrapper {...props} animationType="slideInLeft" ref={ref} />
));
SlideInLeft.displayName = 'SlideInLeft';

export const SlideInRight = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>((props, ref) => (
  <MotionWrapper {...props} animationType="slideInRight" ref={ref} />
));
SlideInRight.displayName = 'SlideInRight';

export const ScaleIn = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>((props, ref) => (
  <MotionWrapper {...props} animationType="scaleIn" ref={ref} />
));
ScaleIn.displayName = 'ScaleIn';

export const PageTransition = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>((props, ref) => <MotionWrapper {...props} animationType="page" ref={ref} />);
PageTransition.displayName = 'PageTransition';

// Button with built-in hover animations
interface MotionButtonProps
  extends BaseMotionWrapperProps, VariantProps<typeof buttonVariants> {
  as?: 'button' | 'div' | 'a';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: ComponentProps<typeof motion.div>['style'];
}

export const MotionButton = forwardRef<HTMLDivElement, MotionButtonProps>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'default',
      as = 'button',
      disabled = false,
      enableReducedMotion = true,
      style,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion =
      enableReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const Component = motion[as] as typeof motion.div;
    const animationProps = prefersReducedMotion ? {} : MOTION_PROPS.buttonHover;

    const componentProps = {
      ...animationProps,
      ...props,
      'data-size': size,
      className: cn(buttonVariants({ variant, size }), className),
      ref,
      style: {
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      },
      ...(as === 'button' && { disabled }),
    };

    return <Component {...componentProps}>{children}</Component>;
  }
);
MotionButton.displayName = 'MotionButton';

// Card with built-in hover animations
export const MotionCard = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>(({ children, className, enableReducedMotion = true, ...props }, ref) => {
  const prefersReducedMotion =
    enableReducedMotion &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationProps = prefersReducedMotion ? {} : MOTION_PROPS.cardHover;

  return (
    <motion.div {...animationProps} {...props} className={className} ref={ref}>
      {children}
    </motion.div>
  );
});
MotionCard.displayName = 'MotionCard';

// Stagger container for animating lists
interface StaggerContainerProps extends BaseMotionWrapperProps {
  staggerDelay?: number;
  itemDelay?: number;
}

export const StaggerContainer = forwardRef<
  HTMLDivElement,
  StaggerContainerProps
>(
  (
    {
      children,
      className,
      staggerDelay = 0.05,
      itemDelay = 0.1,
      enableReducedMotion = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion =
      enableReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return (
        <div className={className} ref={ref}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: itemDelay,
            },
          },
        }}
        className={className}
        ref={ref}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = 'StaggerContainer';

export const StaggerItem = forwardRef<
  HTMLDivElement,
  Omit<MotionWrapperProps, 'animationType'>
>(({ children, className, enableReducedMotion = true, ...props }, ref) => {
  const prefersReducedMotion =
    enableReducedMotion &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className={className} ref={ref}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      className={className}
      ref={ref}
      {...props}
    >
      {children}
    </motion.div>
  );
});
StaggerItem.displayName = 'StaggerItem';

// AnimatePresence wrapper for conditional rendering
interface AnimatedPresenceProps {
  children: ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
}

export const AnimatedPresence: React.FC<AnimatedPresenceProps> = ({
  children,
  mode = 'wait',
  initial = true,
}) => {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
};

// Note: Variants and motion utilities are exported from @/lib/animations/variants
