const fs = require("fs");
const path = require("path");

const webDistDir = path.resolve(__dirname, "..", "web-dist");
const indexPath = path.join(webDistDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("web-dist/index.html not found. Run expo export first.");
  process.exit(1);
}

// Copy apple-touch-icon
const iconSrc = path.resolve(__dirname, "..", "assets", "images", "icon.png");
const iconDest = path.join(webDistDir, "apple-touch-icon.png");
fs.copyFileSync(iconSrc, iconDest);
console.log("Copied apple-touch-icon.png");

// Write manifest.json
const manifest = {
  name: "Kaffee Journal",
  short_name: "Kaffee Journal",
  description: "Kaffee gemeinsam bewerten",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#000000",
  theme_color: "#2C1810",
  icons: [
    {
      src: "/apple-touch-icon.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/favicon.ico",
      sizes: "64x64",
      type: "image/x-icon",
    },
  ],
};
fs.writeFileSync(
  path.join(webDistDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("Written manifest.json");

// Post-process index.html: inject iOS PWA meta tags
let html = fs.readFileSync(indexPath, "utf-8");

const pwaTags = `
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2C1810" />

    <!-- iOS Homescreen / PWA -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Kaffee Journal" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

// Fix title and lang, add PWA tags before </head>
html = html
  .replace(/<html lang="en">/, '<html lang="de">')
  .replace(/<title>.*?<\/title>/, "<title>Kaffee Journal</title>")
  .replace(
    /width=device-width, initial-scale=1, shrink-to-fit=no"/,
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
  )
  .replace("</head>", `${pwaTags}\n  </head>`);

// Fix background color in style
html = html.replace(
  /(body\s*\{[^}]*overflow:\s*hidden;)/,
  "$1\n      background-color: #000000;"
);

fs.writeFileSync(indexPath, html, "utf-8");
console.log("Post-processed index.html with PWA tags");
console.log("Web PWA build complete!");
