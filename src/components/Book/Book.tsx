import React, { forwardRef, CSSProperties } from 'react';
import { LogoVercel } from '@oxobz/icons';
import { Stack } from '../Stack';
import { Text } from '../Text';
import styles from './Book.module.css';


export interface BookProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Visual variant.
     * - `stripe`: colored stripe header at top + logo at bottom
     * - `simple`: illustration inside content area
     * @default 'stripe'
     */
    variant?: 'stripe' | 'simple';

    /**
     * Book cover color string (any valid CSS color).
     * Applied as `--book-color`.
     * Stripe variant defaults to `var(--ds-amber-600)`.
     * Simple variant defaults to no color (white background).
     */
    color?: string;

    /**
     * Text color on top of the cover (for colored books).
     * Applied as `--book-text-color`.
     * @default 'var(--ds-gray-1000)'
     */
    textColor?: string;

    /**
     * Fixed book width in pixels (number only, no unit).
     * Applied as `--book-width`.
     * @default 196
     */
    width?: number;

    /**
     * Responsive widths — applied via CSS custom properties.
     * The production CSS resolves width at each breakpoint.
     */
    smWidth?: number;
    mdWidth?: number;
    lgWidth?: number;

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
     * Logo rendered at the bottom of the content (stripe variant only).
     */
    logo?: React.ReactNode;

    /**
     * Whether to apply the textured pages and overlay.
     * @default false
     */
    textured?: boolean;

    /**
     * Rotation angle of the texture overlay in degrees.
     * Production uses 0deg or 180deg.
     * @default 0
     */
    textureRotation?: 0 | 180;
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
            smWidth,
            mdWidth,
            lgWidth,
            title,
            illustration,
            logo,
            textured = false,
            textureRotation = 0,
            className,
            style,
            ...props
        },
        ref,
    ) => {
        // Production behavior: stripe default = amber, simple default = no color
        const effectiveColor = color ?? (variant === 'stripe' ? 'var(--ds-amber-600)' : undefined);
        const hasColor = Boolean(effectiveColor);

        // --- CSS custom properties ---
        const perspectiveStyle: CSSProperties = {
            ...style,
            // Fixed width (used when smWidth/mdWidth are NOT set)
            ...(smWidth == null && mdWidth == null && lgWidth == null
                ? ({ '--book-width': width } as CSSProperties)
                : {}),
            // Responsive widths
            ...(smWidth != null
                ? ({ '--sm-book-width': smWidth } as CSSProperties)
                : {}),
            ...(mdWidth != null
                ? ({ '--md-book-width': mdWidth } as CSSProperties)
                : {}),
            ...(lgWidth != null
                ? ({ '--lg-book-width': lgWidth } as CSSProperties)
                : {}),
            // Colors
            ...(effectiveColor != null ? ({ '--book-color': effectiveColor } as CSSProperties) : {}),
            ...(textColor != null
                ? ({ '--book-text-color': textColor } as CSSProperties)
                : {}),
        };

        // Rotate-wrapper class names
        const wrapperClasses = [
            styles.rotateWrapper,
            styles[variant],
            hasColor ? styles.color : '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                ref={ref}
                className={[styles.perspective, className].filter(Boolean).join(' ')}
                style={perspectiveStyle}
                {...props}
            >
                <div className={wrapperClasses}>
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
                                justify={variant === 'stripe' ? 'space-between' : 'flex-start'}
                                padding="0px"
                                gap="0px"
                            >
                                {/* Title */}
                                <Text
                                    className={styles.title}
                                    color="var(--ds-gray-1000)"
                                    size="0.875rem"
                                    lineHeight="1.25rem"
                                    letterSpacing="initial"
                                    weight={600}
                                >
                                    {title}
                                </Text>

                                {variant === 'simple' && illustration && (
                                    <div className={styles.illustration}>{illustration}</div>
                                )}

                                {variant === 'stripe' && (
                                    logo !== undefined ? logo : <LogoVercel size={16} />
                                )}
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
                        className={[styles.pages, textured ? styles.textured : '']
                            .filter(Boolean)
                            .join(' ')}
                    />

                    {/* Back cover */}
                    <div aria-hidden="true" className={styles.back} />
                </div>
            </div>
        );
    },
);

Book.displayName = 'Book';
