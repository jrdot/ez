import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ezwire — 배선 설계 도구",
  description: "전자 부품과 단자의 연결 관계를 설계하고 문서화합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

