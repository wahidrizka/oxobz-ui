import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { CheckCircle, Information, Stop, Warning } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Note.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Semantic type of the note (UseTypeTypes in the Geist docs).
 * Only secondary/success/error/warning/alert/violet/cyan have dedicated
 * colors in production — the rest fall back to the default gray look.
 */
export type NoteType =
    | 'default'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'error'
    | 'warning'
    | 'alert'
    | 'lite'
    | 'ghost'
    | 'violet'
    | 'cyan'
    | 'rotate-ccw';

export type NoteSize = 'small' | 'medium' | 'large';

export interface NoteProps extends HTMLAttributes<HTMLDivElement> {
    /** Semantic color type. Omit for the default info look. */
    type?: NoteType;

    /** Size of the note (default: medium) */
    size?: NoteSize;

    /** Filled background variant (only affects types with color rules) */
    fill?: boolean;

    /** Grays out the note, its links, icon, and any action button */
    disabled?: boolean;

    /**
     * Label prefix. By default the type icon is shown; a string renders a
     * bold "label: " text prefix instead; `false` hides the label entirely.
     */
    label?: string | false;

    /** Single inline CTA rendered at the end of the note */
    action?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Default label icon                                                 */
/* ------------------------------------------------------------------ */

/**
 * Default label icon per type (verified against note.html snapshot):
 * success → CheckCircle (blue-900), error → Stop (red-900),
 * warning → Warning (amber-900), everything else → Information
 * (currentcolor). Production renders every icon at 14×14.
 */
function NoteTypeIcon({ type }: { type?: NoteType }) {
    switch (type) {
        case 'success':
            return <CheckCircle color="var(--ds-blue-900)" size={14} />;
        case 'error':
            return <Stop color="var(--ds-red-900)" size={14} />;
        case 'warning':
            return <Warning color="var(--ds-amber-900)" size={14} />;
        default:
            return <Information size={14} />;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Display text that requires attention or provides additional information.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <div class="note [size] [action] [type] [fill] [disabled]"
 *      data-oxobz-note="" data-version="v1">
 *   <div class="content" style="gap: 12px">
 *     <span class="iconContainer">…svg…</span>
 *     <span>{children}</span>
 *   </div>
 *   <div>{action}</div>
 * </div>
 * ```
 */
const Note = forwardRef<HTMLDivElement, NoteProps>(
    (
        {
            action,
            children,
            className,
            disabled = false,
            fill = false,
            label,
            size = 'medium',
            type,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const hasCustomLabel = typeof label === 'string';
        const showIcon = !hasCustomLabel && label !== false;

        // Content gap set inline in production: 4px in custom-label mode,
        // otherwise 8px (small) / 12px (medium, large).
        const contentGap = hasCustomLabel ? 4 : size === 'small' ? 8 : 12;

        return (
            <div
                {...rest}
                className={cn(
                    styles.note,
                    size !== 'medium' && styles[size],
                    action != null && styles.action,
                    type && styles[type],
                    type && fill && styles.fill,
                    disabled && styles.disabled,
                    className,
                )}
                data-oxobz-note=""
                data-slot="note"
                data-version={dataVersion}
                role="note"
                ref={ref}
            >
                <div
                    className={cn(
                        styles.content,
                        hasCustomLabel && styles.hasLabel,
                    )}
                    data-slot="note-body"
                    style={{ gap: contentGap }}
                >
                    {showIcon && (
                        <span className={styles.iconContainer} data-slot="note-icon">
                            <NoteTypeIcon type={type} />
                        </span>
                    )}
                    {hasCustomLabel && (
                        <span className={styles.label}>{`${label}: `}</span>
                    )}
                    <span>{children}</span>
                </div>
                {action != null && <div>{action}</div>}
            </div>
        );
    },
);

Note.displayName = 'Note';

export { Note };
