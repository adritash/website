import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, ".."),
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
