import type { NextConfig } from "next";
// import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Always put page metadata in <head> (not streamed after the body) so every client and crawler sees it.
  htmlLimitedBots: /.*/,
  // Pulse: load the queue library from node_modules at runtime instead of bundling it
  // (avoids bundling its optional Valkey client).
  serverExternalPackages: ["bullmq"],
  // outputFileTracingRoot: path.join(__dirname, ".."),

  async redirects() {
    return [
      { source: "/services", destination: "/skills", permanent: true },
      { source: "/services/:path*", destination: "/skills", permanent: true },
      { source: "/solutions", destination: "/skills", permanent: true },
      { source: "/solutions/:path*", destination: "/skills", permanent: true },
      { source: "/industries", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
