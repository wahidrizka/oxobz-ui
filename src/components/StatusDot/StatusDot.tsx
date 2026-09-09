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
}

/* ------------------------------------------------------------------ */
/*  Per-state presentation                                             */
/* ------------------------------------------------------------------ */

/**
 * Measured live at vercel.com/geist/status-dot (9 Sep 2026):
 *  - name    → aria-label and the optional visible label (sentence-cased)
 *  - message → appended to titlePrefix to form the title
 *  - color   → dot color class; QUEUED / CANCELED / DELETED keep the default
 *              gray dot (var(--accents-2)).
 *
 * DELETED is in the documented vocabulary but absent from the live demo; its
 * message follows the "was <past-tense>." pattern of CANCELED.
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
 * Rendered DOM measured live (geistcn):
 * ```html
 * <span aria-label="Queued" class="inline-flex items-center"
 *       title="This deployment is queued." data-testid="geistcn/status-dot">
 *   <span class="inline-block size-2.5 rounded-full bg-[var(--accents-2)]"></span>
 *   <span class="text-label-14 ml-2 leading-[16px]">Queued</span>  <!-- only with label -->
 * </span>
 * ```
 * No `data-oxobz-*` / `data-version` marker. The dot does NOT animate: the live
 * dots carry only `inline-block size-2.5 rounded-full bg-[...]` with no
 * animation class for any state (the docs "Behavior" prose still mentions a
 * pulse, but the current geistcn dot is static). data-testid kept verbatim.
 */
const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
    (
        {
            state,
            label = false,
            titlePrefix = 'This deployment',
            className,
            ...rest
        },
        ref,
    ) => {
        const { name, message, color } = STATE_CONFIG[state];

        return (
            <span
                {...rest}
                ref={ref}
                aria-label={name}
                title={`${titlePrefix} ${message}`}
                data-testid="geistcn/status-dot"
                className={cn(styles.wrapper, className)}
            >
                <span className={cn(styles.status, color && styles[color])} />
                {label && (
                    <span className={cn('text-label-14', styles.statusLabel)}>{name}</span>
                )}
            </span>
        );
    },
);

StatusDot.displayName = 'StatusDot';

export { StatusDot };
