/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1115',
        canvas: '#fafbfc',
        muted: '#6b7280',
        border: '#eaecef',
        indigo: {
          DEFAULT: '#1e3a8a',
          hover: '#1d4ed8',
        },
        cat: {
          viajes: '#1e3a8a',
          reflexiones: '#7c3aed',
          papers: '#059669',
          enlaces: '#f59e0b',
          proyectos: '#059669',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      letterSpacing: {
        'tight-2': '-0.02em',
        'tight-3': '-0.03em',
        'tight-4': '-0.04em',
      },
    },
  },
  plugins: [],
};
