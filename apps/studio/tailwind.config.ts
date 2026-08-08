import type { Config } from 'tailwindcss'

// Tokens del CHROME DE GESTIÓN de Studio, espejo de `apps/admin/tailwind.config.ts`: mismas
// fuentes, misma paleta, mismos radios y sombras. Las dos apps las usa el mismo equipo y no
// tiene sentido que se vean distintas.
//
// OJO: esto NO toca el design system de los JUEGOS. Ese vive en `app/assets/css/storyplay.css`
// con sus propias variables CSS (`.sp-*`) y no depende de Tailwind — verificado: cero
// `theme()`/`@apply` ahí y cero clases `brand-*`/`gray-*` en `content/`.
export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'sans-serif'],
      },

      borderRadius: {
        // Radios firma del rediseño: card 18px, campo 12px, botón 11px.
        card: '18px',
        field: '12px',
        btn: '11px',
      },

      boxShadow: {
        // Sombras verdosas (base rgba(26,46,34) = brand.dark) del template.
        card: '0 8px 20px -10px rgba(26,46,34,0.12)',
        lift: '0 16px 32px -14px rgba(26,46,34,0.18)',
        dropdown: '0 16px 36px -14px rgba(26,46,34,0.25)',
        menu: '0 20px 44px -16px rgba(26,46,34,0.28)',
        btn: '0 1px 2px rgba(26,46,34,0.1)',
        cta: '0 4px 12px -2px rgba(67,180,53,0.4)',
        auth: '0 12px 32px -12px rgba(26,46,34,0.12)',
      },

      colors: {
        // Neutrales VERDOSOS: reemplazan la escala gris de Tailwind para que todo el
        // código existente (`text-gray-*`, `border-gray-*`, `bg-gray-*`) adopte la
        // paleta sin tocar cada archivo. La superficie de página es fría (brand.bg)
        // a propósito; el verdor vive en cards, bordes y texto.
        gray: {
          50: '#f5f8f5',
          100: '#eef4ee',
          200: '#e6efe6',
          300: '#c2cfc5',
          400: '#a3b3a7',
          500: '#8a998e',
          600: '#6b7d70',
          700: '#3c4a41',
          800: '#22302a',
          900: '#1a2e22',
        },

        brand: {
          // Verde — acción principal (botones, CTA, éxito).
          primary: {
            DEFAULT: '#43b435',
            50: '#f3fdee',
            100: '#e4fcd9',
            200: '#caf8b6',
            300: '#a2f188',
            400: '#5fce4a',
            500: '#43b435',
            600: '#379e2b',
            700: '#318f2c',
            800: '#2a7127',
            900: '#174019',
          },
          // Teal — acciones secundarias, info.
          secondary: {
            DEFAULT: '#4ECDC4',
            50: '#edfffe',
            100: '#d6f8f5',
            200: '#adf1eb',
            300: '#7de8e1',
            400: '#4ECDC4',
            500: '#3DBDB4',
            600: '#2E9D95',
            700: '#237B75',
            800: '#1A5B57',
            900: '#123D3B',
          },
          // Amarillo — destacados, recompensas.
          accent: {
            DEFAULT: '#FFE66D',
            50: '#fffdf0',
            100: '#fff8d6',
            200: '#fff1ad',
            300: '#ffea84',
            400: '#FFE66D',
            500: '#E6CC4D',
            600: '#CCB33E',
            700: '#A68F32',
            800: '#7A6825',
            900: '#524618',
          },
          // Coral — color de marca, decorativo.
          coral: {
            DEFAULT: '#FF6B6B',
            50: '#fff5f5',
            100: '#ffe5e5',
            200: '#ffcccc',
            300: '#ffb3b3',
            400: '#ff8a8a',
            500: '#FF6B6B',
            600: '#E55050',
            700: '#CC3838',
            800: '#A82929',
            900: '#7A1F1F',
          },
          // Púrpura — en admin marca el contexto Platform; acá, la identidad de Studio.
          purple: {
            DEFAULT: '#A29BFE',
            50: '#f5f4ff',
            100: '#ebeaff',
            200: '#d7d4ff',
            300: '#b8b2e8',
            400: '#A29BFE',
            500: '#827BDE',
            600: '#6B62C7',
            700: '#554CAD',
            800: '#403888',
            900: '#2D2860',
          },
          // Oscuro — títulos, texto fuerte, chips activos, sombras.
          dark: '#1a2e22',
          // Fondos
          bg: '#f4f5f7',
          surface: '#FFFFFF',
          // Blanco con matiz verde: fondo de inputs, footers de card, info-boxes.
          tint: '#fbfdfb',
        },
      },
    },
  },
}
