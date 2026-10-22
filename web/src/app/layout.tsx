import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oliver's Guide To Everything",
  description:
    "A personal knowledge base for biotech and cancer research protocols",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cormorantGaramond.variable} data-scroll-behavior="smooth">
      <body className="desk-canvas">
        <div className="parchment-sheet">
          <main className="sheet-content">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
