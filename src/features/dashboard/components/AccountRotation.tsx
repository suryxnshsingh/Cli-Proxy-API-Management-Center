import { useTranslation } from 'react-i18next';
import { Flair } from '@/components/ui/Flair';
import { IconTimer } from '@/components/ui/icons';
import { iconSize } from '@/design-system';
import { getTypeLabel } from '@/features/authFiles/constants';
import { QUOTA_PROGRESS_MEDIUM_THRESHOLD } from '@/features/quota/components/QuotaMeter';
import type { GlanceRow } from '@/features/quota/quotaAccountSeries';
import { quotaAccountLabel } from '@/features/quota/quotaChartFormat';
import { formatDuration } from './formatters';
import styles from './AccountRotation.module.scss';

type RotationState = 'serving' | 'reserve' | 'active' | 'cooling';

interface AccountRotationProps {
  /** Glance rows for the accounts to show. */
  rows: readonly GlanceRow[];
  now: number;
  /** Stable series number per account id, shared with the projection chart's line keys. */
  numbers: ReadonlyMap<string, number>;
  /** True when the hub routes reset-first, so the serving account is predictable. */
  resetFirst: boolean;
  formatTime: (timestamp: number) => string;
}

/** Providers with their own accent; anything else uses the panel's neutral ink. */
const BRANDED = new Set(['claude', 'codex', 'antigravity']);
const brandOf = (type: string) => (BRANDED.has(type) ? type : 'neutral');
/** The account's email reads better than its credential filename; fall back to the file. */
const displayName = (account: GlanceRow['account']) =>
  account.entry.file.email?.trim() || account.label;
const byReset = (a: GlanceRow, b: GlanceRow) =>
  (a.resetAtMs ?? Infinity) - (b.resetAtMs ?? Infinity);
const isCooling = (row: GlanceRow) =>
  Boolean(row.account.entry.file.unavailable) || row.remaining === 0;

/**
 * The account pool as one rotation, in the order the hub will use it: the serving account,
 * the reserve queue by soonest reset, then cooling accounts with the time they come back.
 */
export function AccountRotation({
  rows,
  now,
  numbers,
  resetFirst,
  formatTime,
}: AccountRotationProps) {
  const { t } = useTranslation();
  const cooling = rows.filter(isCooling).sort(byReset);
  const ready = rows.filter((row) => !isCooling(row)).sort(byReset);
  // Reset-first serves the available account whose window resets soonest.
  const servingId = resetFirst
    ? (ready.find((row) => row.remaining !== null)?.account.id ?? null)
    : null;
  const ordered = [...ready, ...cooling];
  const stateOf = (row: GlanceRow): RotationState =>
    isCooling(row)
      ? 'cooling'
      : row.account.id === servingId
        ? 'serving'
        : servingId
          ? 'reserve'
          : 'active';

  const counts = ordered.reduce<Record<RotationState, number>>(
    (acc, row) => ({ ...acc, [stateOf(row)]: acc[stateOf(row)] + 1 }),
    { serving: 0, reserve: 0, active: 0, cooling: 0 }
  );
  const nextBack = cooling.find((row) => row.resetAtMs !== null)?.resetAtMs ?? null;
  const summary = (['serving', 'reserve', 'active', 'cooling'] as const)
    .filter((state) => counts[state] > 0)
    .map((state) =>
      t(`redesign.dashboardQuota.rotation_summary_${state}`, { count: counts[state] })
    );

  return (
    <div className={styles.rotation}>
      <p className={styles.summary}>
        {summary.join(' · ')}
        {nextBack !== null && (
          <span className={styles.summaryBack}>
            {' '}
            {t('redesign.dashboardQuota.rotation_back_in', {
              duration: formatDuration(t, (nextBack - now) / 1000),
            })}
          </span>
        )}
      </p>
      <ul className={styles.list} aria-label={t('redesign.quota.glance_label')}>
        {ordered.map((row) => {
          const { account } = row;
          const state = stateOf(row);
          const remaining = row.remaining;
          const line = (
            <div
              className={`${styles.row} ${styles[brandOf(account.entry.type)]}`}
              data-state={state}
              aria-label={quotaAccountLabel(account, t)}
            >
              <span className={styles.state}>
                {state === 'cooling' ? (
                  <IconTimer size={iconSize['14']} aria-hidden="true" />
                ) : (
                  <span className={styles.dot} aria-hidden="true" />
                )}
                {row.stale
                  ? t('redesign.quota.stale')
                  : t(`redesign.dashboardQuota.rotation_${state}`)}
              </span>
              <span className={styles.who}>
                <span className={styles.provider}>
                  <span className={styles.number} aria-hidden="true">
                    {numbers.get(account.id) ?? ''}
                  </span>
                  {getTypeLabel(t, account.entry.type)}
                </span>
                <span className={styles.email} title={account.label}>
                  {displayName(account)}
                </span>
              </span>
              <span className={styles.meter} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ inlineSize: `${Math.max(0, Math.min(100, remaining ?? 0))}%` }}
                />
              </span>
              <span className={styles.left}>
                {remaining === null ? (
                  t('redesign.dashboardQuota.fare_not_measured')
                ) : (
                  <>
                    <strong>{Math.round(remaining)}%</strong>{' '}
                    {t('redesign.dashboardQuota.fare_left')}
                    {remaining < QUOTA_PROGRESS_MEDIUM_THRESHOLD && (
                      <span className={styles.low}> · {t('redesign.quota.low')}</span>
                    )}
                  </>
                )}
              </span>
              <span className={styles.reset}>
                {row.resetAtMs === null ? (
                  t('redesign.dashboardQuota.fare_reset_unknown')
                ) : (
                  <>
                    <span className={styles.resetIn}>
                      {state === 'cooling'
                        ? t('redesign.dashboardQuota.rotation_back_in', {
                            duration: formatDuration(t, (row.resetAtMs - now) / 1000),
                          })
                        : t('redesign.dashboardQuota.fare_in', {
                            duration: formatDuration(t, (row.resetAtMs - now) / 1000),
                          })}
                    </span>
                    <span className={styles.resetAt}>
                      {t('redesign.dashboardQuota.fare_resets', {
                        time: formatTime(row.resetAtMs),
                      })}
                    </span>
                  </>
                )}
              </span>
            </div>
          );
          return (
            <li key={account.id}>
              {state === 'serving' ? <Flair variant="line">{line}</Flair> : line}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
