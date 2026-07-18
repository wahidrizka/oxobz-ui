import {
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './ProjectBanner.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Severity of the project-wide condition being communicated
 * (ProjectBannerProps['variant'] in the Geist docs). Omit for the neutral
 * gray look used when no `variant` is passed in the "Default" example.
 */
export type ProjectBannerVariant = 'default' | 'success' | 'warning' | 'error';

/**
 * The single resolving action of the banner (project-banner.html, "Behavior":
 * "Always pass a callToAction that resolves the state."). Pass `href` to
 * render an anchor (Default/Success/Error examples) or `onClick` to render a
 * button (Warning example, "Undo Rollback"). Both may be supplied together.
 */
export interface ProjectBannerCallToAction {
    /** Text of the underlined call-to-action. */
    label: ReactNode;

    /** Destination URL — renders the action as an `<a>`. */
    href?: string;

    /** Click handler — renders the action as a `<button type="button">` when no `href` is given. */
    onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

export interface ProjectBannerProps
    extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** Severity driving the color of text, background, and border. Default: `'default'`. */
    variant?: ProjectBannerVariant;

    /** Icon shown at 16x16 before the message; always from `@oxobz/icons`. */
    icon?: ReactNode;

    /** The banner message. */
    label: ReactNode;

    /** The single resolving action (see "Behavior" — a banner should always have one). */
    callToAction?: ProjectBannerCallToAction;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Per-variant focus-ring accent                                      */
/* ------------------------------------------------------------------ */

/**
 * Verified against project-banner.html: every example sets
 * `--banner-focus-color` inline on the call-to-action. Default and Success
 * both use `--ds-blue-600` (ProjectBanner has no distinct "success" hue —
 * it reuses the blue family for the informational state); Warning and Error
 * use their own `-700` accent instead.
 */
const FOCUS_COLOR: Record<ProjectBannerVariant, string> = {
    default: 'var(--ds-blue-600)',
    success: 'var(--ds-blue-600)',
    warning: 'var(--ds-amber-700)',
    error: 'var(--ds-red-700)',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Used for temporary, project-wide notifications that require resolution
 * (project-banner.html, intro copy).
 *
 * Rendered DOM (Geist production / geistcn structure):
 * ```html
 * <aside class="banner [variant]" data-oxobz-project-banner="" data-version="v1">
 *   <div class="inner">
 *     <div class="message">
 *       <div aria-hidden="true" class="icon">…svg…</div>
 *       <p>{label}</p>
 *     </div>
 *     <div class="ctaWrap">
 *       <a class="cta" href={href} style="--banner-focus-color: ...">{label}</a>
 *       <!-- or <button class="cta" type="button"> when no href -->
 *     </div>
 *   </div>
 * </aside>
 * ```
 *
 * Non-dismissible by design (project-banner.html, "Behavior": "If the
 * message can be dismissed without resolving the underlying state, it isn't
 * banner-worthy") — there is intentionally no close/dismiss affordance.
 */
const ProjectBanner = forwardRef<HTMLElement, ProjectBannerProps>(
    (
        {
            callToAction,
            className,
            icon,
            label,
            variant = 'default',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const focusColor = FOCUS_COLOR[variant];

        return (
            <aside
                {...rest}
                className={cn(styles.banner, styles[variant], className)}
                data-oxobz-project-banner=""
                data-version={dataVersion}
                ref={ref}
            >
                <div className={styles.inner}>
                    <div className={styles.message}>
                        {icon && (
                            <div aria-hidden="true" className={styles.icon}>
                                {icon}
                            </div>
                        )}
                        <p className={styles.text}>{label}</p>
                    </div>
                    {callToAction && (
                        <div className={styles.ctaWrap}>
                            {callToAction.href ? (
                                <a
                                    className={styles.cta}
                                    href={callToAction.href}
                                    onClick={callToAction.onClick}
                                    style={
                                        {
                                            '--banner-focus-color': focusColor,
                                        } as CSSProperties
                                    }
                                >
                                    {callToAction.label}
                                </a>
                            ) : (
                                <button
                                    className={styles.cta}
                                    onClick={callToAction.onClick}
                                    style={
                                        {
                                            '--banner-focus-color': focusColor,
                                        } as CSSProperties
                                    }
                                    type="button"
                                >
                                    {callToAction.label}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        );
    },
);

ProjectBanner.displayName = 'ProjectBanner';

export { ProjectBanner };
