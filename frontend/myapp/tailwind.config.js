/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.

  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./Components/**/*.{js,jsx,ts,tsx}",
    "./assets/styles/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}

