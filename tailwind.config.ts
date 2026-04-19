import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 工业风主色调
        surface: '#0a0e1a',
        panel: 'rgba(12, 18, 35, 0.85)',
        border: 'rgba(0, 212, 255, 0.2)',
        accent: '#00d4ff',
        warn: '#ff6b35',
        danger: '#ff2d55',
        success: '#00ff88',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
