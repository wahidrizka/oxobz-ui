'use client';

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
export type BreadcrumbType = 'text' | 'menu';

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
    /** Trail style — text separators or menu pills. Default: 'text'. */
    type?: BreadcrumbType;


    /** Breadcrumb.Item children. */
    children?: ReactNode;
}

export interface BreadcrumbItemProps extends HTMLAttributes<HTMLElement> {
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

interface BreadcrumbContextValue {
    variant: BreadcrumbType;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

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
 *   Dashboard
 *   <svg aria-hidden="true">…chevron…</svg>  <!-- hidden on the last item -->
 * </li>
 *
 * <!-- menu variant -->
 * <button type="button" class="menuItem [active] [disabled]" disabled>
 *   Dashboard
 * </button>
 * ```
 */
const BreadcrumbItem = forwardRef<HTMLElement, BreadcrumbItemProps>(
    (
        { href, active = false, disabled = false, className, children, onClick, ...rest },
        ref,
    ) => {
        const ctx = useContext(BreadcrumbContext);
        if (!ctx) {
            throw new Error('Breadcrumb.Item must be used within a Breadcrumb');
        }

        // Production renders the label as a raw text node directly inside the
        // <li>/<button> (no wrapper span) — matching the snapshot exactly keeps
        // the chevron and text on the same flex baseline (align-items: center).
        const label = children;

        if (ctx.variant === 'menu') {
            /*
             * Produksi membungkus tiap pil dua lapis:
             *   <span …trigger><div><button …/></div></span>
             * Lapisan itu bukan hiasan. Tanpa keduanya tombol menjadi anak
             * langsung wadah flex, sehingga browser mem-"blockify"-nya: display
             * berubah inline-block -> block dan baris jadi 22px, bukan 24px
             * seperti produksi. Dengan <div> di tengah, tombol tetap inline dan
             * menghasilkan kotak baris setinggi line-height induknya.
             *
             * Di produksi span itu juga pemicu Tooltip. Sudah diperiksa dengan
             * mengarahkan tetikus ke pil di halaman live: tidak ada tooltip yang
             * muncul, karena teksnya tidak terpotong. Jadi di sini perannya
             * murni struktural.
             */
            return (
                /*
                 * Atributnya disalin dari produksi: span ini pemicu Tooltip,
                 * membawa data-testid="legacy/tooltip-trigger", data-version,
                 * dan tabindex="0". Yang terakhir bukan sekadar penanda, ia
                 * membuat butir ini bisa dijangkau papan ketik.
                 */
                <span
                    className={styles.menuTrigger}
                    data-testid="legacy/tooltip-trigger"
                    data-version="v1"
                    tabIndex={0}
                >
                    <div>
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
                            disabled={disabled}
                            onClick={onClick}
                            type="button"
                        >
                            {label}
                        </button>
                    </div>
                </span>
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

BreadcrumbItem.displayName = 'Breadcrumb.Item';

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
const BreadcrumbRoot = forwardRef<HTMLElement, BreadcrumbProps>(
    (
        { type: variant = 'text', className, children, ...rest },
        ref,
    ) => {
        /*
         * Varian menu TIDAK dibungkus <nav>.
         *
         * Terukur di halaman Breadcrumbs live 30 Agu 2026: varian teks
         * memakai <nav aria-label="Breadcrumb"> berisi <ol>, sedangkan varian
         * menu cuma satu <div class="flex gap-2 ..."> yang langsung berisi
         * pemicu-pemicunya. Membungkusnya dengan <nav> membuat satu tingkat
         * berlebih dan seluruh cabang di bawahnya tidak berpasangan saat
         * dibandingkan.
         */
        if (variant === 'menu') {
            return (
                <BreadcrumbContext.Provider value={{ variant }}>
                    <div
                        {...rest}
                        ref={ref as Ref<HTMLDivElement>}
                        className={cn(styles.menuWrapper, className)}
                    >
                        {children}
                    </div>
                </BreadcrumbContext.Provider>
            );
        }

        return (
            <BreadcrumbContext.Provider value={{ variant }}>
                <nav
                    {...rest}
                    ref={ref}
                    aria-label="Breadcrumb"
                    className={cn(className)}
                    /* TANPA penanda komponen: nav produksi cuma membawa
                       aria-label dan kelasnya (terukur 30 Agu 2026). */
                >
                    <ol className={styles.ol}>{children}</ol>
                </nav>
            </BreadcrumbContext.Provider>
        );
    },
);

BreadcrumbRoot.displayName = 'Breadcrumb';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Breadcrumb = Object.assign(BreadcrumbRoot, {
    Item: BreadcrumbItem,
});

export { Breadcrumb, BreadcrumbItem };
