import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import PushManager from "../components/PushManager";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mindzed Biller",
  description: "Created By Mindzed Technologies",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${geistMono.variable} font-sans h-[100dvh] antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="h-[100dvh] flex flex-col mesh-bg text-white overflow-hidden relative">
        <Providers>
          <PushManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
