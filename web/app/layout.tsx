import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Pipeline Editor",
  description: "Timeline editor for the video pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
