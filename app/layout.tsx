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
        {/* VG Overlay container */}
        <div style={{ width: 0, height: 0 }} id="VG_OVERLAY_CONTAINER" />

        {/* External Chatbot Script */}
        <Script id="vg-chatbot" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              window.VG_CONFIG = {
                ID: "5KEF7O5jlPkNhB1UvouY", // Your new agent ID
                region: 'na',
                render: 'bottom-right',
                stylesheets: [
                  "https://vg-bunny-cdn.b-cdn.net/vg_live_build/styles.css"
                ]
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




import './globals.css'
