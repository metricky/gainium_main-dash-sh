/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['variant', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xs: [
        'calc(var(--base-font-size) * 0.75)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
      sm: [
        'calc(var(--base-font-size) * 0.875)',
        { lineHeight: 'calc(var(--base-font-size) * 1.25)' },
      ],
      base: [
        'var(--base-font-size)',
        { lineHeight: 'calc(var(--base-font-size) * 1.5)' },
      ],
      lg: [
        'calc(var(--base-font-size) * 1.125)',
        { lineHeight: 'calc(var(--base-font-size) * 1.75)' },
      ],
      xl: [
        'calc(var(--base-font-size) * 1.25)',
        { lineHeight: 'calc(var(--base-font-size) * 1.75)' },
      ],
      '2xl': [
        'calc(var(--base-font-size) * 1.5)',
        { lineHeight: 'calc(var(--base-font-size) * 2)' },
      ],
      '3xl': [
        'calc(var(--base-font-size) * 1.875)',
        { lineHeight: 'calc(var(--base-font-size) * 2.25)' },
      ],
      '4xl': [
        'calc(var(--base-font-size) * 2.25)',
        { lineHeight: 'calc(var(--base-font-size) * 2.5)' },
      ],
      '5xl': [
        'calc(var(--base-font-size) * 3)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
      '6xl': [
        'calc(var(--base-font-size) * 3.75)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
      '7xl': [
        'calc(var(--base-font-size) * 4.5)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
      '8xl': [
        'calc(var(--base-font-size) * 6)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
      '9xl': [
        'calc(var(--base-font-size) * 8)',
        { lineHeight: 'calc(var(--base-font-size) * 1)' },
      ],
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      width: {
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        'sidebar-expanded': 'var(--sidebar-width-expanded)',
        'sidebar-widget': 'var(--sidebar-width-widget)',
      },
      maxWidth: {
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        'sidebar-expanded': 'var(--sidebar-width-expanded)',
        'sidebar-widget': 'var(--sidebar-width-widget)',
      },
      gap: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
