import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // API가 실행 중에 읽는 근거 문서 파일을 Vercel 배포본에 함께 넣는다.
  outputFileTracingIncludes: {
    "/api/*": ["./data/documents/**/*.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
