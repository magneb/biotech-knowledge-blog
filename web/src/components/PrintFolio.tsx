import { formatCategory, formatDate } from "@/lib/format";
import { formatApa7Citation, getVersionPermalink } from "@/lib/citation";
import styles from "./PrintFolio.module.css";

export interface PrintFolioProps {
  title: string;
  author?: string;
  contentType?: string | null;
  publishedAt?: string | null;
  versionNumber?: number | null;
  slug: string;
}

export function PrintHeader({
  title,
  author = "Oliver",
  contentType = "protocol",
  publishedAt,
  versionNumber = 1,
  slug,
}: PrintFolioProps) {
  const permalink = getVersionPermalink(slug, versionNumber || 1);
  const now = new Date().toUTCString();

  return (
    <div className={styles.printHeader} data-version={`v${versionNumber || 1}`}>
      <div className={styles.printMasthead}>
        <span>Oliver&apos;s Guide To Everything</span>
        <span>Scientific Compendium &bull; Edition v{versionNumber || 1}</span>
      </div>

      <h1 className={styles.printTitle}>{title}</h1>

      <div className={styles.printMeta}>
        <span><strong>Author:</strong> {author}</span>
        {contentType && <span><strong>Format:</strong> {formatCategory(contentType)}</span>}
        {publishedAt && <span><strong>Published:</strong> {formatDate(publishedAt, "long")}</span>}
        <span><strong>Canonical URL:</strong> {permalink}</span>
      </div>

      <div className={styles.printTimestamp}>
        Document retrieved &amp; printed on {now} (UTC)
      </div>
    </div>
  );
}

export function PrintFooter({
  title,
  author = "Oliver",
  publishedAt,
  versionNumber = 1,
  slug,
}: PrintFolioProps) {
  const apaCitation = formatApa7Citation({
    title,
    author,
    publishedAt,
    versionNumber,
    slug,
  });

  return (
    <footer className={styles.printFooter}>
      <div className={styles.printCitationTitle}>Official Citation (APA 7th Edition):</div>
      <div className={styles.printCitationText}>{apaCitation}</div>
      <div className={styles.printMotto}>
        ✦ Knowledge for a More Curious World &bull; Oliver&apos;s Guide To Everything ✦
      </div>
    </footer>
  );
}
