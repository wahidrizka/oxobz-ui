'use client';

import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps, type ButtonVariant } from '../Button';
import styles from './Modal.module.css';

/* ------------------------------------------------------------------ */
/*  Motion constants (from src/tokens/motion.css)                     */
/* ------------------------------------------------------------------ */

/** --ds-motion-overlay-duration — enter/exit transition length. */
const OVERLAY_DURATION_MS = 300;
/** --ds-motion-overlay-scale — closed-state scale for the dialog. */
const OVERLAY_SCALE = 0.95;

/* ------------------------------------------------------------------ */
/*  Focus helpers                                                     */
/* ------------------------------------------------------------------ */

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Ordered list of focusable elements inside `container`. */
function getFocusable(container: HTMLElement | null): HTMLElement[] {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
    );
}

/** Keeps Tab / Shift+Tab cycling within `container` (focus trap). */
function trapTabKey(event: KeyboardEvent, container: HTMLElement | null): void {
    if (!container) return;
    const focusable = getFocusable(container);
    if (focusable.length === 0) {
        event.preventDefault();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
        }
    } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
    }
}

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface ModalContextValue {
    /** Shared id wiring `aria-labelledby` (dialog) to the ModalTitle. */
    titleId: string;
    /** Sticky header/footer mode. */
    sticky: boolean;
    /** Called by ModalTitle so the dialog can point `aria-labelledby` at it. */
    registerTitle: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(): ModalContextValue | null {
    return useContext(ModalContext);
}

/* ------------------------------------------------------------------ */
/*  Modal (root)                                                      */
/* ------------------------------------------------------------------ */

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Whether the modal is open. Controlled by the parent. */
    active: boolean;
    /**
     * Called when the user dismisses the modal via a click outside the dialog
     * or the Escape key. The parent is expected to flip `active` to false.
     */
    onClickOutside?: () => void;
    /** Sticky header + footer while the body scrolls. */
    sticky?: boolean;
    /**
     * Element focused when the modal opens. Defaults to the first focusable
     * element inside the dialog. A `readonly current` shape is used so refs
     * to any element subtype (button, input, …) are accepted.
     */
    initialFocusRef?: { readonly current: HTMLElement | null };
    /** Dialog width. Numbers are treated as pixels. Default = 540. */
    width?: number | string;
    children?: ReactNode;
}

/**
 * Modal — a focus-trapping dialog rendered in a portal on document.body.
 *
 * DOM + styling sources:
 * - Overlay + backdrop: chunk 1c419a75d7e589ae.css (`.geist-overlay`,
 *   `.geist-overlay-backdrop`), renamed to `.overlay` / `.backdrop`.
 * - Dialog / body / header / title / subtitle / actions: geistcn snapshot
 *   `_nextstatic/component-inspect-element/modal.html` (Tailwind arbitrary
 *   values translated into the CSS module).
 * - Motion: `--ds-motion-overlay-*` tokens (opacity + scale, 300ms).
 *
 * API mirrors https://vercel.com/geist/modal.md verbatim: `active`,
 * `onClickOutside`, `sticky`, `initialFocusRef`.
 */
const ModalRoot = forwardRef<HTMLDivElement, ModalProps>(
    (
        {
            active,
            onClickOutside,
            sticky = false,
            initialFocusRef,
            width = 540,
            className,
            children,
            style,
            ...rest
        },
        ref,
    ) => {
        const titleId = useId();
        const [hasTitle, setHasTitle] = useState(false);
        const registerTitle = useCallback(() => setHasTitle(true), []);

        // Presence in the DOM (`shouldRender`) is decoupled from the visual
        // open state (`isVisible`) so the exit animation can play before unmount.
        const [shouldRender, setShouldRender] = useState(active);
        const [isVisible, setIsVisible] = useState(false);

        const dialogRef = useRef<HTMLDivElement | null>(null);
        const wrapperRef = useRef<HTMLDivElement | null>(null);

        // Keep the latest close callback without re-running the mount effect.
        const onClickOutsideRef = useRef(onClickOutside);
        onClickOutsideRef.current = onClickOutside;

        // Merge the forwarded ref with the internal dialog ref.
        const setDialogRef = useCallback(
            (node: HTMLDivElement | null) => {
                dialogRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },
            [ref],
        );

        // Mount as soon as we are asked to open.
        useEffect(() => {
            if (active) setShouldRender(true);
        }, [active]);

        // Drive the enter / exit transition.
        useEffect(() => {
            if (!shouldRender) return;
            if (active) {
                // Flip to the visible state on the next frame so the transition
                // runs from the closed (opacity 0 / scaled) state.
                const raf = requestAnimationFrame(() => setIsVisible(true));
                return () => cancelAnimationFrame(raf);
            }
            setIsVisible(false);
            const timer = window.setTimeout(() => setShouldRender(false), OVERLAY_DURATION_MS);
            return () => window.clearTimeout(timer);
        }, [active, shouldRender]);

        // Focus trap, scroll lock, Escape + Tab handling. Runs while mounted.
        useEffect(() => {
            if (!shouldRender) return;
            const dialog = dialogRef.current;
            const previouslyFocused = document.activeElement as HTMLElement | null;

            // Scroll lock.
            const body = document.body;
            const prevOverflow = body.style.overflow;
            body.style.overflow = 'hidden';

            // Initial focus: explicit ref → first focusable → dialog itself.
            const focusTarget =
                initialFocusRef?.current ?? getFocusable(dialog)[0] ?? dialog ?? wrapperRef.current;
            focusTarget?.focus();

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    onClickOutsideRef.current?.();
                    return;
                }
                if (event.key === 'Tab') {
                    trapTabKey(event, dialog);
                }
            };
            document.addEventListener('keydown', handleKeyDown, true);

            return () => {
                document.removeEventListener('keydown', handleKeyDown, true);
                body.style.overflow = prevOverflow;
                // Return focus to the element that opened the modal.
                previouslyFocused?.focus?.();
            };
        }, [shouldRender, initialFocusRef]);

        const contextValue = useMemo<ModalContextValue>(
            () => ({ titleId, sticky, registerTitle }),
            [titleId, sticky, registerTitle],
        );

        if (!shouldRender || typeof document === 'undefined') return null;

        const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
            // Dismiss only when the click lands outside the dialog.
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClickOutsideRef.current?.();
            }
        };

        const dialogStyle: React.CSSProperties = {
            width: typeof width === 'number' ? `${width}px` : width,
            opacity: isVisible ? 1 : 0,
            transform: `scale(${isVisible ? 1 : OVERLAY_SCALE})`,
        };

        return createPortal(
            <ModalContext.Provider value={contextValue}>
                <div className={cn(styles.backdrop, isVisible && styles.active)} aria-hidden="true" />
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    {/* tabindex=-1 wrapper mirrors the Geist focus-lock container. */}
                    <div className={styles.wrapper} tabIndex={-1} ref={wrapperRef}>
                        <div
                            {...rest}
                            ref={setDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={hasTitle ? titleId : undefined}
                            data-oxobz-modal=""
                            data-version="v1"
                            className={cn(styles.modal, sticky && styles.sticky, className)}
                            style={{ ...dialogStyle, ...style }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </ModalContext.Provider>,
            document.body,
        );
    },
);
ModalRoot.displayName = 'Modal';

/* ------------------------------------------------------------------ */
/*  ModalBody                                                         */
/* ------------------------------------------------------------------ */

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * ModalBody — scrollable content region. Structure follows the snapshot:
 * `[data-oxobz-modal-body] > div(content) + 2 aria-hidden sentinels`.
 * The sentinels are inert DOM markers kept for parity with Geist's
 * sticky-shadow observer (the observer itself is not implemented).
 */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
    ({ className, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn('text-copy-16', styles.body, className)}
            data-oxobz-modal-body=""
        >
            <div>{children}</div>
            <div aria-hidden="true" className={styles.sentinelTop} />
            <div aria-hidden="true" className={styles.sentinelBottom} />
        </div>
    ),
);
ModalBody.displayName = 'ModalBody';

/* ------------------------------------------------------------------ */
/*  ModalHeader                                                       */
/* ------------------------------------------------------------------ */

export interface ModalHeaderProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode;
}

/** ModalHeader — `<header>` wrapping the title + subtitle. */
export const ModalHeader = forwardRef<HTMLElement, ModalHeaderProps>(
    ({ className, children, ...props }, ref) => (
        <header {...props} ref={ref} className={cn(styles.header, className)} data-oxobz-modal-header="">
            {children}
        </header>
    ),
);
ModalHeader.displayName = 'ModalHeader';

/* ------------------------------------------------------------------ */
/*  ModalTitle                                                        */
/* ------------------------------------------------------------------ */

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: ReactNode;
}

/**
 * ModalTitle — `<h3>` (text-heading-24). Registers itself with the Modal so
 * the dialog's `aria-labelledby` points at its id.
 */
export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
    ({ className, children, id: idProp, ...props }, ref) => {
        const ctx = useModalContext();
        useEffect(() => {
            ctx?.registerTitle();
        }, [ctx]);
        return (
            <h3
                {...props}
                ref={ref}
                id={idProp ?? ctx?.titleId}
                className={cn('text-heading-24', styles.title, className)}
                data-oxobz-modal-title=""
            >
                {children}
            </h3>
        );
    },
);
ModalTitle.displayName = 'ModalTitle';

/* ------------------------------------------------------------------ */
/*  ModalSubtitle                                                     */
/* ------------------------------------------------------------------ */

export interface ModalSubtitleProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/** ModalSubtitle — supporting copy below the title (text-copy-16). */
export const ModalSubtitle = forwardRef<HTMLDivElement, ModalSubtitleProps>(
    ({ className, children, ...props }, ref) => (
        <div
            {...props}
            ref={ref}
            className={cn('text-copy-16', className)}
            data-oxobz-modal-subtitle=""
        >
            {children}
        </div>
    ),
);
ModalSubtitle.displayName = 'ModalSubtitle';

/* ------------------------------------------------------------------ */
/*  ModalInset                                                        */
/* ------------------------------------------------------------------ */

export interface ModalInsetProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * ModalInset — full-bleed content band inside the body. Styling from the
 * modal module in chunk 1c419a75d7e589ae.css (`modal-module__inset`); no
 * dedicated snapshot exists for this sub-component.
 */
export const ModalInset = forwardRef<HTMLDivElement, ModalInsetProps>(
    ({ className, children, ...props }, ref) => (
        <div {...props} ref={ref} className={cn(styles.inset, className)} data-oxobz-modal-inset="">
            {children}
        </div>
    ),
);
ModalInset.displayName = 'ModalInset';

/* ------------------------------------------------------------------ */
/*  ModalActions                                                      */
/* ------------------------------------------------------------------ */

export interface ModalActionsProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode;
}

/** ModalActions — sticky `<footer>` holding the action buttons. */
export const ModalActions = forwardRef<HTMLElement, ModalActionsProps>(
    ({ className, children, ...props }, ref) => (
        <footer {...props} ref={ref} className={cn(styles.actions, className)} data-oxobz-modal-actions="">
            {children}
        </footer>
    ),
);
ModalActions.displayName = 'ModalActions';

/* ------------------------------------------------------------------ */
/*  ModalAction                                                       */
/* ------------------------------------------------------------------ */

export interface ModalActionProps extends Omit<ButtonProps, 'typeName'> {
    /** Button variant. Default = 'default' (secondary is used for Cancel). */
    variant?: ButtonVariant;
    /** Stretch the action to the full available width (single-button footer). */
    fullWidth?: boolean;
}

/**
 * ModalAction — footer button built on the shared Button component
 * (`type="button"`, per the snapshot). Cancel uses `variant="secondary"`,
 * the primary action uses the default variant.
 */
export const ModalAction = forwardRef<HTMLButtonElement, ModalActionProps>(
    ({ className, variant = 'default', size = 'medium', fullWidth = false, ...props }, ref) => (
        <Button
            {...props}
            ref={ref}
            variant={variant}
            size={size}
            typeName="button"
            className={cn(styles.action, fullWidth && styles.fullWidth, className)}
            data-oxobz-modal-action=""
        />
    ),
);
ModalAction.displayName = 'ModalAction';

/* ------------------------------------------------------------------ */
/*  Compound export                                                   */
/* ------------------------------------------------------------------ */

const Modal = Object.assign(ModalRoot, {
    Body: ModalBody,
    Header: ModalHeader,
    Title: ModalTitle,
    Subtitle: ModalSubtitle,
    Inset: ModalInset,
    Actions: ModalActions,
    Action: ModalAction,
});

// Flat sub-components (ModalBody, ModalHeader, …) are already exported inline
// via `export const`, matching the official docs names. `Modal` additionally
// exposes them as compound members (Modal.Body, Modal.Header, …).
export { Modal };
