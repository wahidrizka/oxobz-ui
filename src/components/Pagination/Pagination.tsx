import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Pagination.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * A single sibling-page link. `title` is the destination page name
 * (e.g. "Environment Variables"); Geist renders the "Previous"/"Next"
 * label, the chevron, and the "Go to {direction} page: {title}" aria
 * label — do not prepend arrows or "Go to".
 */
export interface PaginationLink {
    /** Destination page name shown on the rail (Title Case, kept short). */
    title: string;

    /** URL of the sibling page. */
    href: string;
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
    /**
     * Previous (earlier) sibling page. Omit at the start of a sequence —
     * hide the slot instead of disabling it (Geist best practice).
     */
    previous?: PaginationLink;

    /**
     * Next (later) sibling page. Omit at the end of a sequence — hide the
     * slot instead of disabling it (Geist best practice).
     */
    next?: PaginationLink;

    /**
     * Content for the centered slot (out of flow, hidden below 1200px).
     * Undocumented by Geist but always present in the production DOM.
     */
    children?: ReactNode;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Internal slot                                                      */
/* ------------------------------------------------------------------ */

/**
 * One directional link. The chevron sits in the padding gutter
 * (left for previous, right for next) via absolute positioning.
 */
function PaginationSlot({
    direction,
    link,
}: {
    direction: 'previous' | 'next';
    link: PaginationLink;
}) {
    const isNext = direction === 'next';

    return (
        <a
            aria-label={`Go to ${direction} page: ${link.title}`}
            className={cn(styles.item, isNext && styles['align-right'])}
            href={link.href}
        >
            <span className={styles.label}>{isNext ? 'Next' : 'Previous'}</span>
            <div className={styles.title}>
                <span>{link.title}</span>
                <span className={styles.icon}>
                    {isNext ? (
                        <ChevronRight size={20} />
                    ) : (
                        <ChevronLeft size={20} />
                    )}
                </span>
            </div>
        </a>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Navigate to the previous or next page (sequential sibling navigation).
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <nav aria-label="pagination" class="pagination"
 *      data-oxobz-pagination="" data-version="v1">
 *   <a class="item" aria-label="Go to previous page: {title}" href="{href}">
 *     <span class="label">Previous</span>
 *     <div class="title"><span>{title}</span><span class="icon">…</span></div>
 *   </a>
 *   <div class="children">{children}</div>
 *   <a class="item align-right" aria-label="Go to next page: {title}" href="{href}">
 *     <span class="label">Next</span>
 *     <div class="title"><span>{title}</span><span class="icon">…</span></div>
 *   </a>
 * </nav>
 * ```
 */
const Pagination = forwardRef<HTMLElement, PaginationProps>(
    (
        {
            children,
            className,
            next,
            previous,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <nav
                {...rest}
                aria-label="pagination"
                className={cn(styles.pagination, className)}
                data-oxobz-pagination=""
                data-version={dataVersion}
                ref={ref}
            >
                {previous && (
                    <PaginationSlot direction="previous" link={previous} />
                )}
                <div className={styles.children}>{children}</div>
                {next && <PaginationSlot direction="next" link={next} />}
            </nav>
        );
    },
);

Pagination.displayName = 'Pagination';

export { Pagination };
