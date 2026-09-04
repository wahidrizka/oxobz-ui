'use client';

import React, { forwardRef, CSSProperties } from 'react';
import { LogoVercel } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { DefaultMark } from './DefaultMark';
import styles from './Book.module.css';

/**
 * Responsive width map. Each key maps to a breakpoint custom property
 * consumed by the production media queries:
 * - `xs`  → `--xs-book-width`  (max-width: 400px)
 * - `sm`  → `--sm-book-width`  (401px – 600px)
 * - `smd` → `--smd-book-width` (601px – 768px)
 * - `md`  → `--md-book-width`  (769px – 960px)
 * - `lg`  → `--lg-book-width`  (min-width: 961px)
 */
export interface BookResponsiveWidth {
    xs?: number;
    sm?: number;
    smd?: number;
    md?: number;
    lg?: number;
}

export interface BookProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Visual variant.
     * - `stripe`: colored stripe header at top + icon at bottom
     * - `simple`: illustration inside content area
     * @default 'stripe'
     */
    variant?: 'stripe' | 'simple';

    /**
     * Book cover color string (any valid CSS color).
     * Applied as `--book-color`.
     * Stripe variant defaults to `var(--ds-amber-600)`.
     * Simple variant defaults to no color (inherits `--ds-gray-200`).
     */
    color?: string;

    /**
     * Text color on top of the cover (for colored books).
     * Applied as `--book-text-color`.
     * @default 'var(--ds-gray-1000)'
     */
    textColor?: string;

    /**
     * Book width. Either a fixed pixel value (unitless number, applied as
     * `--book-width`) or a responsive map resolved per breakpoint.
     * @default 196
     */
    width?: number | BookResponsiveWidth;

    /**
     * Book title displayed on the cover.
     */
    title: string;

    /**
     * Custom illustration rendered inside the book:
     * - stripe variant: inside the top stripe area
     * - simple variant: inside the content area (below title)
     */
    illustration?: React.ReactNode;

    /**
     * Icon rendered at the bottom of the content (stripe variant only).
     * @default <LogoVercel size={16} />
     */
    icon?: React.ReactNode;

    /**
     * Whether to apply the textured pages and overlay.
     * @default false
     */
    textured?: boolean;
}

/**
 * Resolve the `width` prop into the matching CSS custom properties.
 * A number sets the fixed `--book-width`; a responsive map sets one
 * `--<bp>-book-width` per provided breakpoint (and leaves `--book-width`
 * for the media queries to fill in).
 */
function resolveWidthStyle(width: number | BookResponsiveWidth): CSSProperties {
    if (typeof width === 'number') {
        return { '--book-width': width } as CSSProperties;
    }
    return {
        ...(width.xs != null ? { '--xs-book-width': width.xs } : {}),
        ...(width.sm != null ? { '--sm-book-width': width.sm } : {}),
        ...(width.smd != null ? { '--smd-book-width': width.smd } : {}),
        ...(width.md != null ? { '--md-book-width': width.md } : {}),
        ...(width.lg != null ? { '--lg-book-width': width.lg } : {}),
    } as CSSProperties;
}

/**
 * Book component — 100% consistent with production.
 */
export const Book = forwardRef<HTMLDivElement, BookProps>(
    (
        {
            variant = 'stripe',
            color,
            textColor,
            width = 196,
            title,
            illustration,
            icon,
            textured = false,
            className,
            style,
            ...props
        },
        ref,
    ) => {
        // Production behavior: stripe default = amber, simple default = no color
        const effectiveColor =
            color ?? (variant === 'stripe' ? 'var(--ds-amber-600)' : undefined);
        const hasColor = Boolean(effectiveColor);

        // Texture rotation, derived EXACTLY as production does it. Read from the
        // production bundle (chunk 3wum1c4xndz20.js, Book component):
        //   d = textured && (() => { let t = 0;
        //     for (const ch of title) { t = (t << 5) - t + ch.charCodeAt(0); t &= t; }
        //     return (t & 1) === 1; })()
        //   <div className={texture} style={{ transform: d ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        // It is a 32-bit string hash of the TITLE: odd hash -> 180deg, even -> 0deg.
        // This replaces an earlier useId-based guess. Verified on the live Book
        // page: every textured demo (all share one title) renders rotate(180deg).
        let titleHash = 0;
        for (let i = 0; i < title.length; i += 1) {
            titleHash = (titleHash << 5) - titleHash + title.charCodeAt(i);
            titleHash &= titleHash;
        }
        const textureRotation = textured && (titleHash & 1) === 1 ? 180 : 0;

        // Width vars live on the root .perspective element (matches production).
        const perspectiveStyle: CSSProperties = {
            ...style,
            ...resolveWidthStyle(width),
        };

        // Color vars live on the .rotate-wrapper element (matches production).
        const wrapperStyle: CSSProperties = {
            ...(effectiveColor != null
                ? ({ '--book-color': effectiveColor } as CSSProperties)
                : {}),
            ...(textColor != null
                ? ({ '--book-text-color': textColor } as CSSProperties)
                : {}),
        };
        const hasWrapperStyle = Object.keys(wrapperStyle).length > 0;

        // Rotate-wrapper class names
        const wrapperClasses = cn(
            styles.rotateWrapper,
            styles[variant],
            hasColor && styles.color,
        );

        return (
            <div
                ref={ref}
                className={cn(styles.perspective, className)}
                style={perspectiveStyle}
                {...props}
            >
                <div
                    className={wrapperClasses}
                    style={hasWrapperStyle ? wrapperStyle : undefined}
                >
                    {/*
                      * ---- BOOK element ----
                      *
                      * Ini dulu memakai komponen <Stack>. Diganti div biasa
                      * karena Stack memancarkan `data-version="v1"` dan gaya
                      * inline `--stack-*` yang tidak ada di produksi (produksi
                      * memakai div flex langsung), dan `.stack` memaksa
                      * `gap: 0` sehingga `column-gap`/`row-gap` terhitung `0px`
                      * padahal produksi `normal`. Properti flex dipindah ke
                      * kelas CSS per-role dengan nilai terhitung produksi:
                      * book/stripe/body pakai justify-content:flex-start, tapi
                      * content TIDAK (produksi `normal`); gap hanya di stripe
                      * (8px) dan content (calc), book/body tanpa gap.
                      */}
                    <div className={styles.book}>
                        {variant === 'stripe' && (
                            /* Stripe header (aria-hidden) */
                            <div className={styles.stripe} aria-hidden="true">
                                <div className={styles.illustration}>{illustration}</div>
                                <div className={styles.bind} />
                            </div>
                        )}

                        {/* Body row */}
                        <div className={styles.body}>
                            <div aria-hidden="true" className={styles.bind} />
                            <div className={styles.content}>
                                {/*
                                  * Title. Production renders a bare
                                  * <span class="text-heading-14 book-module__…__title">,
                                  * and that global utility is what carries
                                  * `font-family: var(--font-geist-sans)`.
                                  *
                                  * This used to be a <Text> with size/weight passed as
                                  * props. The numbers matched, but no font-family was
                                  * ever applied, so the title silently inherited the
                                  * page chain, whose first name ("Geist") is not a
                                  * registered family and fell through to a system font.
                                  * Measured: 810.77px of text in GeistSans versus
                                  * 783.08px in the fallback, enough to change where
                                  * `text-wrap: balance` breaks lines.
                                  */}
                                <span className={cn('text-heading-14', styles.title)}>{title}</span>

                                {/* Varian simple SELALU punya slot ilustrasi. Tanpa prop
                                    `illustration`, produksi mengisinya dengan tanda
                                    tiga-warna bawaan, bukan mengosongkannya. */}
                                {variant === 'simple' && (
                                    <div className={styles.illustration}>{illustration ?? <DefaultMark />}</div>
                                )}

                                {variant === 'stripe' &&
                                    (icon !== undefined ? icon : <LogoVercel size={16} />)}
                            </div>
                        </div>

                        {/* Texture overlay (textured only) */}
                        {textured && (
                            <div
                                aria-hidden="true"
                                className={styles.texture}
                                style={{ transform: `rotate(${textureRotation}deg)` }}
                            />
                        )}
                    </div>

                    {/* Pages spine */}
                    <div
                        aria-hidden="true"
                        className={cn(styles.pages, textured && styles.textured)}
                    />

                    {/* Back cover */}
                    <div aria-hidden="true" className={styles.back} />
                </div>
            </div>
        );
    },
);

Book.displayName = 'Book';
