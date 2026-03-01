import { forwardRef, type ButtonHTMLAttributes, type ReactNode, useCallback, useState } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

// ---- Types (exact from button.html JSX API) ----

export type ButtonVariant = 'default' | 'secondary' | 'tertiary' | 'error' | 'warning';
export type ButtonSize = 'tiny' | 'small' | 'medium' | 'large';
export type ButtonShape = 'square' | 'circle' | 'rounded';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'prefix'> {
    /** Button variant — maps to geist-new-themed classes. Default = 'default'. */
    variant?: ButtonVariant;
    /** HTML button type attribute. Default = 'submit'. */
    htmlType?: 'submit' | 'button' | 'reset';
    /** Size. Default = 'medium'. */
    size?: ButtonSize;
    /** Icon-only shape. When set, button becomes square/circle icon button. */
    shape?: ButtonShape;
    /** Add box-shadow (marketing style). */
    shadow?: boolean;
    /** SVG-only content. Applies flex layout to content wrapper. */
    svgOnly?: boolean;
    /** Prefix icon (before content). */
    prefix?: ReactNode;
    /** Suffix icon (after content). */
    suffix?: ReactNode;
    /** Loading state. */
    loading?: boolean;
    /** Children */
    children?: ReactNode;
}

/**
 * Button component — 100% consistent with production Geist.
 *
 * Production data attributes: data-oxobz-button, data-prefix, data-suffix, data-version="v1"
 * Hover/active handled via data-hover/data-active attributes (same as production).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'default',
            htmlType = 'submit',
            size = 'medium',
            shape,
            shadow = false,
            svgOnly = false,
            prefix: prefixIcon,
            suffix: suffixIcon,
            loading = false,
            disabled,
            className,
            children,
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
            ...props
        },
        ref,
    ) => {
        // Hover & Active state tracking (production uses data-hover / data-active)
        const [isHovered, setIsHovered] = useState(false);
        const [isActive, setIsActive] = useState(false);

        const handlePointerEnter = useCallback(
            (e: React.PointerEvent<HTMLButtonElement>) => {
                setIsHovered(true);
                onPointerEnter?.(e);
            },
            [onPointerEnter],
        );

        const handlePointerLeave = useCallback(
            (e: React.PointerEvent<HTMLButtonElement>) => {
                setIsHovered(false);
                setIsActive(false);
                onPointerLeave?.(e);
            },
            [onPointerLeave],
        );

        const handlePointerDown = useCallback(
            (e: React.PointerEvent<HTMLButtonElement>) => {
                setIsActive(true);
                onPointerDown?.(e);
            },
            [onPointerDown],
        );

        const handlePointerUp = useCallback(
            (e: React.PointerEvent<HTMLButtonElement>) => {
                setIsActive(false);
                onPointerUp?.(e);
            },
            [onPointerUp],
        );

        // Variant → themed class mapping
        const isThemed = variant !== 'default' && variant !== 'secondary';
        const variantClasses = getVariantClasses(variant);

        // Size class (medium = no extra class, it's the default)
        const sizeClass = size !== 'medium' ? styles[size] : undefined;

        // Shape class — .shape (icon-only, width=height) only for square/circle, NOT rounded
        const shapeClass = shape && shape !== 'rounded' ? styles.shape : undefined;
        const circleClass = shape === 'circle' ? styles.circle : undefined;
        const roundedClass = shape === 'rounded' ? styles.rounded : undefined;

        const buttonClasses = cn(
            styles.base,
            styles.reset,
            styles.button,
            styles.reset,
            // Themed
            isThemed ? styles.themed : undefined,
            ...variantClasses,
            // Variant-specific module class
            variant === 'secondary' ? styles.secondary : undefined,
            variant === 'tertiary' ? styles.tertiary : undefined,
            // Size
            sizeClass,
            // Shape
            shapeClass,
            circleClass,
            roundedClass,
            // Modifiers
            shadow ? styles.shadow : undefined,
            styles.invert,
            loading ? styles.loading : undefined,
            // User class
            className,
        );

        // Loading spinner — injected as prefix automatically
        // Production: small/medium → 16px spinner, large → 24px spinner
        const spinnerSize = size === 'large' ? 24 : 16;
        const loadingSpinner = loading ? <Spinner size={spinnerSize} color="var(--accents-5)" /> : null;

        // Prefix: loading spinner takes precedence (production behavior)
        const effectivePrefix = loading ? loadingSpinner : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

        // Loading → disabled (production behavior)
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                type={htmlType}
                tabIndex={isDisabled ? -1 : 0}
                data-react-aria-pressable="true"
                className={buttonClasses}
                data-oxobz-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={{ '--oxobz-icon-size': '16px' } as React.CSSProperties}
                disabled={isDisabled || undefined}
                aria-disabled={isDisabled ? true : undefined}
                {...(isHovered && !isDisabled ? { 'data-hover': '' } : {})}
                {...(isActive && !isDisabled ? { 'data-active': '' } : {})}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                {...props}
            >
                {hasPrefix && (
                    <span className={styles.prefix}>{effectivePrefix}</span>
                )}
                <span className={cn(styles.content, svgOnly ? styles.flex : undefined)}>
                    {children}
                </span>
                {hasSuffix && (
                    <span className={styles.suffix}>{suffixIcon}</span>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';

// ---- Helper ----

function getVariantClasses(variant: ButtonVariant): (string | undefined)[] {
    switch (variant) {
        case 'error':
            return [styles.error, styles.errorFill];
        case 'warning':
            return [styles.warning, styles.warningFill];
        default:
            return [];
    }
}

// ---- ButtonLink ----

export interface ButtonLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    shadow?: boolean;
    svgOnly?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
    loading?: boolean;
    children?: ReactNode;
}

/**
 * ButtonLink — an `<a>` tag rendered with Button styling.
 * Production equivalent of Geist's ButtonLink component.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
    (
        {
            variant = 'default',
            size = 'medium',
            shape,
            shadow = false,
            svgOnly = false,
            prefix: prefixIcon,
            suffix: suffixIcon,
            loading = false,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const isThemed = variant !== 'default' && variant !== 'secondary';
        const variantClasses = getVariantClasses(variant);
        const sizeClass = size !== 'medium' ? styles[size] : undefined;
        const shapeClass = shape && shape !== 'rounded' ? styles.shape : undefined;
        const circleClass = shape === 'circle' ? styles.circle : undefined;
        const roundedClass = shape === 'rounded' ? styles.rounded : undefined;

        const spinnerSize = size === 'large' ? 24 : 16;
        const loadingSpinner = loading ? <Spinner size={spinnerSize} color="var(--accents-5)" /> : null;
        const effectivePrefix = loading ? loadingSpinner : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

        const linkClasses = cn(
            styles.base,
            styles.reset,
            styles.button,
            styles.reset,
            isThemed ? styles.themed : undefined,
            ...variantClasses,
            variant === 'secondary' ? styles.secondary : undefined,
            variant === 'tertiary' ? styles.tertiary : undefined,
            sizeClass,
            shapeClass,
            circleClass,
            roundedClass,
            shadow ? styles.shadow : undefined,
            styles.invert,
            loading ? styles.loading : undefined,
            className,
        );

        return (
            <a
                ref={ref}
                role="link"
                tabIndex={0}
                data-react-aria-pressable="true"
                className={linkClasses}
                data-oxobz-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={{ '--oxobz-icon-size': '16px' } as React.CSSProperties}
                {...props}
            >
                {hasPrefix && (
                    <span className={styles.prefix}>{effectivePrefix}</span>
                )}
                <span className={cn(styles.content, svgOnly ? styles.flex : undefined)}>
                    {children}
                </span>
                {hasSuffix && (
                    <span className={styles.suffix}>{suffixIcon}</span>
                )}
            </a>
        );
    },
);

ButtonLink.displayName = 'ButtonLink';
