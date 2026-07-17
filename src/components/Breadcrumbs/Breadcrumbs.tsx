import {
    createContext,
    forwardRef,
    useContext,
    type HTMLAttributes,
    type MouseEventHandler,
    type ReactNode,
    type Ref,
} from 'react';
import { ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Breadcrumbs.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Visual style of the trail (breadcrumbs-module__S3JLGq__):
 * - `text`: plain-text crumbs joined by a chevron separator (default).
 * - `menu`: a row of pill buttons, no separators.
 */
export type BreadcrumbsVariant = 'text' | 'menu';

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
    /** Trail style — text separators or menu pills. Default: 'text'. */
    variant?: BreadcrumbsVariant;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;

    /** Breadcrumbs.Item children. */
    children?: ReactNode;
}

export interface BreadcrumbsItemProps extends HTMLAttributes<HTMLElement> {
    /**
     * Destination URL. When set (and the item isn't disabled), the label
     * renders as an `<a>`. Text variant only — the menu variant is always
     * a `<button>` (Geist never wires menu pills to `href`).
     */
    href?: string;

    /**
     * Marks this item as the current page. Text variant: sets
     * `aria-current="true"` (verbatim Geist value, not "page") plus the
     * "active" color. Menu variant: sets the "active" pill style.
     */
    active?: boolean;

    /** Disables interaction: no link/button behavior, muted color, no hover. */
    disabled?: boolean;

    /** Click handler, forwarded to the rendered `<a>` / `<button>` / `<li>`. */
    onClick?: MouseEventHandler<HTMLElement>;

    children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface BreadcrumbsContextValue {
    variant: BreadcrumbsVariant;
}

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Breadcrumbs.Item                                                   */
/* ------------------------------------------------------------------ */

/**
 * A single crumb inside a Breadcrumbs trail.
 *
 * Rendered DOM (Geist production structure, breadcrumbs-module__S3JLGq__):
 * ```html
 * <!-- text variant -->
 * <li class="textItem [active] [disabled]" [aria-current="true"]>
 *   <span class="breadcrumbWrapper">Dashboard</span>
 *   <svg aria-hidden="true">…chevron…</svg>  <!-- hidden on the last item -->
 * </li>
 *
 * <!-- menu variant -->
 * <button type="button" class="menuItem [active] [disabled]" disabled>
 *   <span class="breadcrumbWrapper">Dashboard</span>
 * </button>
 * ```
 */
const BreadcrumbsItem = forwardRef<HTMLElement, BreadcrumbsItemProps>(
    (
        { href, active = false, disabled = false, className, children, onClick, ...rest },
        ref,
    ) => {
        const ctx = useContext(BreadcrumbsContext);
        if (!ctx) {
            throw new Error('Breadcrumbs.Item must be used within a Breadcrumbs');
        }

        const label = <span className={styles.breadcrumbWrapper}>{children}</span>;

        if (ctx.variant === 'menu') {
            return (
                <button
                    {...rest}
                    ref={ref as Ref<HTMLButtonElement>}
                    aria-current={active || undefined}
                    className={cn(
                        styles.menuItem,
                        active && styles.active,
                        disabled && styles.disabled,
                        className,
                    )}
                    data-oxobz-breadcrumbs-item=""
                    disabled={disabled}
                    onClick={onClick}
                    type="button"
                >
                    {label}
                </button>
            );
        }

        return (
            <li
                {...rest}
                ref={ref as Ref<HTMLLIElement>}
                aria-current={active || undefined}
                className={cn(
                    styles.textItem,
                    active && styles.active,
                    disabled && styles.disabled,
                    className,
                )}
                data-oxobz-breadcrumbs-item=""
                onClick={disabled ? undefined : onClick}
            >
                {href && !disabled ? (
                    <a className="oxobz-reset" href={href}>
                        {label}
                    </a>
                ) : (
                    label
                )}
                <ChevronRight aria-hidden="true" size={16} />
            </li>
        );
    },
);

BreadcrumbsItem.displayName = 'Breadcrumbs.Item';

/* ------------------------------------------------------------------ */
/*  Breadcrumbs (root)                                                 */
/* ------------------------------------------------------------------ */

/**
 * Display the user's location within a site's hierarchy.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <nav aria-label="Breadcrumb" data-oxobz-breadcrumbs="" data-variant="text"
 *      data-version="v1">
 *   <ol class="ol"><!-- Breadcrumbs.Item children --></ol>
 * </nav>
 * ```
 * The `menu` variant swaps the `<ol>` for a `<div class="menuWrapper">` —
 * `Breadcrumbs.Item` itself switches between `<li>` and `<button>` based on
 * the variant read from context.
 */
const BreadcrumbsRoot = forwardRef<HTMLElement, BreadcrumbsProps>(
    (
        { variant = 'text', className, children, 'data-version': dataVersion = 'v1', ...rest },
        ref,
    ) => {
        return (
            <BreadcrumbsContext.Provider value={{ variant }}>
                <nav
                    {...rest}
                    ref={ref}
                    aria-label="Breadcrumb"
                    className={cn(className)}
                    data-oxobz-breadcrumbs=""
                    data-variant={variant}
                    data-version={dataVersion}
                >
                    {variant === 'menu' ? (
                        <div className={styles.menuWrapper}>{children}</div>
                    ) : (
                        <ol className={styles.ol}>{children}</ol>
                    )}
                </nav>
            </BreadcrumbsContext.Provider>
        );
    },
);

BreadcrumbsRoot.displayName = 'Breadcrumbs';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
    Item: BreadcrumbsItem,
});

export { Breadcrumbs, BreadcrumbsItem };
