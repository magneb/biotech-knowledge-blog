import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./globals.css";
import GlobalHeader from "@/components/GlobalHeader";
import SiteFooter from "@/components/SiteFooter";
import WipBanner from "@/components/WipBanner";
import { DevPerformancePatch } from "@/components/DevPerformancePatch";
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

export const revalidate = 604800;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { isEnabled: isDraftMode } = await draftMode();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en" className={cormorantGaramond.variable} data-scroll-behavior="smooth">
      <body className="desk-canvas">
        <div className="parchment-sheet">
          <DevPerformancePatch />
          <WipBanner />
          <GlobalHeader />
          <main className="sheet-content">{children}</main>
          <SiteFooter />
        </div>
        <SanityLive />
        {(isDraftMode || isDev) && <VisualEditing />}
      </body>
    </html>
  );
}
