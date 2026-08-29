'use client';

import {
    forwardRef,
    useRef,
    useState,
    type ChangeEventHandler,
    type KeyboardEventHandler,
    type MouseEventHandler,
    type MutableRefObject,
    type Ref,
} from 'react';
import { Input, type InputProps } from '../Input';
import { Kbd } from '../Kbd';
import styles from './ClearableInput.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClearableInputProps
    extends Omit<InputProps, 'suffix' | 'suffixContainer' | 'suffixStyling'> {
    /**
     * Renders the "Press Cmd + K to open the Command Menu" shortcut hint
     * (an animated Esc/⌘ swap + a sliding "K" kbd) instead of the plain
     * clear button (Geist "With Cmdk" example). The hint is purely visual —
     * @oxobz/ui ships no Command Menu to wire ⌘K up to; the animation runs
     * whenever the field holds a value (measured on the live page: focusing
     * an empty field leaves data-animate="false").
     */
    cmdk?: boolean;

    /** Called after the value is cleared, via the clear button or Escape. */
    onClear?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Assigns a value to a forwarded ref of either shape (function or object). */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref != null) {
        (ref as MutableRefObject<T | null>).current = value;
    }
}

/**
 * Sets a native input's value via the prototype setter and dispatches a real
 * `input` event, so React's onChange fires for both controlled and
 * uncontrolled consumers — the exact trick Input.tsx already uses for its
 * own search-type Escape-to-clear behaviour.
 */
function clearNativeInput(input: HTMLInputElement): void {
    const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
    )?.set;
    setter?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Text input with a clear (Esc) button that resets the value on click or on
 * Escape — a standalone Geist component (`@vercel/geistcn/components`), not
 * a prop of Input. It wraps Input and only supplies its own suffix.
 *
 * Rendered DOM (Geist production structure, non-cmdk / has a value):
 * ```html
 * <div data-oxobz-input-wrapper="" data-version="v1" class="container suffix">
 *   <input data-oxobz-input="" data-oxobz-clearable-input="" .../>
 *   <label aria-hidden="true" data-oxobz-input-suffix="" for="input-:id:">
 *     <button type="button" tabindex="-1">
 *       <kbd data-oxobz-kbd="">Esc</kbd>
 *     </button>
 *   </label>
 * </div>
 * ```
 * The suffix is only rendered while the field has a value — an empty field
 * renders no suffix at all (Geist "Default" example).
 *
 * With `cmdk`, the suffix is instead an always-visible shortcut hint with two
 * kbds (an animated Esc/⌘ swap + a sliding "K"). The swap is driven by
 * `data-animate`, which production sets while the field holds a value.
 */
const ClearableInput = forwardRef<HTMLInputElement, ClearableInputProps>(
    (
        {
            className,
            cmdk = false,
            defaultValue,
            disabled,
            onChange,
            onClear,
            onKeyDown,
            value,
            ...rest
        },
        forwardedRef,
    ) => {
        const inputRef = useRef<HTMLInputElement | null>(null);
        const isControlled = value !== undefined;
        const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
            () => defaultValue != null && String(defaultValue).length > 0,
        );

        const hasValue = isControlled
            ? String(value ?? '').length > 0
            : uncontrolledHasValue;

        const setInputRef = (node: HTMLInputElement | null): void => {
            inputRef.current = node;
            assignRef(forwardedRef, node);
        };

        const clearValue = (): void => {
            const input = inputRef.current;
            if (!input) return;
            clearNativeInput(input);
            input.focus();
            onClear?.();
        };

        const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
            onChange?.(e);
            if (!isControlled) {
                setUncontrolledHasValue(e.currentTarget.value.length > 0);
            }
        };

        const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
            onKeyDown?.(e);
            if (
                e.key === 'Escape' &&
                !e.defaultPrevented &&
                !disabled &&
                hasValue
            ) {
                clearValue();
            }
        };

        const handleClearClick: MouseEventHandler<HTMLButtonElement> = () => {
            if (disabled) return;
            clearValue();
        };

        const cmdkHint = (
            <div
                aria-label="Press Cmd + K to open the Command Menu"
                className={styles.cmdkHint}
                data-animate={hasValue ? 'true' : 'false'}
            >
                <Kbd aria-hidden="true" className={styles.kbdSwap} small>
                    <span className={styles.escSpan} data-key="esc">
                        Esc
                    </span>
                    <span className={styles.cmdSpan} data-key="cmd">
                        ⌘
                    </span>
                </Kbd>
                <Kbd aria-hidden="true" className={styles.cmdkKbdK} small>
                    K
                </Kbd>
            </div>
        );

        const clearButton = (
            <button
                className={styles.clearButton}
                onClick={handleClearClick}
                tabIndex={-1}
                type="button"
            >
                <Kbd className={styles.clearKbd} small>
                    Esc
                </Kbd>
            </button>
        );

        const suffix = cmdk ? cmdkHint : hasValue ? clearButton : undefined;

        return (
            <Input
                {...rest}
                className={className}
                data-oxobz-clearable-input=""
                defaultValue={defaultValue}
                disabled={disabled}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                innerWrapperClassName={styles.wrapper}
                ref={setInputRef}
                suffix={suffix}
                value={value}
            />
        );
    },
);

ClearableInput.displayName = 'ClearableInput';

export { ClearableInput };
