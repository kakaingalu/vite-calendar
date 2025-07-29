import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/styles/**/*.{css,scss}' // Good: supports @apply in CSS
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
