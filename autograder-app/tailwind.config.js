/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        theme: {
          bg: 'var(--bg)',
          panel: 'var(--bg-panel)',
          'panel-translucent': 'var(--bg-panel-translucent)',
          'border-soft': 'var(--border-soft)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          text: 'var(--text)',
          'text-muted': 'var(--text-muted)',
          'text-faint': 'var(--text-faint)',
          accent: 'var(--accent)',
          'accent-ink': 'var(--accent-ink)',
          'accent-hover': 'var(--accent-hover)',
          'accent-fg': 'var(--accent-fg)',
          'accent-soft': 'var(--accent-soft)',
          'accent-border': 'var(--accent-border)',
          'accent-border-strong': 'var(--accent-border-strong)',
          success: 'var(--success)',
          'success-soft': 'var(--success-soft)',
          'success-ink': 'var(--success-ink)',
          'success-border': 'var(--success-border)',
          warning: 'var(--warning)',
          'warning-soft': 'var(--warning-soft)',
          'warning-ink': 'var(--warning-ink)',
          'warning-border': 'var(--warning-border)',
          'danger-border': 'var(--danger-border)',
          'danger-soft': 'var(--danger-soft)',
          'danger-text': 'var(--danger-text)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-scan': 'scanline 8s linear infinite',
        'robot-float': 'robotFloat 6s ease-in-out infinite',
        'radar-spin': 'radarSpin 16s linear infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        robotFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(0.6deg)' },
        },
        radarSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.06)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
};
