import {
    forwardRef,
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type ReactNode,
    useCallback,
    useState,
} from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

// ---- Types (exact from button.md JSX API) ----

export type ButtonVariant = 'default' | 'secondary' | 'tertiary' | 'error' | 'warning';
export type ButtonSize = 'tiny' | 'small' | 'medium' | 'large';
export type ButtonShape = 'square' | 'circle' | 'rounded';

// ---- Shared helpers ----

/** Variant → themed marker classes (error/warning render the `themed` + fill classes). */
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

interface BuildClassNameArgs {
    variant: ButtonVariant;
    size: ButtonSize;
    shape?: ButtonShape;
    shadow: boolean;
    loading: boolean;
    className?: string;
    /** Extra module class appended before the user className (e.g. custom overrides). */
    extra?: string;
}

/** Compose the full Button className. Shared by Button, ButtonLink and CustomButton. */
function buildButtonClassName({
    variant,
    size,
    shape,
    shadow,
    loading,
    className,
    extra,
}: BuildClassNameArgs): string {
    const isThemed = variant !== 'default' && variant !== 'secondary';
    const sizeClass = size !== 'medium' ? styles[size] : undefined;
    // .shape (icon-only, width=height) only for square/circle, NOT rounded.
    const shapeClass = shape && shape !== 'rounded' ? styles.shape : undefined;
    const circleClass = shape === 'circle' ? styles.circle : undefined;
    const roundedClass = shape === 'rounded' ? styles.rounded : undefined;

    return cn(
        styles.base,
        styles.reset,
        styles.button,
        isThemed ? styles.themed : undefined,
        ...getVariantClasses(variant),
        variant === 'secondary' ? styles.secondary : undefined,
        variant === 'tertiary' ? styles.tertiary : undefined,
        sizeClass,
        shapeClass,
        circleClass,
        roundedClass,
        shadow ? styles.shadow : undefined,
        styles.invert,
        loading ? styles.loading : undefined,
        extra,
        className,
    );
}

/**
 * Pointer interaction state (hover / active), mirroring production which toggles
 * `data-hover` / `data-active` via react-aria. Shared by Button, ButtonLink and CustomButton.
 */
function useButtonInteraction<T extends HTMLElement>(handlers: {
    onPointerEnter?: React.PointerEventHandler<T>;
    onPointerLeave?: React.PointerEventHandler<T>;
    onPointerDown?: React.PointerEventHandler<T>;
    onPointerUp?: React.PointerEventHandler<T>;
}): {
    isHovered: boolean;
    isActive: boolean;
    pointerHandlers: {
        onPointerEnter: React.PointerEventHandler<T>;
        onPointerLeave: React.PointerEventHandler<T>;
        onPointerDown: React.PointerEventHandler<T>;
        onPointerUp: React.PointerEventHandler<T>;
    };
} {
    const { onPointerEnter, onPointerLeave, onPointerDown, onPointerUp } = handlers;
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const handlePointerEnter = useCallback<React.PointerEventHandler<T>>(
        (e) => {
            setIsHovered(true);
            onPointerEnter?.(e);
        },
        [onPointerEnter],
    );

    const handlePointerLeave = useCallback<React.PointerEventHandler<T>>(
        (e) => {
            setIsHovered(false);
            setIsActive(false);
            onPointerLeave?.(e);
        },
        [onPointerLeave],
    );

    const handlePointerDown = useCallback<React.PointerEventHandler<T>>(
        (e) => {
            setIsActive(true);
            onPointerDown?.(e);
        },
        [onPointerDown],
    );

    const handlePointerUp = useCallback<React.PointerEventHandler<T>>(
        (e) => {
            setIsActive(false);
            onPointerUp?.(e);
        },
        [onPointerUp],
    );

    return {
        isHovered,
        isActive,
        pointerHandlers: {
            onPointerEnter: handlePointerEnter,
            onPointerLeave: handlePointerLeave,
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
        },
    };
}

/** Loading spinner injected in place of the prefix. small/medium → 16px, large → 24px. */
function getSpinner(size: ButtonSize): ReactNode {
    const spinnerSize = size === 'large' ? 24 : 16;
    return <Spinner size={spinnerSize} color="var(--accents-5)" />;
}

/** Renders the prefix / content / suffix slots shared by every button-like element. */
function ButtonSlots({
    prefixNode,
    suffixNode,
    svgOnly,
    children,
}: {
    prefixNode: ReactNode;
    suffixNode: ReactNode;
    svgOnly?: boolean;
    children?: ReactNode;
}): ReactNode {
    return (
        <>
            {prefixNode ? <span className={styles.prefix}>{prefixNode}</span> : null}
            <span className={cn(styles.content, svgOnly ? styles.flex : undefined)}>{children}</span>
            {suffixNode ? <span className={styles.suffix}>{suffixNode}</span> : null}
        </>
    );
}

// ---- Button ----

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'prefix'> {
    /** Visual variant. Default = 'default'. */
    variant?: ButtonVariant;
    /**
     * HTML `type` attribute (submit / button / reset). Default = 'submit'.
     * Named `typeName` (not `type`) so `type` stays free for the visual variant, matching Geist.
     */
    typeName?: 'submit' | 'button' | 'reset';
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
 * Production data attributes: data-oxobz-button, data-prefix, data-suffix, data-version="v1".
 * Hover/active handled via data-hover/data-active attributes (same as production).
 * Keyboard focus ring is provided by the `:focus-visible` fallback in the CSS module.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'default',
            typeName = 'submit',
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
        const { isHovered, isActive, pointerHandlers } = useButtonInteraction<HTMLButtonElement>({
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
        });

        const buttonClasses = buildButtonClassName({ variant, size, shape, shadow, loading, className });

        // Prefix: loading spinner takes precedence (production behavior).
        const effectivePrefix = loading ? getSpinner(size) : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

        // Loading → disabled (production behavior).
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                type={typeName}
                tabIndex={0}
                data-react-aria-pressable="true"
                className={buttonClasses}
                data-oxobz-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={{ '--oxobz-icon-size': '16px' } as React.CSSProperties}
                disabled={isDisabled || undefined}
                {...(isHovered && !isDisabled ? { 'data-hover': '' } : {})}
                {...(isActive && !isDisabled ? { 'data-active': '' } : {})}
                {...pointerHandlers}
                {...props}
            >
                <ButtonSlots
                    prefixNode={effectivePrefix}
                    suffixNode={suffixIcon}
                    svgOnly={svgOnly}
                >
                    {children}
                </ButtonSlots>
            </button>
        );
    },
);

Button.displayName = 'Button';

// ---- ButtonLink ----

export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
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
 * Production equivalent of Geist's ButtonLink: same hover/active feedback via
 * data-hover / data-active, wired through the shared interaction hook.
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
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
            ...props
        },
        ref,
    ) => {
        const { isHovered, isActive, pointerHandlers } = useButtonInteraction<HTMLAnchorElement>({
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
        });

        const linkClasses = buildButtonClassName({ variant, size, shape, shadow, loading, className });

        const effectivePrefix = loading ? getSpinner(size) : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

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
                {...(isHovered ? { 'data-hover': '' } : {})}
                {...(isActive ? { 'data-active': '' } : {})}
                {...pointerHandlers}
                {...props}
            >
                <ButtonSlots
                    prefixNode={effectivePrefix}
                    suffixNode={suffixIcon}
                    svgOnly={svgOnly}
                >
                    {children}
                </ButtonSlots>
            </a>
        );
    },
);

ButtonLink.displayName = 'ButtonLink';

// ---- CustomButton ----

/** Foreground / background / border override for a single interaction state. */
export interface CustomButtonColors {
    /** Text color. */
    foreground?: string;
    /** Background color. */
    background?: string;
    /** Border color. */
    border?: string;
}

export interface CustomButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'prefix'> {
    /** Colors in the resting state. */
    normal?: CustomButtonColors;
    /** Colors while hovered. */
    hover?: CustomButtonColors;
    /** Colors while pressed / active. */
    active?: CustomButtonColors;
    /** Fixed width. A number is treated as pixels. */
    width?: number | string;
    /** HTML `type` attribute (submit / button / reset). Default = 'submit'. */
    typeName?: 'submit' | 'button' | 'reset';
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
 * CustomButton — a Button whose foreground / background / border can be overridden per
 * interaction state (normal / hover / active), matching Geist's `CustomButton`.
 * Overrides are applied through CSS custom properties consumed by the `.custom` rules.
 */
export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
    (
        {
            normal,
            hover,
            active,
            width,
            typeName = 'submit',
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
        const { isHovered, isActive, pointerHandlers } = useButtonInteraction<HTMLButtonElement>({
            onPointerEnter,
            onPointerLeave,
            onPointerDown,
            onPointerUp,
        });

        // CustomButton is always the default variant; its colors come from the CSS overrides.
        const buttonClasses = buildButtonClassName({
            variant: 'default',
            size,
            shape,
            shadow,
            loading,
            className,
            extra: styles.custom,
        });

        const effectivePrefix = loading ? getSpinner(size) : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);
        const isDisabled = disabled || loading;

        const customStyle = {
            '--oxobz-icon-size': '16px',
            '--button-custom-fg': normal?.foreground,
            '--button-custom-bg': normal?.background,
            '--button-custom-border': normal?.border,
            '--button-custom-fg-hover': hover?.foreground,
            '--button-custom-bg-hover': hover?.background,
            '--button-custom-border-hover': hover?.border,
            '--button-custom-fg-active': active?.foreground,
            '--button-custom-bg-active': active?.background,
            '--button-custom-border-active': active?.border,
            width,
        } as React.CSSProperties;

        return (
            <button
                ref={ref}
                type={typeName}
                tabIndex={0}
                data-react-aria-pressable="true"
                className={buttonClasses}
                data-oxobz-button=""
                data-oxobz-custom-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={customStyle}
                disabled={isDisabled || undefined}
                {...(isHovered && !isDisabled ? { 'data-hover': '' } : {})}
                {...(isActive && !isDisabled ? { 'data-active': '' } : {})}
                {...pointerHandlers}
                {...props}
            >
                <ButtonSlots
                    prefixNode={effectivePrefix}
                    suffixNode={suffixIcon}
                    svgOnly={svgOnly}
                >
                    {children}
                </ButtonSlots>
            </button>
        );
    },
);

CustomButton.displayName = 'CustomButton';
