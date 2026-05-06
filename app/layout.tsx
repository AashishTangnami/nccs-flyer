import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flyer Maker",
  description: "Client-side flyer maker with browser background removal."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
