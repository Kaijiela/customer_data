import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "顧客資料卡",
  description: "可列印並儲存在瀏覽器中的顧客資料卡"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
