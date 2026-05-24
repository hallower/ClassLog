import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 개발 모드에서 LAN(다른 기기·모바일 등)에서의 HMR 요청을 허용.
     Next.js 16부터 외부 호스트의 /_next/* 리소스 요청은 기본 차단되므로
     로컬 네트워크 IP 대역을 명시적으로 허용한다. */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "*.local",
  ],
};

export default nextConfig;
