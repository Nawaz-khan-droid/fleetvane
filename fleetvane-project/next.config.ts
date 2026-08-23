import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Track B debt cleanup complete: full tsc passes, so build-time type
  // checking is enforced again — silent type bugs will now fail the build.
  reactStrictMode: false,
};

export default nextConfig;
