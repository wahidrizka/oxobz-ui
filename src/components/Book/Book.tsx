'use client';

import React, { forwardRef, useId, CSSProperties } from 'react';
import { LogoVercel } from '@oxobz/icons';
import { Stack } from '../Stack';
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

        // Auto-derived, deterministic per-instance texture rotation. Production
        // alternates the texture overlay between 0deg and 180deg across a row of
        // textured Books; deriving the angle from the stable per-instance id
        // reproduces that visual variation without an extra prop.
        const instanceId = useId();
        let idHash = 0;
        for (let i = 0; i < instanceId.length; i += 1) {
            idHash += instanceId.charCodeAt(i);
        }
        const textureRotation = idHash % 2 === 0 ? 0 : 180;

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
                    {/* ---- BOOK element ---- */}
                    <Stack
                        className={styles.book}
                        direction="column"
                        align="stretch"
                        justify="flex-start"
                        padding="0px"
                        gap="0px"
                    >
                        {variant === 'stripe' && (
                            /* Stripe header (aria-hidden) */
                            <Stack
                                className={styles.stripe}
                                aria-hidden="true"
                                direction="row"
                                align="stretch"
                                justify="flex-start"
                                padding="0px"
                                gap="8px"
                            >
                                <div className={styles.illustration}>{illustration}</div>
                                <div className={styles.bind} />
                            </Stack>
                        )}

                        {/* Body row */}
                        <Stack
                            className={styles.body}
                            direction="row"
                            align="stretch"
                            justify="flex-start"
                            padding="0px"
                            gap="0px"
                        >
                            <div aria-hidden="true" className={styles.bind} />
                            <Stack
                                className={styles.content}
                                direction="column"
                                align="stretch"
                                justify="flex-start"
                                padding="0px"
                                gap="0px"
                            >
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
                            </Stack>
                        </Stack>

                        {/* Texture overlay (textured only) */}
                        {textured && (
                            <div
                                aria-hidden="true"
                                className={styles.texture}
                                style={{ transform: `rotate(${textureRotation}deg)` }}
                            />
                        )}
                    </Stack>

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
