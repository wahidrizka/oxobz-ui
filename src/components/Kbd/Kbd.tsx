'use client';

import {
    forwardRef,
    useEffect,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Kbd.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KbdProps extends HTMLAttributes<HTMLElement> {
    /**
     * Meta / Command modifier. Renders `⌘` on Apple platforms and swaps to
     * `Ctrl` on Windows and Linux (Geist platform-aware behaviour).
     */
    meta?: boolean;

    /** Shift modifier — renders `⇧`. */
    shift?: boolean;

    /** Alt / Option modifier — renders `⌥`. */
    alt?: boolean;

    /** Control modifier — renders `⌃`. */
    ctrl?: boolean;

    /** Compact size for dense surfaces (menu rows, table cells). */
    small?: boolean;

    /**
     * A single key, digit, or named key (`K`, `7`, `Enter`, `Esc`). Rendered
     * after any modifiers. Keep it to one key — don't pack a sentence in.
     */
    children?: ReactNode;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Platform detection                                                 */
/* ------------------------------------------------------------------ */

/**
 * Whether the current platform is Apple (macOS / iOS), decided on the CLIENT
 * after mount. Returns `null` until then.
 *
 * Detection runs in an effect (not during render) so the server render and the
 * first client render agree — both see `null`, which the component paints as a
 * ` ` placeholder in the meta span. This mirrors the live geistcn Kbd,
 * which SSRs ` ` and fills `⌘` / `Ctrl` client-side, and it avoids the
 * hydration mismatch that render-time detection causes on Apple devices
 * (server has no `navigator`, so it would disagree with the client).
 */
function useIsApplePlatform(): boolean | null {
    const [isApple, setIsApple] = useState<boolean | null>(null);
    useEffect(() => {
        if (typeof navigator === 'undefined') return;
        const platform = navigator.platform || '';
        const userAgent = navigator.userAgent || '';
        setIsApple(/mac|iphone|ipod|ipad/i.test(platform || userAgent));
    }, []);
    return isApple;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display keyboard input that triggers an action.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <kbd class="kbd" data-oxobz-kbd="" data-version="v1">
 *   <span style="min-width:1em;display:inline-block">⌘</span>
 *   <span>⇧</span>
 *   <span>K</span>
 * </kbd>
 * ```
 *
 * Each modifier and the child key are rendered as their own `<span>`; the
 * `span + span` CSS rule inserts the gap between them. Modifier order is fixed
 * (`meta`, `shift`, `alt`, `ctrl`) regardless of prop order, matching Geist's
 * own Modifiers example, with `children` last.
 */
const Kbd = forwardRef<HTMLElement, KbdProps>(
    (
        {
            alt = false,
            children,
            className,
            ctrl = false,
            meta = false,
            shift = false,
            small = false,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const isApple = useIsApplePlatform();

        const parts: ReactNode[] = [];

        if (meta) {
            // Platform-dependent glyph: a non-breaking-space placeholder until
            // the platform is detected on the client, then `⌘` (Apple) /
            // `Ctrl` (Windows / Linux). The explicit min-width keeps the
            // footprint stable across that swap. Matches the live geistcn Kbd.
            const metaGlyph =
                isApple === null ? ' ' : isApple ? '⌘' : 'Ctrl';
            parts.push(
                <span
                    key="meta"
                    style={{ minWidth: '1em', display: 'inline-block' }}
                >
                    {metaGlyph}
                </span>,
            );
        }
        if (shift) parts.push(<span key="shift">⇧</span>);
        if (alt) parts.push(<span key="alt">⌥</span>);
        if (ctrl) parts.push(<span key="ctrl">⌃</span>);

        if (
            children !== undefined &&
            children !== null &&
            children !== false &&
            children !== ''
        ) {
            parts.push(<span key="children">{children}</span>);
        }

        return (
            <kbd
                {...rest}
                className={cn(styles.kbd, small && styles.small, className)}
                data-oxobz-kbd=""
                data-version={dataVersion}
                ref={ref}
            >
                {parts}
            </kbd>
        );
    },
);

Kbd.displayName = 'Kbd';

export { Kbd };
