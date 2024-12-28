import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";

const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Citizen Dashboard Search | CitizenDashboard.ca",
  description: "Search citizen dashboard data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Theme logic: System preference or default to light theme
  const theme = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "light";

  return (
    <html lang="en" data-theme={theme}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-lvh`}
      >
        {children}
      </body>
    </html>
  );
}
