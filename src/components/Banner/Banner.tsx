import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronRightSmall } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { ButtonLink } from '../Button';
import styles from './Banner.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Optional call-to-action rendered by the Banner (Show-code `button` prop). */
export interface BannerButton {
    /** Link destination. */
    href: string;
    /**
     * CTA label. Only shown in the wide (desktop) layout. On narrow screens
     * the whole banner collapses into a single pill whose label is
     * `children` (live "Default" example, 9 Aug 2026).
     */
    content: string;
}

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
    /** Optional CTA link. Omit to render the message alone (no link). */
    button?: BannerButton;

    /** Banner message. May contain a leading `<b>` for emphasis. */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A prominent message that spans the full width of its container to
 * announce important information (geistcn `Banner`).
 *
 * Rendered DOM, verified against the LIVE page (9 Aug 2026). Banner emits
 * exactly TWO sibling elements and no wrapper of its own:
 * ```html
 * <!-- narrow screens: whole message becomes the CTA label -->
 * <a class="mobileCta">{children}<ChevronRightSmall /></a>
 * <!-- wide screens: message text + separate CTA -->
 * <div class="message">
 *   <p>{children}</p>
 *   <a>{button.content}<ChevronRightSmall /></a>
 * </div>
 * ```
 * The border, background, rounded corners, scroll wrapper and 24px padding
 * this component used to render were the docs page's demo frame, not part of
 * Banner. They were removed once the live DOM was read directly.
 *
 * `className` and any extra props land on the message row, which is where
 * production puts them (its example passes `className="p-4"`).
 *
 * Only the "Default" example (neutral message plus optional link CTA) exists
 * in production: there is no colour or type variant and no dismiss button, so
 * none are implemented here.
 */
const Banner = forwardRef<HTMLDivElement, BannerProps>(
    (
        { button, children, className, 'data-version': dataVersion = 'v1', ...rest },
        ref,
    ) => {
        const cta = button ? (
            <ButtonLink
                href={button.href}
                variant="secondary"
                size="small"
                shape="rounded"
                shadow
                suffix={<ChevronRightSmall />}
            >
                {button.content}
            </ButtonLink>
        ) : null;

        return (
            <>
                {button && (
                    <ButtonLink
                        href={button.href}
                        variant="secondary"
                        size="small"
                        shape="rounded"
                        shadow
                        suffix={<ChevronRightSmall />}
                        className={styles.mobileCta}
                    >
                        {children}
                    </ButtonLink>
                )}
                <div
                    {...rest}
                    ref={ref}
                    className={cn(styles.message, !button && styles.solo, className)}
                    data-oxobz-banner=""
                    data-version={dataVersion}
                >
                    <p className={cn('text-copy-16', styles.text)}>{children}</p>
                    {cta}
                </div>
            </>
        );
    },
);

Banner.displayName = 'Banner';

export { Banner };
