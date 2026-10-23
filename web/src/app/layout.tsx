import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { SanityLive } from "@/sanity/live";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en" className={cormorantGaramond.variable} data-scroll-behavior="smooth">
      <body className="desk-canvas">
        <div className="parchment-sheet">
          <main className="sheet-content">{children}</main>
          <SiteFooter />
        </div>
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  );
}
