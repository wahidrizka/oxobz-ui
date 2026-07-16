import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './StatusDot.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Deployment lifecycle state (StatusDotStates in the Geist docs).
 * The dot is scoped to deployment status only — for other statuses use a
 * Badge instead of repurposing the dot (status-dot.md, "When to use").
 */
export type StatusDotState =
    | 'QUEUED'
    | 'BUILDING'
    | 'READY'
    | 'ERROR'
    | 'CANCELED'
    | 'DELETED';

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    /** Deployment lifecycle state driving color, title, and aria-label. */
    state: StatusDotState;

    /**
     * Render the sentence-cased state name next to the dot. Use only when
     * the dot stands alone without surrounding text (default: false).
     */
    label?: boolean;

    /**
     * Noun phrase used to compose the `title` attribute. Default
     * `"This deployment"` → e.g. "This deployment is queued.". In lists,
     * pass the entity (e.g. `"vercel-site production"`).
     */
    titlePrefix?: string;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Per-state presentation                                             */
/* ------------------------------------------------------------------ */

/**
 * Verified against status-dot.html:
 *  - name    → aria-label and the optional visible label (sentence-cased)
 *  - message → appended to titlePrefix to form the title
 *  - color   → dot color class; omitted states keep the default gray dot
 *              (var(--accents-2)): QUEUED, CANCELED, DELETED.
 *
 * DELETED belongs to the documented state vocabulary but is absent from the
 * snapshot; its message follows the "was <past-tense>." pattern of CANCELED.
 */
const STATE_CONFIG: Record<
    StatusDotState,
    { name: string; message: string; color?: 'ready' | 'error' | 'building' }
> = {
    QUEUED: { name: 'Queued', message: 'is queued.' },
    BUILDING: { name: 'Building', message: 'is building.', color: 'building' },
    READY: { name: 'Ready', message: 'is ready.', color: 'ready' },
    ERROR: { name: 'Error', message: 'had an error.', color: 'error' },
    CANCELED: { name: 'Canceled', message: 'was canceled.' },
    DELETED: { name: 'Deleted', message: 'was deleted.' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display an indicator of deployment status.
 *
 * Rendered DOM (Geist production / geistcn structure):
 * ```html
 * <span class="wrapper" aria-label="Queued"
 *       title="This deployment is queued."
 *       data-oxobz-status-dot="" data-version="v1">
 *   <span class="status"></span>
 *   <span class="statusLabel">Queued</span>   <!-- only when label -->
 * </span>
 * ```
 *
 * Note: the snapshot renders every state statically. The docs "Behavior"
 * prose describes an animated dot for BUILDING/QUEUED, but neither the
 * snapshot nor the status-dot-module chunk ships a pulse, so none is added.
 */
const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
    (
        {
            state,
            label = false,
            titlePrefix = 'This deployment',
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const { name, message, color } = STATE_CONFIG[state];

        return (
            <span
                {...rest}
                className={cn(styles.wrapper, className)}
                aria-label={name}
                title={`${titlePrefix} ${message}`}
                data-oxobz-status-dot=""
                data-version={dataVersion}
                ref={ref}
            >
                <span className={cn(styles.status, color && styles[color])} />
                {label && <span className={styles.statusLabel}>{name}</span>}
            </span>
        );
    },
);

StatusDot.displayName = 'StatusDot';

export { StatusDot };
