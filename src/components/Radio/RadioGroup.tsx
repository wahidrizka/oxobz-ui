'use client';

import {
    createContext,
    forwardRef,
    useContext,
    useId,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactElement,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import radioStyles from './Radio.module.css';
import styles from './RadioGroup.module.css';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface RadioGroupContextValue {
    name: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext() {
    return useContext(RadioGroupContext);
}

/**
 * Shared per-item state derived from the enclosing RadioGroup context.
 * Consumed by both `RadioGroupItem` (labelled) and `useRadio` (headless), so
 * that the two entry points stay behaviourally identical.
 */
function useRadioItemState(value: string, disabledProp?: boolean) {
    const ctx = useRadioGroupContext();
    const isDisabled = disabledProp ?? ctx?.disabled ?? false;
    const handleChange = () => {
        if (!isDisabled && ctx?.onChange) {
            ctx.onChange(value);
        }
    };
    return { ctx, isDisabled, handleChange };
}

/* ------------------------------------------------------------------ */
/*  RadioIndicator (internal, shared visual control)                   */
/* ------------------------------------------------------------------ */

interface RadioIndicatorProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Whether the control is disabled (drives the radio-module disabled class) */
    disabled?: boolean;
    /**
     * Render a zero-width space before the input. Geist production emits this
     * only for labelled `RadioGroup.Item`s (not the headless `useRadio` span).
     */
    withZeroWidthSpace?: boolean;
}

/**
 * The check → input → icon fragment shared by every radio item.
 *
 * It composes BOTH module class sets exactly like Geist production so the
 * dot-scale + focus-ring behaviour comes from radio-module (Radio.module.css),
 * matching the DOM: `check radio-check`, `input oxobz-sr-only radio-input`,
 * `icon radio-icon`, plus radio-module `disabled` on the check span.
 */
const RadioIndicator = forwardRef<HTMLInputElement, RadioIndicatorProps>(
    ({ className, disabled, withZeroWidthSpace, ...rest }, ref) => {
        return (
            <span
                className={cn(
                    radioStyles.check,
                    disabled && radioStyles.disabled,
                    styles['radio-check'],
                    className,
                )}
            >
                {withZeroWidthSpace ? '​' : null}
                <input
                    {...rest}
                    className={cn(
                        radioStyles.input,
                        'oxobz-sr-only',
                        styles['radio-input'],
                    )}
                    disabled={disabled}
                    ref={ref}
                    type="radio"
                />
                <span
                    aria-hidden="true"
                    className={cn(radioStyles.icon, styles['radio-icon'])}
                />
            </span>
        );
    },
);

RadioIndicator.displayName = 'RadioIndicator';

/* ------------------------------------------------------------------ */
/*  RadioGroupItem Props                                               */
/* ------------------------------------------------------------------ */

export interface RadioGroupItemProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    /** The value of this radio option */
    value: string;

    /** Label content rendered next to the radio */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  RadioGroupItem                                                     */
/* ------------------------------------------------------------------ */

/**
 * A single labelled radio item inside a RadioGroup.
 *
 * Exposed both as the compound `RadioGroup.Item` and as the top-level
 * `RadioGroupItem` named export (Geist docs parity).
 *
 * Rendered DOM (Geist production structure, geist→oxobz prefix rename):
 * ```html
 * <label class="item" data-oxobz-radio-item="">
 *   <span class="check radio-check">​
 *     <input class="input oxobz-sr-only radio-input" type="radio" />
 *     <span class="icon radio-icon" aria-hidden="true" />
 *   </span>
 *   <span class="text">Label</span>
 * </label>
 * ```
 */
const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
    ({ children, className, disabled: itemDisabled, value, ...rest }, ref) => {
        const { ctx, isDisabled, handleChange } = useRadioItemState(
            value,
            itemDisabled,
        );
        const isChecked = ctx ? ctx.value === value : rest.checked;

        return (
            <label
                className={cn(
                    styles.item,
                    isDisabled && styles.disabled,
                    className,
                )}
                data-oxobz-radio-item=""
            >
                <RadioIndicator
                    {...rest}
                    checked={isChecked}
                    disabled={isDisabled}
                    name={ctx?.name}
                    onChange={handleChange}
                    ref={ref}
                    required={ctx?.required}
                    value={value}
                    withZeroWidthSpace
                />
                {children != null && (
                    <span className={styles.text}>{children}</span>
                )}
            </label>
        );
    },
);

RadioGroupItem.displayName = 'RadioGroup.Item';

/* ------------------------------------------------------------------ */
/*  useRadio (headless)                                                 */
/* ------------------------------------------------------------------ */

export interface UseRadioOptions {
    /** The value of this radio option */
    value: string;

    /** Whether this option is disabled (falls back to the group's disabled) */
    disabled?: boolean;
}

export interface UseRadioReturn {
    /** Ready-to-render radio control that consumes the RadioGroup context */
    component: ReactElement;
}

/**
 * Internal component behind {@link useRadio}. It reads the RadioGroup context
 * at *its own* render position (inside the provider), so the value/name/checked
 * wiring works even though `useRadio` is called outside the group.
 *
 * Rendered DOM (Geist production headless structure):
 * ```html
 * <span class="item" data-oxobz-radio-item="">
 *   <span class="check radio-check">
 *     <input class="input oxobz-sr-only radio-input" type="radio" />
 *     <span class="icon radio-icon" aria-hidden="true" />
 *   </span>
 * </span>
 * ```
 */
function HeadlessRadioItem({ value, disabled }: UseRadioOptions) {
    const { ctx, isDisabled, handleChange } = useRadioItemState(value, disabled);
    const isChecked = ctx?.value === value;

    return (
        <span
            className={cn(styles.item, isDisabled && styles.disabled)}
            data-oxobz-radio-item=""
        >
            <RadioIndicator
                checked={isChecked}
                disabled={isDisabled}
                name={ctx?.name}
                onChange={handleChange}
                required={ctx?.required}
                value={value}
            />
        </span>
    );
}

HeadlessRadioItem.displayName = 'HeadlessRadioItem';

/**
 * Headless radio hook (Geist docs parity).
 *
 * Returns a ready-to-render `component` that must be placed inside a
 * `RadioGroup`; the control derives its checked state, name and change handler
 * from the surrounding group context.
 *
 * @example
 * const { component } = useRadio({ value: 'one', disabled: false });
 * return <RadioGroup value={value} onChange={setValue}>{component}</RadioGroup>;
 */
function useRadio(options: UseRadioOptions): UseRadioReturn {
    return { component: <HeadlessRadioItem {...options} /> };
}

/* ------------------------------------------------------------------ */
/*  RadioGroup Props                                                   */
/* ------------------------------------------------------------------ */

/**
 * Props for RadioGroup.
 *
 * RadioGroup is a controlled-only component: to make it interactive you must
 * provide both `value` (the currently selected option) and `onChange` (called
 * with the newly selected value). There is no `defaultValue` prop and no
 * uncontrolled mode — without `value` + `onChange`, selection will not update.
 */
export interface RadioGroupProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Accessible label for the radio group (rendered as sr-only text) */
    label?: string;

    /** Currently selected value (controlled; required for interactivity) */
    value?: string;

    /** Called with the newly selected value (required for interactivity) */
    onChange?: (value: string) => void;

    /** Disables all radio items in the group */
    disabled?: boolean;

    /** Makes all radio inputs required */
    required?: boolean;

    /** Children — should contain RadioGroup.Item or custom layout */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  RadioGroup                                                         */
/* ------------------------------------------------------------------ */

/**
 * Compound component providing radio group context.
 *
 * Controlled-only: pass `value` and `onChange` to make the group interactive.
 *
 * Rendered DOM (Geist production structure, geist→oxobz prefix rename):
 * ```html
 * <div data-oxobz-radio-group="" data-version="v1" role="radiogroup"
 *      aria-labelledby="radio-XXX">
 *     <span class="oxobz-sr-only" id="radio-XXX">Label</span>
 *     {children}
 * </div>
 * ```
 */
function RadioGroupRoot({
    children,
    className,
    disabled,
    label,
    onChange,
    required,
    value,
    'data-version': dataVersion = 'v1',
    ...rest
}: RadioGroupProps) {
    const autoId = useId();
    const name = `radio-name-${autoId}`;
    const labelId = label ? `radio-${autoId}` : undefined;

    return (
        <RadioGroupContext.Provider
            value={{ name, value, disabled, required, onChange }}
        >
            <div
                {...rest}
                aria-labelledby={labelId}
                className={className}
                data-oxobz-radio-group=""
                data-version={dataVersion}
                role="radiogroup"
            >
                {label && (
                    <span className="oxobz-sr-only" id={labelId}>
                        {label}
                    </span>
                )}
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
}

RadioGroupRoot.displayName = 'RadioGroup';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const RadioGroup = Object.assign(RadioGroupRoot, {
    Item: RadioGroupItem,
});

export { RadioGroup, RadioGroupItem, useRadio, useRadioGroupContext };
