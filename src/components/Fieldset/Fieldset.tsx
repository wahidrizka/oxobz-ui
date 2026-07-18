import {
    Children,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Fieldset.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Semantic tint applied to the whole card (border) and its footer. */
export type FieldsetType = 'error' | 'warning';

export interface FieldsetProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Semantic tint. Adds a colored border around the whole card (replacing
     * the default hairline shadow) and tints the footer to match, via
     * `data-fieldset-type` on the root (fieldset.html "Error Type" / "Warning
     * Type").
     */
    type?: FieldsetType;
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Context (Content ⇄ Title/Subtitle wiring)                          */
/* ------------------------------------------------------------------ */

interface FieldsetContentContextValue {
    /** Id assigned to FieldsetTitle so FieldsetContent can point aria-labelledby at it. */
    titleId: string;
    /** Whether the enclosing FieldsetContent is disabled (dims descendant text). */
    disabled: boolean;
    /** Called by FieldsetTitle so the content can wire aria-labelledby. */
    registerTitle: () => void;
}

const FieldsetContentContext = createContext<FieldsetContentContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Fieldset (root)                                                    */
/* ------------------------------------------------------------------ */

/**
 * Fieldset — a bordered settings card grouping a content region (title +
 * subtitle + arbitrary body) with an optional footer (status text + actions).
 *
 * Rendered DOM / styling sources (fieldset.html, all 11 documented examples):
 * - Root: `.material-base` (chunk 20v_289ahbeyd.css / 2dd69db0a79ce415.css) —
 *   `background-color: var(--ds-background-100); box-shadow: var(--ds-shadow-border);
 *   border-radius: 6px` — plus `relative overflow-hidden`.
 * - `type="error" | "warning"`: root additionally gets `border: 1px solid
 *   var(--ds-red-400|--ds-amber-400); box-shadow: none` and `data-fieldset-type`,
 *   which the footer tints via a `[data-fieldset-type] > footer` selector
 *   (Tailwind `group-data-[fieldset-type=…]/fieldset:*` in the snapshot).
 */
const FieldsetRoot = forwardRef<HTMLDivElement, FieldsetProps>(
    ({ type, className, children, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(
                styles.fieldset,
                type === 'error' && styles.typeError,
                type === 'warning' && styles.typeWarning,
                className,
            )}
            data-oxobz-fieldset=""
            data-fieldset-type={type}
            data-version="v1"
        >
            {children}
        </div>
    ),
);
FieldsetRoot.displayName = 'Fieldset';

/* ------------------------------------------------------------------ */
/*  FieldsetContent                                                    */
/* ------------------------------------------------------------------ */

export interface FieldsetContentProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Dims the region (`color: var(--ds-gray-700)`, grayscale icons) and
     * auto-renders a {@link DisabledWall} as the first child, matching the
     * "Disabled" / "With Disabled Wall" examples.
     */
    disabled?: boolean;
    children?: ReactNode;
}

/**
 * FieldsetContent — the title/subtitle/body region. Always the first child
 * of {@link Fieldset}; rounds its bottom corners itself when there is no
 * {@link FieldsetFooter} sibling (fieldset.html "Without Footer": Tailwind
 * `last:rounded-bl-[6px] last:rounded-br-[6px]`, replicated here via
 * `:last-child`).
 */
const FieldsetContent = forwardRef<HTMLDivElement, FieldsetContentProps>(
    ({ disabled = false, className, children, ...rest }, ref) => {
        const titleId = useId();
        const [hasTitle, setHasTitle] = useState(false);
        const registerTitle = useCallback(() => setHasTitle(true), []);

        return (
            <FieldsetContentContext.Provider value={{ titleId, disabled, registerTitle }}>
                <div
                    {...rest}
                    ref={ref}
                    aria-labelledby={hasTitle ? titleId : undefined}
                    className={cn(styles.content, disabled && styles.disabled, className)}
                    data-oxobz-fieldset-content=""
                >
                    {disabled && <DisabledWall />}
                    {children}
                </div>
            </FieldsetContentContext.Provider>
        );
    },
);
FieldsetContent.displayName = 'FieldsetContent';

/* ------------------------------------------------------------------ */
/*  FieldsetTitle                                                      */
/* ------------------------------------------------------------------ */

export interface FieldsetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: ReactNode;
}

/** FieldsetTitle — `<h4>` (text-heading-20). Optional (fieldset.html "Without Title"). */
const FieldsetTitle = forwardRef<HTMLHeadingElement, FieldsetTitleProps>(
    ({ className, children, id: idProp, ...rest }, ref) => {
        const ctx = useContext(FieldsetContentContext);
        useEffect(() => {
            ctx?.registerTitle();
        }, [ctx]);

        return (
            <h4
                {...rest}
                ref={ref}
                id={idProp ?? ctx?.titleId}
                className={cn('text-heading-20', styles.title, className)}
                data-oxobz-fieldset-title=""
            >
                {children}
            </h4>
        );
    },
);
FieldsetTitle.displayName = 'FieldsetTitle';

/* ------------------------------------------------------------------ */
/*  FieldsetSubtitle                                                   */
/* ------------------------------------------------------------------ */

export interface FieldsetSubtitleProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: ReactNode;
}

/**
 * FieldsetSubtitle — `<p>` (text-copy-14). Its dimmed color while the parent
 * FieldsetContent is disabled comes from CSS inheritance (`.content.disabled`
 * sets `color`) — production adds an extra bare `.disabled` class here that
 * has no matching rule in any reference chunk, so it is not fabricated.
 */
const FieldsetSubtitle = forwardRef<HTMLParagraphElement, FieldsetSubtitleProps>(
    ({ className, children, ...rest }, ref) => (
        <p
            {...rest}
            ref={ref}
            className={cn('text-copy-14', styles.subtitle, className)}
            data-oxobz-fieldset-subtitle=""
        >
            {children}
        </p>
    ),
);
FieldsetSubtitle.displayName = 'FieldsetSubtitle';

/* ------------------------------------------------------------------ */
/*  FieldsetFooter                                                     */
/* ------------------------------------------------------------------ */

export interface FieldsetFooterProps extends HTMLAttributes<HTMLElement> {
    /**
     * Renders arbitrary children directly (no status/actions split) against
     * `background-color: var(--bg, #f5f5f5)` instead of the default
     * `var(--ds-background-200)` — used for the "Disabled" / "With Disabled
     * Wall" plain-message footers.
     */
    highlight?: boolean;
    children?: ReactNode;
}

/**
 * FieldsetFooter — `<footer>` below {@link FieldsetContent}. Optional
 * (fieldset.html "Without Footer"). Tinted red/amber when the parent
 * {@link Fieldset} has `type="error" | "warning"` via a `[data-fieldset-type]
 * > footer` selector in the module (see {@link FieldsetRoot}).
 */
const FieldsetFooter = forwardRef<HTMLElement, FieldsetFooterProps>(
    ({ highlight = false, className, children, ...rest }, ref) => (
        <footer
            {...rest}
            ref={ref}
            className={cn(styles.footer, highlight && styles.highlight, className)}
            data-oxobz-fieldset-footer=""
            data-version="v1"
        >
            {children}
        </footer>
    ),
);
FieldsetFooter.displayName = 'FieldsetFooter';

/* ------------------------------------------------------------------ */
/*  FieldsetFooterStatus                                               */
/* ------------------------------------------------------------------ */

export interface FieldsetFooterStatusProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/** FieldsetFooterStatus — left-aligned status text inside {@link FieldsetFooter}. */
const FieldsetFooterStatus = forwardRef<HTMLDivElement, FieldsetFooterStatusProps>(
    ({ className, children, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.footerStatus, className)}
            data-oxobz-fieldset-footer-status=""
        >
            {children}
        </div>
    ),
);
FieldsetFooterStatus.displayName = 'FieldsetFooterStatus';

/* ------------------------------------------------------------------ */
/*  FieldsetFooterAction                                                */
/* ------------------------------------------------------------------ */

export interface FieldsetFooterActionProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * FieldsetFooterAction — wraps a single action button. Normally rendered
 * automatically by {@link FieldsetFooterActions} (one per child); exported
 * directly for advanced/manual composition.
 */
const FieldsetFooterAction = forwardRef<HTMLDivElement, FieldsetFooterActionProps>(
    ({ className, children, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.footerAction, className)}
            data-oxobz-fieldset-footer-action=""
        >
            {children}
        </div>
    ),
);
FieldsetFooterAction.displayName = 'FieldsetFooterAction';

/* ------------------------------------------------------------------ */
/*  FieldsetFooterActions                                              */
/* ------------------------------------------------------------------ */

export interface FieldsetFooterActionsProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * FieldsetFooterActions — right-aligned action row inside
 * {@link FieldsetFooter}. Every direct child is auto-wrapped in a
 * {@link FieldsetFooterAction} (fieldset.html: `<Button>Save Changes</Button>`
 * renders as `<div data-geist-fieldset-footer-action><button>…`; two buttons
 * each get their own wrapper — confirmed by the "With Warning Text" /
 * "Error Type" examples).
 */
const FieldsetFooterActions = forwardRef<HTMLDivElement, FieldsetFooterActionsProps>(
    ({ className, children, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.footerActions, className)}
            data-oxobz-fieldset-footer-actions=""
        >
            {Children.map(children, (child, index) => (
                <FieldsetFooterAction key={index}>{child}</FieldsetFooterAction>
            ))}
        </div>
    ),
);
FieldsetFooterActions.displayName = 'FieldsetFooterActions';

/* ------------------------------------------------------------------ */
/*  ErrorText / WarningText                                             */
/* ------------------------------------------------------------------ */

export interface ErrorTextProps extends HTMLAttributes<HTMLSpanElement> {
    children?: ReactNode;
}

/**
 * ErrorText — inline red validation message (`color: var(--ds-red-900)`).
 * Placed by the consumer anywhere inside {@link FieldsetContent} (fieldset.html
 * "With Error Text" wraps it in a plain `<div className="mt-4">`, which is
 * NOT part of this component). Distinct from the standalone `Error` component
 * (icon + `role="alert"` callout) — this is plain inline text scoped to Fieldset
 * (`data-geist-fieldset-error` in production).
 */
const ErrorText = forwardRef<HTMLSpanElement, ErrorTextProps>(
    ({ className, children, ...rest }, ref) => (
        <span
            {...rest}
            ref={ref}
            className={cn(styles.errorText, className)}
            data-oxobz-fieldset-error=""
            data-version="v1"
        >
            {children}
        </span>
    ),
);
ErrorText.displayName = 'ErrorText';

export interface WarningTextProps extends HTMLAttributes<HTMLSpanElement> {
    children?: ReactNode;
}

/** WarningText — inline amber message (`color: var(--ds-amber-900)`). See {@link ErrorText}. */
const WarningText = forwardRef<HTMLSpanElement, WarningTextProps>(
    ({ className, children, ...rest }, ref) => (
        <span
            {...rest}
            ref={ref}
            className={cn(styles.warningText, className)}
            data-oxobz-fieldset-warning=""
            data-version="v1"
        >
            {children}
        </span>
    ),
);
WarningText.displayName = 'WarningText';

/* ------------------------------------------------------------------ */
/*  DisabledWall                                                       */
/* ------------------------------------------------------------------ */

export interface DisabledWallProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * DisabledWall — an invisible, absolutely-positioned overlay
 * (`inset: 0; cursor: not-allowed; user-select: none`) that blocks pointer
 * interaction with whatever it shares a `position: relative` ancestor with.
 * Auto-rendered by `<FieldsetContent disabled>` as the first child; can also
 * be placed manually to gate part of the content only (fieldset.html "With
 * Disabled Wall": a second `<DisabledWall />` inside a nested
 * `<div className="relative …">`).
 */
const DisabledWall = forwardRef<HTMLDivElement, DisabledWallProps>(
    ({ className, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.disabledWall, className)}
            data-oxobz-fieldset-disabled-wall=""
            data-version="v1"
        />
    ),
);
DisabledWall.displayName = 'DisabledWall';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Fieldset = Object.assign(FieldsetRoot, {
    Content: FieldsetContent,
    Title: FieldsetTitle,
    Subtitle: FieldsetSubtitle,
    Footer: FieldsetFooter,
    FooterStatus: FieldsetFooterStatus,
    FooterActions: FieldsetFooterActions,
    FooterAction: FieldsetFooterAction,
    ErrorText,
    WarningText,
    DisabledWall,
});

// Flat sub-components are already exported inline via `export const` (below),
// matching the geistcn docs names (`FieldsetContent`, `ErrorText`, …). `Fieldset`
// additionally exposes them as compound members (Fieldset.Content, …), same
// pattern as `Modal`.
export {
    Fieldset,
    FieldsetContent,
    FieldsetTitle,
    FieldsetSubtitle,
    FieldsetFooter,
    FieldsetFooterStatus,
    FieldsetFooterActions,
    FieldsetFooterAction,
    ErrorText,
    WarningText,
    DisabledWall,
};
