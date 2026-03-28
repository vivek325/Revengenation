export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rn: {
          bg: "#1A1A1B",
          card: "#272729",
          hover: "#313335",
          border: "#343536",
          text: "#D7DADC",
          muted: "#818384",
          orange: "#FF4500",
          down: "#7193FF",
        },
      },
    },
  },
  plugins: [],
};