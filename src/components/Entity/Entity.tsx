import {
    forwardRef,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Entity.module.css';

/* ------------------------------------------------------------------ */
/*  Entity                                                             */
/* ------------------------------------------------------------------ */

/** Root tag rendered by `Entity` — verified Show-code usages only. */
export type EntityAs = 'li' | 'button';

export interface EntityProps extends HTMLAttributes<HTMLElement> {
    /**
     * Root tag. `'li'` (default) for a static/descriptive row — works
     * standalone or inside `EntityList`. `'button'` makes the whole row a
     * clickable control (see the List-and-Checkbox example).
     */
    as?: EntityAs;

    /** Leading node in the left column (e.g. an `Avatar` or `Checkbox`). */
    left?: ReactNode;

    /** Trailing node in the right column (e.g. a `Button` or plain text). Only rendered when set. */
    right?: ReactNode;

    /** Extra className merged onto the left column. */
    leftClassName?: string;

    /** Extra className merged onto the right column. */
    rightClassName?: string;

    /** Content of the left column — typically one or more `EntityContent`, or arbitrary nodes (e.g. a `Skeleton` stack while loading). */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/**
 * Displays up to two columns of content: a left column (arbitrary content —
 * an identifier plus descriptive text) and an optional right column
 * (controls/actions related to that content).
 *
 * Rendered DOM (Geist production / geistcn structure):
 * ```html
 * <li class="entity">
 *   <section class="section">
 *     <div class="left">{left}{children}</div>
 *     <div class="right">{right}</div>   <!-- only when `right` is set -->
 *   </section>
 * </li>
 * ```
 * `as="button"` renders the same structure as a `<button>` with the
 * interactive row treatment (full width, hover fill, color transition).
 *
 * Usually wrapped in `EntityList` for a bordered/shadowed card of rows, but
 * also renders correctly standalone (Default example has no `EntityList`).
 */
const Entity = forwardRef<HTMLLIElement | HTMLButtonElement, EntityProps>(
    (
        {
            as = 'li',
            left,
            right,
            leftClassName,
            rightClassName,
            className,
            children,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const row = (
            <section className={styles.section}>
                <div className={cn(styles.left, leftClassName)}>
                    {left}
                    {children}
                </div>
                {right != null && (
                    <div className={cn(styles.right, rightClassName)}>
                        {right}
                    </div>
                )}
            </section>
        );

        if (as === 'button') {
            return (
                <button
                    {...(rest as HTMLAttributes<HTMLButtonElement>)}
                    ref={ref as Ref<HTMLButtonElement>}
                    className={cn('oxobz-reset', styles.entity, styles.button, className)}
                    data-oxobz-entity=""
                    data-version={dataVersion}
                >
                    {row}
                </button>
            );
        }

        return (
            <li
                {...(rest as HTMLAttributes<HTMLLIElement>)}
                ref={ref as Ref<HTMLLIElement>}
                className={cn(styles.entity, className)}
                data-oxobz-entity=""
                data-version={dataVersion}
            >
                {row}
            </li>
        );
    },
);

Entity.displayName = 'Entity';

/* ------------------------------------------------------------------ */
/*  EntityContent                                                      */
/* ------------------------------------------------------------------ */

export interface EntityContentProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Primary label (rendered bold). */
    title?: ReactNode;

    /** Secondary/muted text below (or in place of) the title. */
    description?: ReactNode;

    /**
     * Grows this content block to consume the remaining row width. Use on
     * exactly one `EntityContent` when an `Entity` holds more than one (see
     * the Fill example) — the other(s) then shrink to fit their own text.
     */
    fill?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/**
 * A title/description pair for use inside `Entity`'s left column (or, with
 * `fill`, spread across several columns of one row).
 *
 * Rendered DOM:
 * ```html
 * <div class="content [contentFill]">
 *   <div class="inner">
 *     <p class="title">{title}</p>             <!-- only when `title` is set -->
 *     <p class="description">{description}</p> <!-- only when `description` is set -->
 *   </div>
 * </div>
 * ```
 */
const EntityContent = forwardRef<HTMLDivElement, EntityContentProps>(
    (
        {
            title,
            description,
            fill = false,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <div
                {...rest}
                ref={ref}
                className={cn(styles.content, fill && styles.contentFill, className)}
                data-oxobz-entity-content=""
                data-version={dataVersion}
            >
                <div className={styles.inner}>
                    {title != null && (
                        <p className={cn('text-copy-14', styles.title)}>{title}</p>
                    )}
                    {description != null && (
                        <p className={cn('text-copy-14', styles.description)}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
        );
    },
);

EntityContent.displayName = 'EntityContent';

/* ------------------------------------------------------------------ */
/*  EntityList                                                         */
/* ------------------------------------------------------------------ */

export interface EntityListProps extends HTMLAttributes<HTMLUListElement> {
    /** One or more `Entity` rows. */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/**
 * Wraps `Entity` rows in a bordered, shadowed, rounded card — dividers are
 * drawn between rows automatically (last row keeps no border).
 *
 * Rendered DOM:
 * ```html
 * <ul class="list" data-oxobz-entity-list="" data-version="v1">
 *   {children /* Entity rows *\/}
 * </ul>
 * ```
 */
const EntityList = forwardRef<HTMLUListElement, EntityListProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => {
        return (
            <ul
                {...rest}
                ref={ref}
                className={cn(styles.list, className)}
                data-oxobz-entity-list=""
                data-version={dataVersion}
            >
                {children}
            </ul>
        );
    },
);

EntityList.displayName = 'EntityList';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

/**
 * Geist's own Show-code always imports these three as flat siblings
 * (`import { Entity, EntityContent, EntityList } from '@vercel/geistcn/components'`)
 * — never as `Entity.Content` / `Entity.List`. Both `EntityContent` and
 * `EntityList` are exported flatly to match that exactly; the `.Content` /
 * `.List` aliases below are an additional, non-breaking convenience
 * (workspace convention: compound via `Object.assign`).
 */
const EntityNamespace = Object.assign(Entity, {
    Content: EntityContent,
    List: EntityList,
});

export { EntityNamespace as Entity, EntityContent, EntityList };
