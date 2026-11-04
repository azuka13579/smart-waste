/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Tema gelap belum ada dan app.json mengunci tema terang; "media" membuat NativeWind web error saat skema dikunci
  darkMode: "class",
  theme: {
    extend: {
      // Hex dari token OKLCH di `web/src/index.css` agar web dan mobile berwarna sama. Ubah keduanya bersamaan.
      colors: {
        background: "#f6f8f7",
        foreground: "#1a201d",
        card: { DEFAULT: "#ffffff", foreground: "#1a201d" },
        primary: {
          DEFAULT: "#18864f",
          foreground: "#ffffff",
          // Hijau lebih gelap untuk efek tekan dan elemen di atas header hijau
          deep: "#0f6c3f",
          // Teks sekunder di atas hijau: diturunkan dari hue hijau, bukan abu-abu
          muted: "#cae6d3",
        },
        secondary: { DEFAULT: "#e3f3ea", foreground: "#156b42" },
        muted: { DEFAULT: "#f1f5f3", foreground: "#617069" },
        destructive: { DEFAULT: "#dc2626", foreground: "#ffffff", container: "#fdecec", "on-container": "#9b1c1c" },
        border: "#e3e9e6",
        input: "#c9d3ce",
        ring: "#25a563",
        // Sama dengan `--status-*` di web
        status: { pending: "#b45307", "in-progress": "#1d4ed8", completed: "#156b42", rejected: "#b91c1c" },
      },
      // Plus Jakarta Sans per ketebalan: font kustom di Android tidak bisa memilih file lewat fontWeight
      fontFamily: {
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-medium": ["PlusJakartaSans_500Medium"],
        "jakarta-semibold": ["PlusJakartaSans_600SemiBold"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
      },
      // Skala tipe Material 3. Pakai lewat komponen `Text` (`variant`), jangan ukuran manual per layar.
      // Satuan RN mengikuti pengaturan ukuran font sistem (setara sp).
      fontSize: {
        "display-sm": ["32px", { lineHeight: "40px", letterSpacing: "-0.5px" }],
        "headline-sm": ["24px", { lineHeight: "32px", letterSpacing: "-0.25px" }],
        "title-lg": ["20px", { lineHeight: "28px" }],
        "title-md": ["16px", { lineHeight: "24px" }],
        "title-sm": ["14px", { lineHeight: "20px" }],
        "body-lg": ["16px", { lineHeight: "24px" }],
        "body-md": ["14px", { lineHeight: "20px" }],
        "body-sm": ["12px", { lineHeight: "16px" }],
        "label-lg": ["14px", { lineHeight: "20px" }],
        "label-md": ["12px", { lineHeight: "16px" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        sheet: "28px",
      },
    },
  },
  plugins: [],
};
