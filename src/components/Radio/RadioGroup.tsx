import {
    createContext,
    forwardRef,
    useContext,
    useId,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
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

/* ------------------------------------------------------------------ */
/*  RadioGroup.Item Props                                              */
/* ------------------------------------------------------------------ */

export interface RadioGroupItemProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    /** The value of this radio option */
    value: string;

    /** Label content rendered next to the radio */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  RadioGroup.Item                                                    */
/* ------------------------------------------------------------------ */

/**
 * A single radio item inside a RadioGroup.
 *
 * Production DOM:
 * ```html
 * <label class="item" data-geist-radio-item="">
 *   <span class="radio-check">​
 *     <input class="radio-input geist-sr-only" type="radio" />
 *     <span class="radio-icon" aria-hidden="true" />
 *   </span>
 *   <span class="text">Label</span>
 * </label>
 * ```
 */
const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
    ({ children, className, disabled: itemDisabled, value, ...rest }, ref) => {
        const ctx = useRadioGroupContext();

        const isDisabled = itemDisabled ?? ctx?.disabled ?? false;
        const isChecked = ctx ? ctx.value === value : rest.checked;

        const handleChange = () => {
            if (!isDisabled && ctx?.onChange) {
                ctx.onChange(value);
            }
        };

        return (
            <label
                className={cn(
                    styles.item,
                    isDisabled && styles.disabled,
                    className,
                )}
                data-oxobz-radio-item=""
            >
                <span className={styles['radio-check']}>
                    {/* Zero-width space */}
                    &#8203;
                    <input
                        {...rest}
                        checked={isChecked}
                        className={cn(
                            styles['radio-input'],
                            'oxobz-sr-only',
                        )}
                        disabled={isDisabled}
                        name={ctx?.name}
                        onChange={handleChange}
                        ref={ref}
                        required={ctx?.required}
                        type="radio"
                        value={value}
                    />
                    <span
                        aria-hidden="true"
                        className={styles['radio-icon']}
                    />
                </span>
                {children != null && (
                    <span className={styles.text}>{children}</span>
                )}
            </label>
        );
    },
);

RadioGroupItem.displayName = 'RadioGroup.Item';

/* ------------------------------------------------------------------ */
/*  RadioGroup Props                                                   */
/* ------------------------------------------------------------------ */

export interface RadioGroupProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Accessible label for the radio group (rendered as sr-only text) */
    label?: string;

    /** Currently selected value (controlled) */
    value?: string;

    /** Callback when value changes */
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
 * Production DOM:
 * ```html
 * <div data-geist-radio-group="" data-version="v1" role="radiogroup"
 *      aria-labelledby="radio-XXX">
 *     <span class="geist-sr-only" id="radio-XXX">Label</span>
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

export { RadioGroup, useRadioGroupContext };
