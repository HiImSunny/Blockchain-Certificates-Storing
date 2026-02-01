/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#D97706', // Orange
                    light: '#F59E0B',
                    dark: '#B45309',
                },
                neutral: {
                    cream: '#F5F5DC',
                    beige: '#E8E4D9',
                    dark: '#333333',
                    gray: '#808080',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
