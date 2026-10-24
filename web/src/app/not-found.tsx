import Link from "next/link";
import { StarDivider } from "@/components/ui/StarDivider";
import { CopperplateButton } from "@/components/ui/CopperplateButton";

export default function NotFound() {
  return (
    <article
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-widest)",
          textTransform: "uppercase",
          color: "var(--rust)",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        Folio Missing &middot; 404
      </div>
      <h1
        style={{
          fontFamily: "var(--font-main)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 1rem",
        }}
      >
        Inscription Not Found
      </h1>
      <p
        style={{
          fontSize: "var(--text-base)",
          fontStyle: "italic",
          color: "var(--sepia-mid)",
          lineHeight: "var(--leading-normal)",
          marginBottom: "1.5rem",
        }}
      >
        The requested scientific treatise, laboratory protocol, or chapter page
        could not be located within Oliver&rsquo;s Guide To Everything.
      </p>

      <StarDivider symbol="diamond" variant={1} spacing="md" />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "2rem",
          flexWrap: "wrap",
        }}
      >
        <CopperplateButton href="/contents" size="md">
          Consult Master Table of Contents
        </CopperplateButton>
        <Link
          href="/"
          style={{
            alignSelf: "center",
            fontSize: "var(--text-sm)",
            color: "var(--sepia-muted)",
            textDecoration: "underline",
          }}
        >
          Return to Frontispiece
        </Link>
      </div>
    </article>
  );
}
