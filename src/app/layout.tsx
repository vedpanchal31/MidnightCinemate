import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";
import GlobalToaster from "@/components/GlobalToaster";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cinemate - Premium Theater Booking",
  description: "Book movies in style. Real-time availability, midnight theme.",
  icons: {
    icon: "/Cinemate_logo_bg.png",
    shortcut: "/Cinemate_logo_bg.png",
    apple: "/Cinemate_logo_bg.png",
  },
  openGraph: {
    title: "Cinemate - Premium Theater Booking",
    description:
      "Book movies in style. Real-time availability, midnight theme.",
    images: [
      {
        url: "/Cinemate_logo_bg.png",
        width: 1200,
        height: 630,
        alt: "Cinemate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cinemate - Premium Theater Booking",
    description:
      "Book movies in style. Real-time availability, midnight theme.",
    images: ["/Cinemate_logo_bg.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <StoreProvider>
          <ThemeProvider>
            {children}
            <GlobalToaster />
          </ThemeProvider>
        </StoreProvider>
        <GlobalToaster />
      </body>
    </html>
  );
}
