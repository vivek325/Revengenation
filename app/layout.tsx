import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RevengeNation — Real Stories of Revenge & Karma",
  description: "Anonymous stories of betrayal, revenge, karma, and justice. Submit yours and let the world vote.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head />
      <body className="min-h-full bg-[#F1F5F9] dark:bg-[#07090F] transition-colors duration-200">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('rn-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}` }}
        />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
