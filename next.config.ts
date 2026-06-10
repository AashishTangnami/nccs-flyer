import type { NextConfig } from "next";

// @imgly/background-removal downloads its WASM + ONNX model from this CDN by default
// (publicPath default). Photos are processed locally; only the model binary is fetched.
const IMGLY_CDN = "https://staticimgly.com";

// Origin(s) allowed to embed this app in an <iframe>. Set ALLOWED_FRAME_ANCESTOR in the
// Vercel dashboard to the official site, e.g. "https://official.example" (space-separate
// for multiple). Defaults to 'none' (deny-by-default): the app still loads directly, but
// cannot be framed until configured — this stops phishing sites from wrapping the tool to
// look official.
const FRAME_ANCESTORS = process.env.ALLOWED_FRAME_ANCESTOR?.trim() || "'none'";

// 'unsafe-eval' is required by @imgly/background-removal (new Function in its bundled
// ndarray glue); 'wasm-unsafe-eval' covers WebAssembly compilation; 'unsafe-inline' is
// required by Next.js for its runtime scripts. The model/WASM are fetched from the
// img.ly CDN, then run as blob: URLs in the main thread and same-origin workers.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "worker-src 'self' blob:",
  `connect-src 'self' blob: data: ${IMGLY_CDN}`,
  "font-src 'self' data:",
  // Hardening: no plugins, no <base> hijack, forms stay same-origin.
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Only the configured official origin may frame this app.
  `frame-ancestors ${FRAME_ANCESTORS}`
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Security-Policy", value: CSP }
        ]
      },
      {
        source: "/flyers-backgrounds/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      }
    ];
  }
};

export default nextConfig;
