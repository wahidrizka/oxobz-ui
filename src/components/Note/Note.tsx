'use client';

import {
    Children,
    forwardRef,
    isValidElement,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { CheckCircle, Information, Stop, Warning } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Note.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Color variant of the note. Production Geist has exactly these six —
 * `variant="info"` does not exist (Best Practices: "omit `variant` for the
 * default info icon or use `variant=\"secondary\"` for neutral copy").
 */
export type NoteVariant =
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'violet'
    | 'cyan';

/** Production renders only small + medium (default) notes — no large. */
export type NoteSize = 'small' | 'medium';

export interface NoteProps extends HTMLAttributes<HTMLDivElement> {
    /** Color variant. Omit for the default (gray, info-icon) look. */
    variant?: NoteVariant;

    /** Size of the note. Default `'medium'`. */
    size?: NoteSize;

    /** Filled background (only styled in combination with a variant). */
    fill?: boolean;

    /** Grays out the note, its links, and any action button. */
    disabled?: boolean;

    /**
     * Overrides the variant's default icon. Pass `null` to render no icon
     * at all (Geist: "Pass a null icon to render no icon at all").
     */
    icon?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;

    /** NoteContent / NoteAction children. */
    children?: ReactNode;
}

export interface NoteContentProps extends HTMLAttributes<HTMLDivElement> {}
export interface NoteActionProps extends HTMLAttributes<HTMLDivElement> {}
export interface NoteLabelProps extends HTMLAttributes<HTMLSpanElement> {}

/* ------------------------------------------------------------------ */
/*  Default variant icon                                               */
/* ------------------------------------------------------------------ */

/**
 * Default icon per variant (mapping verified against the note.html
 * snapshot; the current generation inherits currentColor from the note's
 * variant text color — production svg carries style="color:currentColor").
 */
function NoteVariantIcon({ variant }: { variant?: NoteVariant }) {
    switch (variant) {
        case 'success':
            return <CheckCircle size={14} />;
        case 'error':
            return <Stop size={14} />;
        case 'warning':
            return <Warning size={14} />;
        default:
            return <Information size={14} />;
    }
}

/* ------------------------------------------------------------------ */
/*  NoteContent / NoteAction / NoteLabel                               */
/* ------------------------------------------------------------------ */

/** Body copy of the note (production: `<div class="min-w-0 flex-1">`). */
const NoteContent = forwardRef<HTMLDivElement, NoteContentProps>(
    ({ className, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.content, className)}
            data-slot="note-content"
        />
    ),
);
NoteContent.displayName = 'NoteContent';

/** Action area (buttons) — rendered as a sibling of the note body. */
const NoteAction = forwardRef<HTMLDivElement, NoteActionProps>(
    ({ className, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.actionSlot, className)}
            data-slot="note-action"
        />
    ),
);
NoteAction.displayName = 'NoteAction';

/** Bold 1–2 word Title Case prefix inside NoteContent (`Region Change:`). */
const NoteLabel = forwardRef<HTMLSpanElement, NoteLabelProps>(
    ({ className, ...rest }, ref) => (
        <span
            {...rest}
            ref={ref}
            className={cn(styles.label, className)}
            data-slot="note-label"
        />
    ),
);
NoteLabel.displayName = 'NoteLabel';

/* ------------------------------------------------------------------ */
/*  Note (root)                                                        */
/* ------------------------------------------------------------------ */

/**
 * Display text that requires attention or provides additional information.
 *
 * Rendered DOM (Geist production structure, live SSR 2026-07-21):
 * ```html
 * <div data-slot="note" role="note" [data-disabled="true"]>
 *   <div data-slot="note-body">
 *     <span data-slot="note-icon">…svg…</span>
 *     <div data-slot="note-content">…<span data-slot="note-label"/>…</div>
 *   </div>
 *   <div data-slot="note-action">…buttons…</div>
 * </div>
 * ```
 * NoteAction children are hoisted out of the body; everything else renders
 * inside it after the icon.
 */
const NoteRoot = forwardRef<HTMLDivElement, NoteProps>(
    (
        {
            children,
            className,
            disabled = false,
            fill = false,
            icon,
            size = 'medium',
            variant,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const kids = Children.toArray(children);
        const actionKids = kids.filter(
            (k) => isValidElement(k) && k.type === NoteAction,
        );
        const contentKids = kids.filter(
            (k) => !(isValidElement(k) && k.type === NoteAction),
        );

        return (
            <div
                {...rest}
                className={cn(
                    size === 'small' ? 'text-copy-13' : 'text-copy-14',
                    styles.note,
                    size === 'small' && styles.small,
                    variant && styles[variant],
                    fill && styles.fill,
                    actionKids.length > 0 && styles.hasAction,
                    disabled && styles.disabled,
                    className,
                )}
                data-oxobz-note=""
                data-slot="note"
                data-disabled={disabled ? 'true' : undefined}
                data-version={dataVersion}
                role="note"
                ref={ref}
            >
                <div className={styles.body} data-slot="note-body">
                    {icon !== null && (
                        <span className={styles.iconContainer} data-slot="note-icon">
                            {icon !== undefined ? (
                                icon
                            ) : (
                                <NoteVariantIcon variant={variant} />
                            )}
                        </span>
                    )}
                    {contentKids}
                </div>
                {actionKids}
            </div>
        );
    },
);

NoteRoot.displayName = 'Note';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Note = Object.assign(NoteRoot, {
    Content: NoteContent,
    Action: NoteAction,
    Label: NoteLabel,
});

export { Note, NoteContent, NoteAction, NoteLabel };
