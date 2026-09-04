'use client';

import {
    forwardRef,
    useRef,
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type ReactNode,
    type Ref,
} from 'react';
import { mergeProps, useFocusRing, useHover, usePress } from 'react-aria';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

// ---- Types (exact from the Geist docs JSX API — unchanged by the geistcn rebuild) ----

/**
 * Varian visual. `unstyled` ada di produksi juga (Geist menerima
 * `type="unstyled"`): tombol tanpa latar, tanpa cincin, dan tanpa tinggi
 * bawaan, dipakai untuk tombol ikon seperti panah bulan pada Calendar.
 */
export type ButtonVariant = 'default' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'unstyled';
export type ButtonSize = 'tiny' | 'small' | 'medium' | 'large';
export type ButtonShape = 'square' | 'circle' | 'rounded';

// ---- Shared helpers ----

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
    return cn(
        styles.button,
        // Every size class carries its own --height/--x-padding vars now
        // (geistcn generation) — medium included.
        styles[size],
        variant === 'secondary' ? styles.secondary : undefined,
        variant === 'tertiary' ? styles.tertiary : undefined,
        variant === 'error' ? styles.error : undefined,
        variant === 'warning' ? styles.warning : undefined,
        variant === 'unstyled' ? styles.unstyled : undefined,
        // .shape (icon-only, width=height) only for square/circle, NOT rounded.
        shape && shape !== 'rounded' ? styles.shape : undefined,
        shape === 'circle' ? styles.circle : undefined,
        shape === 'rounded' ? styles.rounded : undefined,
        shadow ? styles.shadow : undefined,
        loading ? styles.loading : undefined,
        extra,
        className,
    );
}

/**
 * Production interaction states via the same React Aria hooks Geist uses
 * (`data-react-aria-pressable` in every production button; the geistcn CSS
 * targets `[data-hover]` and `[data-focus]` — proven by custom-module's own
 * selectors in 0ir705xyqq90d.css):
 * - useHover     → data-hover (present while hovered, ignoring disabled)
 * - useFocusRing → data-focus (keyboard focus-visible only)
 * - usePress     → press semantics + data-react-aria-pressable
 */
function useAriaButtonStates(isDisabled: boolean): {
    stateProps: ReturnType<typeof mergeProps>;
    stateAttrs: Record<string, string>;
} {
    const { hoverProps, isHovered } = useHover({ isDisabled });
    const { pressProps } = usePress({ isDisabled });
    const { focusProps, isFocusVisible } = useFocusRing();

    const stateAttrs: Record<string, string> = {
        'data-react-aria-pressable': 'true',
    };
    // Production renders these as the string "true" (React Aria's convention),
    // not an empty string; the CSS keys off attribute presence either way.
    if (isHovered && !isDisabled) stateAttrs['data-hover'] = 'true';
    if (isFocusVisible) stateAttrs['data-focus'] = 'true';

    return {
        stateProps: mergeProps(hoverProps, pressProps, focusProps),
        stateAttrs,
    };
}

/**
 * Loading spinner injected in place of the prefix.
 *
 * Ukuran diukur di halaman Button live (10 Agu 2026): tombol setinggi 32px
 * memakai spinner 12px, 36px memakai 16px, dan 40px memakai 20px. Sebelumnya
 * di sini 16px untuk kecil dan 24px untuk besar, jadi dua dari tiga salah.
 */
function getSpinner(size: ButtonSize): ReactNode {
    const spinnerSize = size === 'large' ? 20 : size === 'medium' ? 16 : 12;
    /*
     * Tanpa prop `color`: spinner mewarisi warna teks tombol, sama seperti
     * produksi yang mewarnainya lewat `bg-current`. Terukur di halaman live,
     * spinner pada tombol loading berwarna gray-700 (warna teks tombol
     * nonaktif), bukan accents-5.
     */
    return <Spinner size={spinnerSize} />;
}

/** Renders the prefix / content / suffix slots shared by every button-like element. */
function ButtonSlots({
    prefixNode,
    suffixNode,
    svgOnly,
    loading,
    children,
}: {
    prefixNode: ReactNode;
    suffixNode: ReactNode;
    svgOnly?: boolean;
    loading?: boolean;
    children?: ReactNode;
}): ReactNode {
    return (
        <>
            {/*
              * `aria-hidden` HANYA saat memuat, yaitu ketika isi slot ini
              * spinner. Terukur di halaman Button live 30 Agu 2026: dari lima
              * span prefix produksi, tiga yang berisi spinner membawa
              * aria-hidden="true", dua yang berisi ikon biasa tidak.
              */}
            {prefixNode ? (
                <span aria-hidden={loading || undefined} className={styles.prefix}>
                    {prefixNode}
                </span>
            ) : null}
            <span className={cn(styles.content, svgOnly ? styles.flex : undefined)}>{children}</span>
            {suffixNode ? <span className={styles.suffix}>{suffixNode}</span> : null}
        </>
    );
}

/** Merge a forwarded ref with the local ref used by the interaction hooks. */
function setRefs<T>(node: T | null, forwarded: Ref<T> | undefined, local: React.MutableRefObject<T | null>): void {
    local.current = node;
    if (typeof forwarded === 'function') forwarded(node);
    else if (forwarded) (forwarded as React.MutableRefObject<T | null>).current = node;
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
 * Button — geistcn generation (rebuilt 19 Jul 2026 from button-jul2026.html).
 *
 * Production data attributes: data-oxobz-button, data-prefix, data-suffix,
 * data-version="v1", data-react-aria-pressable. Interaction states come from
 * the same React Aria hooks production uses: [data-hover] (useHover),
 * [data-focus] (useFocusRing, keyboard-visible only), press via usePress.
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
            ...props
        },
        ref,
    ) => {
        const localRef = useRef<HTMLButtonElement | null>(null);

        // Loading → disabled (production behavior).
        const isDisabled = Boolean(disabled) || loading;
        const { stateProps, stateAttrs } = useAriaButtonStates(isDisabled);

        const buttonClasses = buildButtonClassName({ variant, size, shape, shadow, loading, className });

        // Prefix: loading spinner takes precedence (production behavior).
        const effectivePrefix = loading ? getSpinner(size) : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

        return (
            <button
                ref={(node) => setRefs(node, ref, localRef)}
                type={typeName}
                tabIndex={0}
                className={buttonClasses}
                data-oxobz-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={{ '--oxobz-icon-size': '16px' } as React.CSSProperties}
                disabled={isDisabled || undefined}
                {...stateAttrs}
                {...mergeProps(stateProps, props)}
            >
                <ButtonSlots
                    loading={loading}
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

export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix' | 'type'> {
    /**
     * Sama seperti Button. Produksi memasang `type` juga pada tautannya,
     * terukur di halaman Banner live (a role="link" type="submit").
     */
    typeName?: 'submit' | 'button' | 'reset';
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
 * ButtonLink — an `<a>` tag rendered with Button styling and the same
 * React Aria interaction states as Button.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
    (
        {
            variant = 'default',
            size = 'medium',
            shape,
            shadow = false,
            svgOnly = false,
            typeName = 'submit',
            prefix: prefixIcon,
            suffix: suffixIcon,
            loading = false,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const localRef = useRef<HTMLAnchorElement | null>(null);
        const { stateProps, stateAttrs } = useAriaButtonStates(false);

        const linkClasses = buildButtonClassName({ variant, size, shape, shadow, loading, className });

        const effectivePrefix = loading ? getSpinner(size) : prefixIcon;
        const hasPrefix = Boolean(effectivePrefix);
        const hasSuffix = Boolean(suffixIcon);

        return (
            <a
                ref={(node) => setRefs(node, ref, localRef)}
                role="link"
                /* `type` ikut dipasang walau ini <a>. Terukur di halaman Banner
                   live: tautan produksi membawa type="submit" persis seperti
                   tombolnya, sebab dua-duanya lewat komponen yang sama. */
                type={typeName}
                tabIndex={0}
                className={linkClasses}
                data-oxobz-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={{ '--oxobz-icon-size': '16px' } as React.CSSProperties}
                {...stateAttrs}
                {...mergeProps(stateProps, props)}
            >
                <ButtonSlots
                    loading={loading}
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
 * CustomButton — a Button whose foreground / background / border can be
 * overridden per interaction state, matching production's
 * custom-module__gbx7Ca (state selectors [data-hover]/[data-focus] +
 * data-custom-button gate — see Button.module.css `.custom`).
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
            ...props
        },
        ref,
    ) => {
        const localRef = useRef<HTMLButtonElement | null>(null);
        const isDisabled = Boolean(disabled) || loading;
        const { stateProps, stateAttrs } = useAriaButtonStates(isDisabled);

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
            /*
             * `min-width`, BUKAN `width`.
             *
             * Terukur di halaman Button live 30 Agu 2026: gaya inline tombol
             * custom produksi berbunyi `min-width:160px;max-width:160px`,
             * tanpa `width` sama sekali. Menulis `width` membuat min-width
             * terbaca `auto` dan itu beda.
             */
            minWidth: width,
            maxWidth: width,
        } as React.CSSProperties;

        return (
            <button
                ref={(node) => setRefs(node, ref, localRef)}
                type={typeName}
                tabIndex={0}
                className={buttonClasses}
                data-oxobz-button=""
                data-custom-button=""
                data-prefix={String(hasPrefix)}
                data-suffix={String(hasSuffix)}
                data-version="v1"
                style={customStyle}
                disabled={isDisabled || undefined}
                {...stateAttrs}
                {...mergeProps(stateProps, props)}
            >
                <ButtonSlots
                    loading={loading}
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
