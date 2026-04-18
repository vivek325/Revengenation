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
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-GX3YPTWPRT"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GX3YPTWPRT');
            `,
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('rn-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}` }}
        />
        {/* Google Translate — kept in DOM but off-screen so widget can initialize */}
        <div id="google_translate_element" aria-hidden="true" />
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  autoDisplay: false,
                  multilanguagePage: false,
                }, 'google_translate_element');
              };
              // Expose a reliable trigger function that works after widget loads
              window.doGTranslate = function(lang_pair) {
                if (lang_pair.value) lang_pair = lang_pair.value;
                if (lang_pair === '') return;
                var lang = lang_pair.split('|')[1];
                if (lang === 'en') lang = '';
                var sel = document.querySelector('select.goog-te-combo');
                if (sel) {
                  sel.value = lang;
                  sel.dispatchEvent(new Event('change', { bubbles: true }));
                }
              };
            `,
          }}
        />
        <Script
          id="google-translate-script"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
