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
     * CTA label. Only shown in the wide (desktop) layout — on narrow
     * screens the whole banner collapses into a single pill whose label
     * is `children` (see banner.html "Default" example).
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
 * Rendered DOM (verified against banner.html, "Default" example):
 * ```html
 * <div class="banner" data-oxobz-banner="" data-version="v1">
 *   <div class="scroll">
 *     <div class="content">
 *       <!-- narrow screens: whole message becomes the CTA label -->
 *       <a class="mobileCta">{children}<ChevronRightSmall /></a>
 *       <!-- wide screens: message text + separate CTA -->
 *       <div class="message">
 *         <p>{children}</p>
 *         <a>{button.content}<ChevronRightSmall /></a>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * Only the "Default" example (neutral message + optional link CTA) is
 * present in the captured snapshot — no color/type variant (info/warning)
 * or dismiss button exist in banner.html's DOM or Show-code JSX, so none
 * are implemented here (see component report / needsRecapture).
 */
const Banner = forwardRef<HTMLDivElement, BannerProps>(
    (
        { button, children, className, 'data-version': dataVersion = 'v1', ...rest },
        ref,
    ) => {
        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.banner, className)}
                data-oxobz-banner=""
                data-version={dataVersion}
            >
                <div className={styles.scroll}>
                    <div className={styles.content}>
                        {button && (
                            <ButtonLink
                                href={button.href}
                                variant="secondary"
                                size="small"
                                shape="rounded"
                                suffix={<ChevronRightSmall />}
                                className={styles.mobileCta}
                            >
                                {children}
                            </ButtonLink>
                        )}
                        <div className={cn(styles.message, !button && styles.solo)}>
                            <p className={cn('text-copy-16', styles.text)}>{children}</p>
                            {button && (
                                <ButtonLink
                                    href={button.href}
                                    variant="secondary"
                                    size="small"
                                    shape="rounded"
                                    suffix={<ChevronRightSmall />}
                                >
                                    {button.content}
                                </ButtonLink>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

Banner.displayName = 'Banner';

export { Banner };
