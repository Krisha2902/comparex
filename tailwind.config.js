/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Define a custom primary color based on the blue in the design
        'primary-blue': {
          DEFAULT: '#3b82f6', // Equivalent to Tailwind blue-500
          'light': '#eff6ff', // A very light blue for backgrounds (blue-50)
          'dark-bg': '#1f2937', // A slightly lighter dark gray for containers
        },
        // Define a custom shadow that matches the floating/soft look
        'soft-shadow': '0 10px 30px rgba(59, 130, 246, 0.15)', // Blue-tinted soft shadow
        'soft-shadow-dark': '0 10px 30px rgba(0, 0, 0, 0.5)', // Darker shadow for dark mode
      },
      boxShadow: {
        'soft': 'var(--soft-shadow)',
        'soft-dark': 'var(--soft-shadow-dark)',
      },
      backgroundImage: {
        // Define the specific gradient used in the hero section
        'hero-gradient-light': 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', // Light blue to white
      }
    },
  },
  plugins: [],
}