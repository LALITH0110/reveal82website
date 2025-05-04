import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import Script from "next/script"; // ✨ used for chatbot script

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "REVEAL 82 - Chicago Lead Service Line Risk Assessment",
  description: "Helping Chicago residents understand and address lead service line risks",
  icons: "/logo.PNG"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* VG Overlay container for TIXAE Chatbot */}
        <div style={{ width: 0, height: 0 }} id="VG_OVERLAY_CONTAINER" />

        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-G3ELJ6J5WZ"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G3ELJ6J5WZ');
          `}
        </Script>

        {/* Chatbot Script */}
        <Script id="vg-chatbot" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              window.VG_CONFIG = {
                ID: "9GMglRUMhoFtrBi1YtvD", // Your TIXAE Agent ID
                region: 'na',
                render: 'bottom-right',
                stylesheets: [
                  "https://vg-bunny-cdn.b-cdn.net/vg_live_build/styles.css"
                ]
                // modalMode: true, // uncomment if you want modal
                // autostart: true, // uncomment if you want auto start
              };
              var VG_SCRIPT = document.createElement("script");
              VG_SCRIPT.src = "https://vg-bunny-cdn.b-cdn.net/vg_live_build/vg_bundle.js";
              VG_SCRIPT.defer = true;
              document.body.appendChild(VG_SCRIPT);
            })();
          `
        }} />

        {/* App Layout */}
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
