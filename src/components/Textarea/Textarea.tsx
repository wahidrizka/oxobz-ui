'use client';

import {
    forwardRef,
    useId,
    type TextareaHTMLAttributes,
} from 'react';
import { Stop } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Textarea.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TextareaSize = 'small' | 'medium' | 'large';

export interface TextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Visual size of the field (default: 'medium') */
    size?: TextareaSize;

    /**
     * Error message rendered below the field. When set, the outline turns
     * red and the message is announced via role="alert".
     */
    error?: string;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Retrieve multi-line user input.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <label data-version="v1">
 *   <div class="wrapper [small|large] [error]" data-oxobz-textarea-wrapper="">
 *     <textarea class="textarea" id="textarea-:id:" spellcheck="false"
 *       autocapitalize="off" autocomplete="off" autocorrect="off"></textarea>
 *   </div>
 *   <!-- only with error -->
 *   <div aria-atomic="true" class="errorMessage" data-oxobz-error=""
 *     data-version="v1" id="textarea-:id:-error" role="alert">
 *     <div aria-hidden="true" class="errorIcon">…stop icon…</div>
 *     <div class="errorText">There has been an error.</div>
 *   </div>
 * </label>
 * ```
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className,
            disabled,
            error,
            id: idProp,
            size = 'medium',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const autoId = useId();
        const textareaId = idProp ?? `textarea-${autoId}`;
        const errorId = `${textareaId}-error`;
        const hasError = error != null && error !== '';

        return (
            <label data-version={dataVersion}>
                <div
                    className={cn(
                        styles.wrapper,
                        size !== 'medium' && styles[size],
                        hasError && styles.error,
                    )}
                    data-oxobz-textarea-wrapper=""
                >
                    <textarea
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        {...rest}
                        className={cn(styles.textarea, className)}
                        disabled={disabled}
                        id={textareaId}
                        ref={ref}
                    />
                </div>
                {hasError && (
                    <div
                        aria-atomic="true"
                        className={cn(
                            styles.errorMessage,
                            size === 'large' && styles.errorMessageLarge,
                        )}
                        data-oxobz-error=""
                        data-version="v1"
                        id={errorId}
                        role="alert"
                        style={{ marginTop: 'var(--oxobz-gap-quarter)' }}
                    >
                        <div aria-hidden="true" className={styles.errorIcon}>
                            <Stop color="red-900" size={16} />
                        </div>
                        <div className={styles.errorText}>{error}</div>
                    </div>
                )}
            </label>
        );
    },
);

Textarea.displayName = 'Textarea';

export { Textarea };
