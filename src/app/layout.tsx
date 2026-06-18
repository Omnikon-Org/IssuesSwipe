import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IssueSwipe - Tinder for Open Source Contributions",
  description: "Find your next pull request in seconds. Discover open-source issues through a swipe-based interface, grow your streak, gain XP, and contribute to top repositories.",
  keywords: ["open source", "github", "tinder for developers", "git swipe", "pull request", "contributor XP", "good first issue"],
  authors: [{ name: "IssueSwipe Team" }],
  openGraph: {
    title: "IssueSwipe - Tinder for Open Source Contributions",
    description: "Find your next pull request in seconds. Discover open-source issues through a swipe-based interface, grow your streak, gain XP, and contribute to top repositories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark`}>
      <body className="min-h-full bg-dark-bg text-foreground antialiased flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
