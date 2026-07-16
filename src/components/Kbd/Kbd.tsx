import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
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
 * True on Apple platforms (macOS / iOS). Used to decide whether the `meta`
 * modifier shows `⌘` (Apple) or `Ctrl` (Windows / Linux). Falls back to
 * non-Apple when `navigator` is unavailable (server render).
 */
function isApplePlatform(): boolean {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.platform || '';
    const userAgent = navigator.userAgent || '';
    return /mac|iphone|ipod|ipad/i.test(platform || userAgent);
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
        const isApple = isApplePlatform();

        const parts: ReactNode[] = [];

        if (meta) {
            // Only the meta span carries an explicit min-width so the `⌘` / `Ctrl`
            // glyph keeps a consistent footprint across platforms (snapshot parity).
            parts.push(
                <span
                    key="meta"
                    style={{ minWidth: '1em', display: 'inline-block' }}
                >
                    {isApple ? '⌘' : 'Ctrl'}
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
