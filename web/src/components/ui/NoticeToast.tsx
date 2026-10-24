import { Icon } from "@/components/ui/Icon";
import styles from "./NoticeToast.module.css";

export interface NoticeToastData {
  title: string;
  message: string;
}

export interface NoticeToastProps {
  notice: NoticeToastData | null;
  onDismiss: () => void;
}

/**
 * Antique copperplate notification toast for informational dispatches and alerts.
 */
export function NoticeToast({ notice, onDismiss }: NoticeToastProps) {
  if (!notice) return null;

  return (
    <div className={styles.noticeModal} role="status">
      <button
        type="button"
        className={styles.noticeDismiss}
        onClick={onDismiss}
        aria-label="Dismiss notice"
      >
        ✕
      </button>
      <div className={styles.noticeTitle}>
        <Icon name="star-four" size={13} style={{ color: "var(--gold)" }} />
        <span>{notice.title}</span>
      </div>
      <p className={styles.noticeBody}>{notice.message}</p>
    </div>
  );
}
