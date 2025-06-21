/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
    "./resources/**/*.{js,ts,jsx,tsx,vue,blade.php}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    ],
    theme: {
    extend: {},
    },
    plugins: [
    require('tailwind-scrollbar'),
    ],
};
