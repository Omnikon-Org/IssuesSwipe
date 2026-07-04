import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IssueSwipe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-dark-bg text-foreground antialiased flex flex-col font-sans">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
