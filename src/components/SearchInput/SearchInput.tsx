'use client';

import {
    forwardRef,
    useEffect,
    useRef,
    useState,
    type ChangeEventHandler,
    type FocusEventHandler,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { MagnifyingGlass } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Input, type InputSize } from '../Input';
import { Kbd } from '../Kbd';
import { Spinner } from '../Spinner';
import styles from './SearchInput.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SearchInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'type'> {
    /** Visual size, forwarded to the underlying Input (default 'medium'). */
    size?: InputSize;

    /**
     * Custom prefix content replacing the default magnifying-glass icon
     * (search-input.html, "Custom prefix icon"). Ignored while `loading`.
     */
    prefix?: ReactNode;

    /** Shows a spinner in the prefix slot in place of the search icon. */
    loading?: boolean;

    /**
     * Renders a "⌘K" shortcut hint in the suffix that morphs into "Esc"
     * while the field is focused, and focuses the field on Cmd/Ctrl+K
     * anywhere on the page (search-input.html, "With Cmdk"). Takes
     * precedence over the automatic clear button.
     */
    cmdk?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Sets an <input>'s value through the native setter and dispatches a
 * bubbling `input` event, so both controlled and uncontrolled consumers
 * observe the change through their `onChange` — the same trick Input uses
 * for its own Escape-to-clear behaviour (Input.tsx).
 */
function setNativeInputValue(input: HTMLInputElement, value: string): void {
    const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
    )?.set;
    setValue?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Pre-configured search input with a magnifying glass icon and clear
 * button (search-input.html intro copy). A thin composition over Input —
 * it only adds the prefix icon / loading spinner, the cmdk shortcut hint,
 * and the auto-appearing clear button. Escape-to-clear on a non-empty
 * field is inherited for free from Input's own `type="search"` behaviour.
 *
 * Rendered DOM:
 * ```html
 * <div data-oxobz-search-input="" data-version="v1">
 *   <!-- Input's own wrapper: div[data-oxobz-input-wrapper] > input + affixes -->
 * </div>
 * ```
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            className,
            cmdk = false,
            defaultValue,
            disabled,
            loading = false,
            onBlur,
            onChange,
            onFocus,
            prefix,
            value,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        forwardedRef,
    ) => {
        const inputRef = useRef<HTMLInputElement | null>(null);
        const [focused, setFocused] = useState(false);
        const [internalValue, setInternalValue] = useState(
            defaultValue != null ? String(defaultValue) : '',
        );

        const isControlled = value !== undefined;
        const currentValue = isControlled ? value : internalValue;
        const hasValue = currentValue != null && String(currentValue).length > 0;

        // cmdk: focus the field from anywhere on the page via Cmd/Ctrl+K
        // (search-input.html, "Press Cmd + K to open the Command Menu").
        useEffect(() => {
            if (!cmdk) return undefined;
            const handleWindowKeyDown = (e: KeyboardEvent) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            };
            window.addEventListener('keydown', handleWindowKeyDown);
            return () => window.removeEventListener('keydown', handleWindowKeyDown);
        }, [cmdk]);

        const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
        };

        const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
            setFocused(true);
            onFocus?.(e);
        };

        const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
            setFocused(false);
            onBlur?.(e);
        };

        const handleClear = () => {
            const input = inputRef.current;
            if (!input || disabled) return;
            if (!isControlled) setInternalValue('');
            setNativeInputValue(input, '');
            input.focus();
        };

        const prefixContent: ReactNode = loading ? (
            <Spinner aria-label="Loading" role="status" size="md" />
        ) : (
            (prefix ?? <MagnifyingGlass size={16} />)
        );

        const showClearButton = !cmdk && hasValue && !disabled;

        const suffixContent: ReactNode = cmdk ? (
            <div
                aria-label="Press Cmd + K to open the Command Menu"
                className={styles.cmdkHint}
                data-animate={focused ? 'true' : 'false'}
            >
                <Kbd className={styles.escCmdKbd} small>
                    <span className={styles.escLabel} data-key="esc">
                        Esc
                    </span>
                    <span className={styles.cmdLabel} data-key="cmd">
                        ⌘
                    </span>
                </Kbd>
                <Kbd className={styles.kKbd} small>
                    K
                </Kbd>
            </div>
        ) : showClearButton ? (
            <button
                aria-label="Clear search"
                className={styles.clearButton}
                onClick={handleClear}
                type="button"
            >
                <Kbd className={styles.clearKbd} small>
                    Esc
                </Kbd>
            </button>
        ) : undefined;

        return (
            <div
                className={cn(styles.root, className)}
                data-oxobz-search-input=""
                data-version={dataVersion}
            >
                <Input
                    {...rest}
                    aria-label={rest['aria-label'] ?? 'Search'}
                    defaultValue={defaultValue}
                    disabled={disabled}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    prefix={prefixContent}
                    ref={(node) => {
                        inputRef.current = node;
                        if (typeof forwardedRef === 'function') forwardedRef(node);
                        else if (forwardedRef) forwardedRef.current = node;
                    }}
                    suffix={suffixContent}
                    type="search"
                    value={value}
                />
            </div>
        );
    },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
