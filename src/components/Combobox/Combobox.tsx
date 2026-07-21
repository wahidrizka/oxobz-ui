'use client';

import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type LiHTMLAttributes,
    type MutableRefObject,
    type ReactNode,
    type Ref,
} from 'react';
import { ChevronDown, Cross, MagnifyingGlass } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './Combobox.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Control size — form heights 32 / 40 / 48px (Geist `size`). */
export type ComboboxSize = 'small' | 'medium' | 'large';

/** Metadata a `ComboboxOption` registers with the root. */
interface OptionMeta {
    value: string;
    label: string;
    disabled: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Merge several refs into a single ref callback. */
function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
    return (node: T | null) => {
        for (const r of refs) {
            if (!r) continue;
            if (typeof r === 'function') r(node);
            else (r as MutableRefObject<T | null>).current = node;
        }
    };
}

/**
 * Whether an option label matches the current query. `null` query means the
 * user is not searching (freshly opened / selection shown) — everything shows.
 */
function matchesQuery(label: string, query: string | null): boolean {
    if (query === null || query === '') return true;
    return label.toLowerCase().includes(query.toLowerCase());
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ComboboxContextValue {
    open: boolean;
    disabled: boolean;
    errored: boolean;
    size: ComboboxSize;
    clearable: boolean;
    pristine: boolean;
    placeholder?: string;
    ariaLabel?: string;
    value: string | null;
    /** Current search string, or `null` when not searching. */
    query: string | null;
    /** id of the active (highlighted) option, mirrored in `aria-activedescendant`. */
    activeId: string | null;
    inputId: string;
    listId: string;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    visibleCount: number;
    register: (id: string, meta: OptionMeta) => void;
    unregister: (id: string) => void;
    matches: (label: string) => boolean;
    getLabel: (value: string) => string | undefined;
    getOrder: (id: string) => number;
    setActiveId: (id: string | null) => void;
    openList: () => void;
    closeList: () => void;
    toggleFromButton: () => void;
    focusInput: () => void;
    handleInputChange: (text: string) => void;
    selectOption: (value: string) => void;
    clearValue: () => void;
    onInputKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(component: string): ComboboxContextValue {
    const ctx = useContext(ComboboxContext);
    if (!ctx) {
        throw new Error(`${component} must be used within a <Combobox>.`);
    }
    return ctx;
}

/* ------------------------------------------------------------------ */
/*  Combobox (root)                                                    */
/* ------------------------------------------------------------------ */

export interface ComboboxProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    /** Controlled selected value (`null` = nothing selected). */
    value?: string | null;
    /** Initial value when uncontrolled. */
    defaultValue?: string | null;
    /** Called with the new value whenever the selection changes. */
    onChange?: (value: string | null) => void;
    /** Inline placeholder shown in the input. */
    placeholder?: string;
    /** Disable the whole control. */
    disabled?: boolean;
    /** Render the error (red) state. */
    errored?: boolean;
    /** Control size. Default = `medium`. */
    size?: ComboboxSize;
    /** Fixed root width in px. Omit to size to content. */
    width?: number;
    /** Show a clear (X) button while a value is selected. */
    clearable?: boolean;
    /** Accessible name applied to the input (Geist puts `aria-label` here). */
    'aria-label'?: string;
    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
    children?: ReactNode;
}

/**
 * Combobox — filters a list of options to a single selectable value as the user
 * types. Owns open/query/selection state and the ARIA wiring; renders
 * `<div role="combobox" aria-haspopup="listbox">` around a `ComboboxInput` and a
 * `ComboboxList`. Closes on Escape, outside-click and selection.
 *
 * DOM + behaviour source: geistcn snapshot
 * `_nextstatic/component-inspect-element/combobox.html` and the Geist
 * `combobox.md` API.
 */
const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
    (
        {
            value: valueProp,
            defaultValue = null,
            onChange,
            placeholder,
            disabled = false,
            errored = false,
            size = 'medium',
            width,
            clearable = false,
            id: idProp,
            className,
            style,
            children,
            'aria-label': ariaLabel,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const reactId = useId();
        const inputId = idProp ?? `combobox-input-${reactId}`;
        const listId = `combobox-list-${reactId}`;

        const isControlled = valueProp !== undefined;
        const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
        const value = isControlled ? valueProp : internalValue;

        const [open, setOpen] = useState(false);
        const [query, setQuery] = useState<string | null>(null);
        const [activeId, setActiveId] = useState<string | null>(null);
        const [pristine, setPristine] = useState(true);

        const inputRef = useRef<HTMLInputElement | null>(null);
        const rootRef = useRef<HTMLDivElement | null>(null);
        const setRootRef = mergeRefs<HTMLDivElement>(ref, rootRef);

        // Option registry (stable ref; a version counter forces recompute).
        const optionsRef = useRef<Map<string, OptionMeta>>(new Map());
        const [, setRegistryVersion] = useState(0);

        const register = useCallback((optionId: string, meta: OptionMeta) => {
            optionsRef.current.set(optionId, meta);
            setRegistryVersion((v) => v + 1);
        }, []);
        const unregister = useCallback((optionId: string) => {
            optionsRef.current.delete(optionId);
            setRegistryVersion((v) => v + 1);
        }, []);

        const getLabel = useCallback((v: string): string | undefined => {
            for (const meta of optionsRef.current.values()) {
                if (meta.value === v) return meta.label;
            }
            return undefined;
        }, []);

        const idOfValue = useCallback((v: string | null): string | null => {
            if (v === null) return null;
            for (const [optionId, meta] of optionsRef.current) {
                if (meta.value === v) return optionId;
            }
            return null;
        }, []);

        const getOrder = useCallback((optionId: string): number => {
            let i = 0;
            for (const key of optionsRef.current.keys()) {
                if (key === optionId) return i;
                i += 1;
            }
            return -1;
        }, []);

        /** Ordered ids of options that match `q` and are enabled. */
        const visibleIds = useCallback((q: string | null): string[] => {
            const ids: string[] = [];
            for (const [optionId, meta] of optionsRef.current) {
                if (!meta.disabled && matchesQuery(meta.label, q)) ids.push(optionId);
            }
            return ids;
        }, []);

        const focusInput = useCallback(() => {
            requestAnimationFrame(() => inputRef.current?.focus());
        }, []);

        const openList = useCallback(() => {
            setOpen(true);
            setPristine(false);
            setQuery(null);
            setActiveId(idOfValue(value));
        }, [idOfValue, value]);

        const closeList = useCallback(() => {
            setOpen(false);
            setQuery(null);
            setActiveId(null);
        }, []);

        const commitValue = useCallback(
            (next: string | null) => {
                if (!isControlled) setInternalValue(next);
                onChange?.(next);
            },
            [isControlled, onChange],
        );

        const selectOption = useCallback(
            (optionValue: string) => {
                commitValue(optionValue);
                setOpen(false);
                setQuery(null);
                setActiveId(null);
                focusInput();
            },
            [commitValue, focusInput],
        );

        const clearValue = useCallback(() => {
            commitValue(null);
            setQuery(null);
            setActiveId(null);
            focusInput();
        }, [commitValue, focusInput]);

        const handleInputChange = useCallback(
            (text: string) => {
                setOpen(true);
                setPristine(false);
                setQuery(text);
                const [first] = visibleIds(text);
                setActiveId(first ?? null);
            },
            [visibleIds],
        );

        const toggleFromButton = useCallback(() => {
            if (open) closeList();
            else openList();
            focusInput();
        }, [open, openList, closeList, focusInput]);

        const scrollActiveIntoView = useCallback((optionId: string) => {
            if (typeof document === 'undefined') return;
            const el = document.getElementById(optionId);
            try {
                el?.scrollIntoView?.({ block: 'nearest' });
            } catch {
                /* jsdom: scrollIntoView is not implemented. */
            }
        }, []);

        const onInputKeyDown = useCallback(
            (event: ReactKeyboardEvent<HTMLInputElement>) => {
                switch (event.key) {
                    case 'ArrowDown': {
                        event.preventDefault();
                        if (!open) {
                            openList();
                            return;
                        }
                        const ids = visibleIds(query);
                        if (ids.length === 0) return;
                        const idx = activeId ? ids.indexOf(activeId) : -1;
                        const next = idx === -1 ? 0 : (idx + 1) % ids.length;
                        setActiveId(ids[next]);
                        scrollActiveIntoView(ids[next]);
                        break;
                    }
                    case 'ArrowUp': {
                        event.preventDefault();
                        if (!open) {
                            openList();
                            return;
                        }
                        const ids = visibleIds(query);
                        if (ids.length === 0) return;
                        const idx = activeId ? ids.indexOf(activeId) : -1;
                        const next = idx === -1 ? ids.length - 1 : (idx - 1 + ids.length) % ids.length;
                        setActiveId(ids[next]);
                        scrollActiveIntoView(ids[next]);
                        break;
                    }
                    case 'Home': {
                        if (!open) return;
                        const ids = visibleIds(query);
                        if (ids.length === 0) return;
                        event.preventDefault();
                        setActiveId(ids[0]);
                        scrollActiveIntoView(ids[0]);
                        break;
                    }
                    case 'End': {
                        if (!open) return;
                        const ids = visibleIds(query);
                        if (ids.length === 0) return;
                        event.preventDefault();
                        const last = ids[ids.length - 1];
                        setActiveId(last);
                        scrollActiveIntoView(last);
                        break;
                    }
                    case 'Enter': {
                        if (!open || !activeId) return;
                        event.preventDefault();
                        const meta = optionsRef.current.get(activeId);
                        if (meta && !meta.disabled) selectOption(meta.value);
                        break;
                    }
                    case 'Escape': {
                        if (!open) return;
                        event.preventDefault();
                        event.stopPropagation();
                        closeList();
                        break;
                    }
                    case 'Tab': {
                        if (open) closeList();
                        break;
                    }
                    default:
                        break;
                }
            },
            [open, query, activeId, visibleIds, openList, closeList, selectOption, scrollActiveIntoView],
        );

        // Dismiss on outside pointer-down.
        useEffect(() => {
            if (!open) return;
            const onPointerDown = (event: PointerEvent) => {
                const target = event.target as Node;
                if (rootRef.current?.contains(target)) return;
                closeList();
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            return () => document.removeEventListener('pointerdown', onPointerDown, true);
        }, [open, closeList]);

        const visibleCount = (() => {
            let count = 0;
            for (const meta of optionsRef.current.values()) {
                if (matchesQuery(meta.label, query)) count += 1;
            }
            return count;
        })();

        const contextValue: ComboboxContextValue = {
            open,
            disabled,
            errored,
            size,
            clearable,
            pristine,
            placeholder,
            ariaLabel,
            value,
            query,
            activeId,
            inputId,
            listId,
            inputRef,
            visibleCount,
            register,
            unregister,
            matches: (label: string) => matchesQuery(label, query),
            getLabel,
            getOrder,
            setActiveId,
            openList,
            closeList,
            toggleFromButton,
            focusInput,
            handleInputChange,
            selectOption,
            clearValue,
            onInputKeyDown,
        };

        return (
            <ComboboxContext.Provider value={contextValue}>
                <div
                    {...rest}
                    ref={setRootRef}
                    role="combobox"
                    tabIndex={-1}
                    aria-controls={listId}
                    aria-owns={listId}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    data-oxobz-combobox=""
                    data-version={dataVersion}
                    className={cn(styles.root, className)}
                    style={{ width: width !== undefined ? `${width}px` : undefined, ...style }}
                >
                    {children}
                </div>
            </ComboboxContext.Provider>
        );
    },
);
Combobox.displayName = 'Combobox';

/* ------------------------------------------------------------------ */
/*  ComboboxInput                                                      */
/* ------------------------------------------------------------------ */

export interface ComboboxInputProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        'value' | 'onChange' | 'disabled' | 'placeholder' | 'size' | 'type'
    > {}

/**
 * ComboboxInput — renders the control row: search prefix icon, the
 * `input[role=searchbox]`, a clear button and the open-menu (chevron) button.
 * Reads all configuration (placeholder, size, disabled, errored, value…) from
 * the root context. Forwards the ref to the `<input>`.
 */
const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
    ({ className, onFocus, onClick, ...rest }, ref) => {
        const ctx = useComboboxContext('ComboboxInput');
        const setRef = mergeRefs<HTMLInputElement>(ref, ctx.inputRef);

        const displayValue =
            ctx.query !== null
                ? ctx.query
                : ctx.value != null
                  ? (ctx.getLabel(ctx.value) ?? '')
                  : '';

        const showClear = ctx.clearable && ctx.value != null;
        const dataOpen = String(ctx.open);

        return (
            <div
                className={cn(
                    styles.container,
                    ctx.size === 'small' && styles.small,
                    ctx.size === 'large' && styles.large,
                )}
            >
                <div aria-hidden="true" className={styles.prefix}>
                    <MagnifyingGlass size={16} />
                </div>
                <input
                    {...rest}
                    ref={setRef}
                    id={ctx.inputId}
                    type="text"
                    role="searchbox"
                    autoComplete="off"
                    spellCheck={false}
                    aria-autocomplete="list"
                    aria-controls={ctx.listId}
                    aria-label={ctx.ariaLabel}
                    aria-activedescendant={ctx.open && ctx.activeId ? ctx.activeId : undefined}
                    aria-invalid={ctx.errored ? 'true' : undefined}
                    placeholder={ctx.placeholder}
                    disabled={ctx.disabled}
                    value={displayValue}
                    className={cn(styles.input, styles.truncate, ctx.errored && styles.errored, className)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        ctx.handleInputChange(event.target.value)
                    }
                    onKeyDown={ctx.onInputKeyDown}
                    onFocus={(event) => {
                        onFocus?.(event);
                        if (!event.defaultPrevented) ctx.openList();
                    }}
                    onClick={(event) => {
                        onClick?.(event);
                        if (!event.defaultPrevented) ctx.openList();
                    }}
                />
                <button
                    type="button"
                    aria-label="Clear selected value"
                    tabIndex={0}
                    disabled={ctx.disabled}
                    data-open={dataOpen}
                    className={cn(styles.iconButton, styles.clearButton)}
                    style={{ display: showClear ? undefined : 'none' }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={ctx.clearValue}
                >
                    <Cross size={16} className={styles.cross} />
                </button>
                <button
                    type="button"
                    aria-label="Open menu"
                    tabIndex={-1}
                    disabled={ctx.disabled}
                    data-open={dataOpen}
                    className={styles.iconButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={ctx.toggleFromButton}
                >
                    <ChevronDown size={16} className={styles.chevron} />
                </button>
            </div>
        );
    },
);
ComboboxInput.displayName = 'ComboboxInput';

/* ------------------------------------------------------------------ */
/*  ComboboxList                                                       */
/* ------------------------------------------------------------------ */

export interface ComboboxListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Cap the list width in px (Geist `maxWidth`). */
    maxWidth?: number;
    /** Message shown when no option matches the query. */
    emptyMessage?: ReactNode;
    children?: ReactNode;
}

/**
 * ComboboxList — the popover panel holding the `role="listbox"`. Stays mounted
 * (hidden via the `hidden` class) so options can register; toggles visibility
 * with the root open state. Renders `emptyMessage` when nothing matches.
 *
 * Styling: `combobox-module __list` (material shadow + radius) in chunk
 * `1c419a75d7e589ae.css`.
 */
const ComboboxList = forwardRef<HTMLDivElement, ComboboxListProps>(
    ({ maxWidth, emptyMessage = 'No results found.', className, style, children, ...rest }, ref) => {
        const ctx = useComboboxContext('ComboboxList');
        const isEmpty = ctx.visibleCount === 0;

        return (
            <div
                {...rest}
                ref={ref}
                data-pristine={String(ctx.pristine)}
                className={cn(styles.list, !ctx.open && styles.hidden, className)}
                style={{ maxWidth: maxWidth !== undefined ? `${maxWidth}px` : undefined, ...style }}
            >
                <ul
                    id={ctx.listId}
                    role="listbox"
                    aria-label={ctx.ariaLabel}
                    aria-hidden={ctx.open ? undefined : 'true'}
                >
                    {children}
                </ul>
                {isEmpty && <div className={styles.empty}>{emptyMessage}</div>}
            </div>
        );
    },
);
ComboboxList.displayName = 'ComboboxList';

/* ------------------------------------------------------------------ */
/*  ComboboxOption                                                     */
/* ------------------------------------------------------------------ */

export interface ComboboxOptionProps
    extends Omit<LiHTMLAttributes<HTMLLIElement>, 'prefix' | 'value'> {
    /** The value committed when this option is chosen. */
    value: string;
    /** Disable the option (inert, greyed out). */
    disabled?: boolean;
    /** Icon rendered before the label. */
    prefix?: ReactNode;
    /** Icon rendered after the label. */
    suffix?: ReactNode;
    children?: ReactNode;
}

/**
 * ComboboxOption — a single `<li role="option">`. Registers its value/label with
 * the root for filtering and selected-label display; hides itself (via the
 * `hidden` attribute) when it does not match the query. The active option
 * carries `aria-selected` + `data-highlighted` (the active-descendant).
 */
const ComboboxOption = forwardRef<HTMLLIElement, ComboboxOptionProps>(
    ({ value, disabled = false, prefix, suffix, className, style, children, ...rest }, ref) => {
        const ctx = useComboboxContext('ComboboxOption');
        const reactId = useId();
        const optionId = `combobox-option-${reactId}`;

        const label = typeof children === 'string' ? children : String(value);

        const { register, unregister } = ctx;
        useEffect(() => {
            register(optionId, { value, label, disabled });
            return () => unregister(optionId);
        }, [register, unregister, optionId, value, label, disabled]);

        const visible = ctx.matches(label);
        const active = ctx.activeId === optionId;

        return (
            <li
                {...rest}
                ref={ref}
                id={optionId}
                role="option"
                aria-selected={active ? 'true' : 'false'}
                aria-disabled={disabled || undefined}
                data-highlighted={active ? 'true' : 'false'}
                data-descendant={optionId}
                data-order={ctx.getOrder(optionId)}
                hidden={!visible}
                className={cn(styles.option, disabled && styles.optionDisabled, className)}
                style={{ height: 36, ...style }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                    if (!disabled) ctx.selectOption(value);
                }}
                onMouseEnter={() => {
                    if (!disabled) ctx.setActiveId(optionId);
                }}
            >
                {prefix != null && (
                    <span data-oxobz-combobox-option-prefix="">{prefix}</span>
                )}
                <span className={styles.truncate} title={label}>
                    {children}
                </span>
                {suffix != null && (
                    <span data-oxobz-combobox-option-suffix="">{suffix}</span>
                )}
            </li>
        );
    },
);
ComboboxOption.displayName = 'ComboboxOption';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const ComboboxNamespace = Object.assign(Combobox, {
    Input: ComboboxInput,
    List: ComboboxList,
    Option: ComboboxOption,
});

// Flat sub-components mirror the official docs names; `Combobox` additionally
// exposes them as compound members (Combobox.Input, Combobox.List, …).
export { ComboboxNamespace as Combobox, ComboboxInput, ComboboxList, ComboboxOption };
