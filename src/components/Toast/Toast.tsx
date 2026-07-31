'use client';

import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { Cross } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Toast.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Semantic color of a toast. Omit for the default (neutral) look.
 * `success` -> blue, `warning` -> amber, `error` -> red (Geist mapping).
 */
export type ToastType = 'success' | 'warning' | 'error';

/**
 * Options accepted by `toasts.message(...)`.
 *
 * `text`, `preserve`, `action`, and `onUndoAction` mirror the Geist
 * `toast.md` API 1:1. `type`, `visual`, `visualHeight`, `fullBleed`,
 * `overflowHidden`, and `duration` map to real production classes/behaviour
 * that the docs page does not enumerate; they are optional extensions.
 */
export interface ToastOptions {
    /** Message body — a string or arbitrary JSX. */
    text: ReactNode;

    /** Semantic color. Set implicitly by success/warning/error helpers. */
    type?: ToastType;

    /**
     * Inline action rendered at the end of the message row (e.g. `'Undo'`).
     * Clicking it dismisses the toast.
     */
    action?: ReactNode;

    /**
     * Undo callback. When provided, a full-width actions row is rendered with
     * an Undo button (wired to this callback) and a dismiss button.
     */
    onUndoAction?: () => void;

    /** Keep the toast on screen until dismissed instead of auto-dismissing. */
    preserve?: boolean;

    /** Custom auto-dismiss delay in ms (ignored when `preserve` is set). */
    duration?: number;

    /** Optional visual header rendered above the message (bleeds to edges). */
    visual?: ReactNode;

    /** Height in px of the visual header slot (default 128). */
    visualHeight?: number;

    /** Remove the card padding (used with a full-bleed visual). */
    fullBleed?: boolean;

    /** Clip overflowing content to the rounded card. */
    overflowHidden?: boolean;
}

/** Handle returned by every enqueue call, letting the caller dismiss early. */
export interface ToastControls {
    /** Generated id of the toast. */
    id: string;
    /** Dismiss this toast (plays the hide animation, then removes it). */
    dismiss: () => void;
}

/** Imperative API returned by {@link useToasts}. */
export interface ToastsApi {
    /** Enqueue a fully-configured toast. */
    message: (options: ToastOptions) => ToastControls;
    /** Shorthand for a blue success toast. */
    success: (text: ReactNode) => ToastControls;
    /** Shorthand for an amber warning toast. */
    warning: (text: ReactNode) => ToastControls;
    /** Shorthand for a red error toast. */
    error: (text: ReactNode) => ToastControls;
}

type ToastPhase = 'entering' | 'visible' | 'hiding';

interface ToastItem extends ToastOptions {
    id: string;
    phase: ToastPhase;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Hide-animation length — matches the `.hiding` transition (0.16s). */
const HIDE_DURATION = 160;

/**
 * Default auto-dismiss delay. Not verifiable from the reference sources
 * (the snapshot has no rendered toast); chosen as a sensible default and
 * overridable per-toast via `duration`.
 */
const DEFAULT_DURATION = 5000;

/**
 * Vertical gap between fanned-out cards on hover. The exact stacking math is
 * not present in the CSS chunk (it is JS-driven via --y/--z/--max-height);
 * this is an implementation choice that keeps the hover fan-out functional.
 */
const STACK_GAP = 16;

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastsApi | null>(null);

/**
 * Access the toast API. Must be called inside a {@link ToastArea}.
 */
export function useToasts(): ToastsApi {
    const api = useContext(ToastContext);
    if (api === null) {
        throw new Error('useToasts must be used within a <ToastArea>.');
    }
    return api;
}

/* ------------------------------------------------------------------ */
/*  ToastArea (provider + fixed viewport anchor)                       */
/* ------------------------------------------------------------------ */

export interface ToastAreaProps extends HTMLAttributes<HTMLDivElement> {
    /** App subtree that can call {@link useToasts}. */
    children?: ReactNode;

    /** Anchor the stack to the horizontal center instead of the right edge. */
    center?: boolean;

    /** data-version attribute matching the workspace convention. */
    'data-version'?: string;
}

let toastSeq = 0;
function nextToastId(): string {
    toastSeq += 1;
    return `toast-${toastSeq}`;
}

/**
 * Provider + fixed viewport region that renders the toast stack. Mount it once
 * near the root of the app and wrap the subtree that needs `useToasts`.
 *
 * ```tsx
 * <ToastArea>
 *   <App />
 * </ToastArea>
 * ```
 *
 * The rendered `.toastArea` is `position: fixed`, so it is a sibling of
 * `children` (not a wrapper) and does not affect app layout.
 */
const ToastArea = forwardRef<HTMLDivElement, ToastAreaProps>(
    (
        {
            children,
            center = false,
            className,
            'data-version': dataVersion = 'v1',
            'aria-live': ariaLive = 'polite',
            ...rest
        },
        ref,
    ) => {
        const [items, setItems] = useState<ToastItem[]>([]);
        const areaRef = useRef<HTMLDivElement | null>(null);

        // Per-toast timer/raf cleanups so nothing fires after removal/unmount.
        const cleanupsRef = useRef(new Map<string, Array<() => void>>());

        const track = useCallback((id: string, cancel: () => void) => {
            const list = cleanupsRef.current.get(id) ?? [];
            list.push(cancel);
            cleanupsRef.current.set(id, list);
        }, []);

        const clearTimers = useCallback((id: string) => {
            cleanupsRef.current.get(id)?.forEach((cancel) => {
                cancel();
            });
            cleanupsRef.current.delete(id);
        }, []);

        const remove = useCallback(
            (id: string) => {
                clearTimers(id);
                setItems((prev) => prev.filter((item) => item.id !== id));
            },
            [clearTimers],
        );

        const dismiss = useCallback(
            (id: string) => {
                clearTimers(id);
                setItems((prev) =>
                    prev.map((item) =>
                        item.id === id ? { ...item, phase: 'hiding' } : item,
                    ),
                );
                const timer = setTimeout(() => {
                    remove(id);
                }, HIDE_DURATION);
                track(id, () => {
                    clearTimeout(timer);
                });
            },
            [clearTimers, remove, track],
        );

        const enqueue = useCallback(
            (options: ToastOptions): ToastControls => {
                const id = nextToastId();
                setItems((prev) => [...prev, { ...options, id, phase: 'entering' }]);

                // Flip to the visible phase on the next frame so the enter
                // transition (translate3d -> none) actually animates.
                const raf = requestAnimationFrame(() => {
                    setItems((prev) =>
                        prev.map((item) =>
                            item.id === id ? { ...item, phase: 'visible' } : item,
                        ),
                    );
                });
                track(id, () => {
                    cancelAnimationFrame(raf);
                });

                if (options.preserve !== true) {
                    const delay = options.duration ?? DEFAULT_DURATION;
                    const timer = setTimeout(() => {
                        dismiss(id);
                    }, delay);
                    track(id, () => {
                        clearTimeout(timer);
                    });
                }

                return { id, dismiss: () => dismiss(id) };
            },
            [dismiss, track],
        );

        const api = useMemo<ToastsApi>(
            () => ({
                message: (options) => enqueue(options),
                success: (text) => enqueue({ text, type: 'success' }),
                warning: (text) => enqueue({ text, type: 'warning' }),
                error: (text) => enqueue({ text, type: 'error' }),
            }),
            [enqueue],
        );

        // Feed the hover fan-out: measure each card and assign its --y/--z slot
        // plus --max-height. No-op in jsdom (offsetHeight === 0); harmless.
        useLayoutEffect(() => {
            const area = areaRef.current;
            if (area === null) {
                return;
            }
            const cards = Array.from(area.children).filter(
                (node): node is HTMLElement => node instanceof HTMLElement,
            );
            let offset = 0;
            for (let i = cards.length - 1; i >= 0; i -= 1) {
                const card = cards[i];
                const depth = cards.length - 1 - i;
                card.style.setProperty('--y', `${-offset}px`);
                card.style.setProperty('--z', `${-depth * 40}px`);
                card.style.setProperty('--max-height', `${card.scrollHeight}px`);
                offset += card.offsetHeight + STACK_GAP;
            }
        }, [items]);

        // Cancel everything still pending when the area unmounts.
        const cleanups = cleanupsRef.current;
        useLayoutEffect(() => {
            return () => {
                cleanups.forEach((list) => {
                    list.forEach((cancel) => {
                        cancel();
                    });
                });
                cleanups.clear();
            };
        }, [cleanups]);

        const setRefs = useCallback(
            (node: HTMLDivElement | null) => {
                areaRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref !== null) {
                    ref.current = node;
                }
            },
            [ref],
        );

        return (
            <ToastContext.Provider value={api}>
                {children}
                <div
                    {...rest}
                    aria-live={ariaLive}
                    className={cn(
                        styles.toastArea,
                        items.length > 1 && styles.multiple,
                        center && styles.center,
                        className,
                    )}
                    data-oxobz-toast-area=""
                    data-version={dataVersion}
                    ref={setRefs}
                >
                    {items.map((item) => (
                        <ToastContainer
                            item={item}
                            key={item.id}
                            onDismiss={dismiss}
                        />
                    ))}
                </div>
            </ToastContext.Provider>
        );
    },
);

ToastArea.displayName = 'ToastArea';

/* ------------------------------------------------------------------ */
/*  ToastContainer (single card — presentational)                     */
/* ------------------------------------------------------------------ */

interface ToastContainerProps {
    item: ToastItem;
    onDismiss: (id: string) => void;
}

/**
 * A single toast card.
 *
 * Rendered DOM (derived from toasts-module class semantics):
 * ```html
 * <div class="toastContainer [type] [visible|hiding] ..." data-oxobz-toast>
 *   <div class="visualContainer">…visual…</div>   <!-- optional -->
 *   <div class="toast">
 *     <div class="message [fullWidth]">
 *       <span>{text}</span>
 *       <div class="actionsContainer"><button>{action}</button></div>  <!-- inline -->
 *     </div>
 *     <div class="actionsContainer fullActions">   <!-- undo pattern -->
 *       <button>{action ?? 'Undo'}</button>
 *       <button aria-label="Dismiss"><Cross/></button>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
function ToastContainer({ item, onDismiss }: ToastContainerProps) {
    const hasUndo = typeof item.onUndoAction === 'function';
    const hasInlineAction = item.action != null && !hasUndo;

    const visualStyle: CSSProperties | undefined =
        item.visualHeight != null
            ? ({ '--visual-height': `${item.visualHeight}px` } as CSSProperties)
            : undefined;

    return (
        <div
            className={cn(
                styles.toastContainer,
                item.type && styles[item.type],
                item.phase === 'visible' && styles.visible,
                item.phase === 'hiding' && styles.hiding,
                item.fullBleed && styles.fullBleed,
                item.overflowHidden && styles.overflowHidden,
            )}
            data-oxobz-toast=""
            data-version="v1"
            role="status"
        >
            {item.visual != null && (
                <div className={styles.visualContainer} style={visualStyle}>
                    {item.visual}
                </div>
            )}
            <div className={styles.toast}>
                <div className={cn(styles.message, hasUndo && styles.fullWidth)}>
                    {/* live geistcn (26 Jul): pesan diawali prefiks tipe untuk screen
                        reader — `<span class="sr-only">success: </span>` (juga
                        "error: "/"warning: "). Tanpa tipe, tak ada prefiks. */}
                    {item.type ? (
                        <span className="oxobz-sr-only">{`${item.type}: `}</span>
                    ) : null}
                    <span>{item.text}</span>
                    {hasInlineAction && (
                        <div className={styles.actionsContainer}>
                            <button
                                onClick={() => {
                                    onDismiss(item.id);
                                }}
                                type="button"
                            >
                                {item.action}
                            </button>
                        </div>
                    )}
                </div>
                {hasUndo && (
                    <div className={cn(styles.actionsContainer, styles.fullActions)}>
                        <button
                            onClick={() => {
                                item.onUndoAction?.();
                                onDismiss(item.id);
                            }}
                            type="button"
                        >
                            {item.action ?? 'Undo'}
                        </button>
                        <button
                            aria-label="Dismiss"
                            onClick={() => {
                                onDismiss(item.id);
                            }}
                            type="button"
                        >
                            <Cross size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export { ToastArea };
