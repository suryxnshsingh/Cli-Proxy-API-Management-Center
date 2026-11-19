import { useTranslation } from 'react-i18next';
import { Flair } from '@/components/ui/Flair';
import type { GlanceRow } from '@/features/quota/quotaAccountSeries';
import { getTypeLabel } from '@/features/authFiles/constants';
import { QUOTA_PROGRESS_MEDIUM_THRESHOLD } from '@/features/quota/components/QuotaMeter';
import { quotaAccountLabel } from '@/features/quota/quotaChartFormat';
import { formatDuration } from './formatters';
import styles from './FareCards.module.scss';

const DAY_MS = 86_400_000;
const AXIS_DAYS = 7;

interface FareCardsProps {
  /** Glance rows, already ordered by next reset. */
  rows: readonly GlanceRow[];
  now: number;
  /** Stable series number per account id, shared with the projection chart's line keys. */
  numbers: ReadonlyMap<string, number>;
  /** The account reset-first routing will serve next, or null when routing is not reset-first. */
  upNextId: string | null;
  formatTime: (timestamp: number) => string;
}

/** Providers with their own card language; anything else uses the panel's neutral card. */
const BRANDED = new Set(['claude', 'codex', 'antigravity']);
const brandOf = (type: string) => (BRANDED.has(type) ? type : 'neutral');
/** The account's email reads better than its credential filename; fall back to the file. */
const displayName = (account: GlanceRow['account']) =>
  account.entry.file.email?.trim() || account.label;

/**
 * Accounts as fare cards: weekly balance left and when each one recharges. Each card speaks its
 * provider's own design language (Claude, ChatGPT/Codex, Antigravity).
 */
export function FareCards({ rows, now, numbers, upNextId, formatTime }: FareCardsProps) {
  const { t } = useTranslation();
  const end = now + AXIS_DAYS * DAY_MS;
  const timed = rows.filter((row) => row.resetAtMs !== null);

  return (
    <div className={styles.fare}>
      <ul className={styles.cards} aria-label={t('redesign.quota.glance_label')}>
        {rows.map((row) => {
          const { account } = row;
          const brand = brandOf(account.entry.type);
          const who = displayName(account);
          const cooling = Boolean(account.entry.file.unavailable) || row.remaining === 0;
          const upNext = account.id === upNextId;
          const card = (
            <article
              className={`${styles.card} ${styles[brand]}`}
              aria-label={quotaAccountLabel(account, t)}
            >
              <div className={styles.top}>
                <span className={styles.provider}>
                  <span className={styles.number} aria-hidden="true">
                    {numbers.get(account.id) ?? ''}
                  </span>
                  {getTypeLabel(t, account.entry.type)}
                </span>
                {row.stale ? (
                  <span className={styles.chip}>{t('redesign.quota.stale')}</span>
                ) : cooling ? (
                  <span className={styles.chip}>{t('redesign.dashboardQuota.fare_cooling')}</span>
                ) : upNext ? (
                  <span className={styles.chip}>{t('redesign.dashboardQuota.fare_up_next')}</span>
                ) : null}
              </div>
              <p className={styles.account} title={account.label}>
                {who}
              </p>
              {row.remaining === null ? (
                <p className={styles.balance}>
                  <span className={styles.unknown}>
                    {t('redesign.dashboardQuota.fare_not_measured')}
                  </span>
                </p>
              ) : (
                <p className={styles.balance}>
                  <strong>{Math.round(row.remaining)}%</strong>
                  <small>
                    {t('redesign.dashboardQuota.fare_left')}
                    {row.remaining < QUOTA_PROGRESS_MEDIUM_THRESHOLD && (
                      <span className={styles.low}> · {t('redesign.quota.low')}</span>
                    )}
                  </small>
                </p>
              )}
              <div className={styles.meter} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ inlineSize: `${Math.max(0, Math.min(100, row.remaining ?? 0))}%` }}
                />
              </div>
              <p className={styles.foot}>
                {row.resetAtMs === null ? (
                  <span>{t('redesign.dashboardQuota.fare_reset_unknown')}</span>
                ) : (
                  <>
                    <span>
                      {t('redesign.dashboardQuota.fare_resets', {
                        time: formatTime(row.resetAtMs),
                      })}
                    </span>
                    <span>
                      {t('redesign.dashboardQuota.fare_in', {
                        duration: formatDuration(t, (row.resetAtMs - now) / 1000),
                      })}
                    </span>
                  </>
                )}
              </p>
            </article>
          );
          return <li key={account.id}>{upNext ? <Flair>{card}</Flair> : card}</li>;
        })}
      </ul>

      {timed.length > 0 && (
        <figure className={styles.resetLine}>
          <figcaption className={styles.lineTitle}>
            {t('redesign.dashboardQuota.reset_line_title')}
          </figcaption>
          <ul className={styles.lanes}>
            {timed.map(({ account, resetAtMs }) => (
              <li key={account.id} className={styles.lane}>
                <span className={styles.laneLabel} title={account.label}>
                  {displayName(account)}
                </span>
                <span className={styles.laneTrack}>
                  <span
                    className={`${styles.laneBar} ${styles[brandOf(account.entry.type)]}`}
                    style={{
                      inlineSize: `${Math.min(100, ((resetAtMs! - now) / (end - now)) * 100)}%`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.ticks} aria-hidden="true">
            <span>{t('redesign.dashboardQuota.reset_line_now')}</span>
            {Array.from({ length: AXIS_DAYS }, (_, day) => (
              <span key={day}>
                {t('redesign.dashboardQuota.reset_line_day', { count: day + 1 })}
              </span>
            ))}
          </div>
        </figure>
      )}
    </div>
  );
}
