'use client';

import {
    forwardRef,
    useRef,
    useState,
    type ChangeEventHandler,
    type FocusEventHandler,
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
     * @oxobz/ui ships no Command Menu to wire ⌘K up to; the animation
     * toggles on focus/blur (see ClearableInput.module.css header for what
     * is and isn't grounded in the reference).
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
 * kbds (an animated Esc/⌘ swap + a sliding "K") — see the CSS module header
 * for exactly which parts of that animation are grounded in the reference.
 */
const ClearableInput = forwardRef<HTMLInputElement, ClearableInputProps>(
    (
        {
            className,
            cmdk = false,
            defaultValue,
            disabled,
            onBlur,
            onChange,
            onClear,
            onFocus,
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
        // Geist's cmdk hint swaps its ⌘K hint for "Esc" while the field is
        // focused (an inferred trigger — the reference only captures the
        // idle, unfocused state; see the CSS module header).
        const [animate, setAnimate] = useState(false);

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

        const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
            onFocus?.(e);
            if (cmdk) setAnimate(true);
        };

        const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
            onBlur?.(e);
            if (cmdk) setAnimate(false);
        };

        const handleClearClick: MouseEventHandler<HTMLButtonElement> = () => {
            if (disabled) return;
            clearValue();
        };

        const cmdkHint = (
            <div
                aria-label="Press Cmd + K to open the Command Menu"
                className={styles.cmdkHint}
                data-animate={animate ? 'true' : 'false'}
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
                onBlur={handleBlur}
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                ref={setInputRef}
                suffix={suffix}
                value={value}
            />
        );
    },
);

ClearableInput.displayName = 'ClearableInput';

export { ClearableInput };
