const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const WEB_DIST = path.resolve(__dirname, "..", "web-dist");
const ASSETS_SRC = path.resolve(__dirname, "..", "assets", "images", "icon.png");

console.log("Building web app...");
execSync("npx expo export --platform web --output-dir web-dist", {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});

const indexPath = path.join(WEB_DIST, "index.html");
let html = fs.readFileSync(indexPath, "utf-8");

const pwaHead = [
  '    <meta name="apple-mobile-web-app-capable" content="yes" />',
  '    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '    <meta name="apple-mobile-web-app-title" content="Coffee Nest" />',
  '    <meta name="theme-color" content="#1A0F08" />',
  '    <link rel="manifest" href="/manifest.json" />',
  '    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
].join("\n");

html = html.replace('<link rel="icon" href="/favicon.ico" /></head>', [
  '<link rel="icon" href="/favicon.ico" />',
  pwaHead,
  "  </head>",
].join("\n"));

html = html.replace('<html lang="en">', '<html lang="de">');

fs.writeFileSync(indexPath, html);
console.log("PWA meta tags injected.");

const manifest = {
  name: "Coffee Nest",
  short_name: "Coffee Nest",
  description: "Kaffee Röstereien und Bewertungen",
  start_url: "/",
  display: "standalone",
  background_color: "#1A0F08",
  theme_color: "#1A0F08",
  orientation: "portrait",
  icons: [
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
};
fs.writeFileSync(
  path.join(WEB_DIST, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("manifest.json written.");

fs.copyFileSync(ASSETS_SRC, path.join(WEB_DIST, "apple-touch-icon.png"));
console.log("apple-touch-icon.png copied.");

console.log("Web build complete.");
