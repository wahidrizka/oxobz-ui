import React, {
    createContext,
    forwardRef,
    useContext,
    useId,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Label } from '../Label';
import stackStyles from '../Stack/Stack.module.css';
import styles from './ChoiceboxGroup.module.css';
import radioStyles from '../Radio/Radio.module.css';
import checkboxStyles from '../Checkbox/Checkbox.module.css';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ChoiceboxGroupContextValue {
    name: string;
    type: 'radio' | 'checkbox';
    disabled?: boolean;
    /** For radio: single string value. For checkbox: array of string values. */
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
}

const ChoiceboxGroupContext = createContext<ChoiceboxGroupContextValue | null>(
    null,
);

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup.Item Props                                          */
/* ------------------------------------------------------------------ */

export interface ChoiceboxGroupItemProps
    extends Omit<HTMLAttributes<HTMLLabelElement>, 'title'> {
    /** Title text */
    title: string;

    /** Description text */
    description?: string;

    /** The value for this choice */
    value: string;

    /** Disables this specific item (overrides group disabled) */
    disabled?: boolean;

    /** Custom content rendered below the option row when checked */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (from Checkbox)                                          */
/* ------------------------------------------------------------------ */

/** Internal SVG used inside the checkbox icon — checkmark + dash */
function CheckboxSvg() {
    return (
        <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
            <path
                d="M14 7L8.5 12.5L6 10"
                stroke="var(--oxobz-background)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
            <line
                stroke="var(--checkbox-color)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="5"
                x2="15"
                y1="10"
                y2="10"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup.Item                                                */
/* ------------------------------------------------------------------ */

/**
 * A single choicebox item inside a ChoiceboxGroup.
 *
 * Production DOM (radio mode):
 * ```html
 * <label class="stack choicebox checked" data-version="v1" aria-selected="true"
 *        style="--stack-flex:1; --stack-direction:column; ...">
 *   <div class="stack option" data-version="v1"
 *        style="--stack-direction:row; --stack-align:center; ...">
 *     <span class="stack" ...>
 *       <span class="title">Pro Trial</span>
 *       <span class="description">Free for two weeks</span>
 *     </span>
 *     <span class="radio-check radio">
 *       <input class="radio-input geist-sr-only input" type="radio" />
 *       <span class="radio-icon icon" aria-hidden="true" />
 *     </span>
 *   </div>
 *   <span class="content"></span>
 * </label>
 * ```
 */
const ChoiceboxGroupItem = forwardRef<HTMLLabelElement, ChoiceboxGroupItemProps>(
    ({ title, description, value, disabled: itemDisabled, children, className, ...rest }, ref) => {
        const ctx = useContext(ChoiceboxGroupContext);
        if (!ctx) {
            throw new Error('ChoiceboxGroup.Item must be used within a ChoiceboxGroup');
        }

        const { type, name, disabled: groupDisabled, value: groupValue, onChange } = ctx;
        const isDisabled = itemDisabled ?? groupDisabled ?? false;

        // Determine checked state
        let isChecked = false;
        if (type === 'radio') {
            isChecked = groupValue === value;
        } else {
            isChecked = Array.isArray(groupValue) && groupValue.includes(value);
        }

        const handleChange = () => {
            if (isDisabled || !onChange) return;

            if (type === 'radio') {
                onChange(value);
            } else {
                // checkbox toggle
                const currentValues = Array.isArray(groupValue) ? groupValue : [];
                if (currentValues.includes(value)) {
                    onChange(currentValues.filter((v) => v !== value));
                } else {
                    onChange([...currentValues, value]);
                }
            }
        };

        return (
            <label
                {...rest}
                ref={ref}
                className={cn(
                    stackStyles.stack,
                    styles.choicebox,
                    isChecked && styles.checked,
                    isDisabled && styles.disabled,
                    className,
                )}
                data-version="v1"
                aria-selected={isChecked}
                style={{
                    '--stack-flex': '1',
                    '--stack-direction': 'column',
                    '--stack-align': 'stretch',
                    '--stack-justify': 'flex-start',
                    '--stack-padding': '0px',
                    '--stack-gap': '0px',
                    ...(rest.style ?? {}),
                } as React.CSSProperties}
            >
                {/* Option row */}
                <div
                    className={cn(stackStyles.stack, styles.option)}
                    data-version="v1"
                    style={{
                        '--stack-flex': 'initial',
                        '--stack-direction': 'row',
                        '--stack-align': 'center',
                        '--stack-justify': 'space-between',
                        '--stack-padding': '0px',
                        '--stack-gap': '24px',
                    } as React.CSSProperties}
                >
                    {/* Title + Description */}
                    <span
                        className={stackStyles.stack}
                        data-version="v1"
                        style={{
                            '--stack-flex': 'initial',
                            '--stack-direction': 'column',
                            '--stack-align': 'stretch',
                            '--stack-justify': 'flex-start',
                            '--stack-padding': '0px',
                            '--stack-gap': '4px',
                        } as React.CSSProperties}
                    >
                        <span className={styles.title}>{title}</span>
                        {description && (
                            <span className={styles.description}>{description}</span>
                        )}
                    </span>

                    {/* Radio / Checkbox indicator */}
                    {type === 'radio' ? (
                        <span className={cn(radioStyles.check, styles.radio)}>
                            <input
                                className={cn(
                                    radioStyles.input,
                                    'oxobz-sr-only',
                                    styles.input,
                                )}
                                type="radio"
                                value={value}
                                checked={isChecked}
                                disabled={isDisabled}
                                name={name}
                                onChange={handleChange}
                            />
                            <span
                                aria-hidden="true"
                                className={cn(radioStyles.icon, styles.icon)}
                            />
                        </span>
                    ) : (
                        <label
                            className={cn(
                                checkboxStyles.container,
                                styles.checkbox,
                                isDisabled && checkboxStyles.disabled,
                            )}
                            data-version="v1"
                        >
                            <span className={checkboxStyles.check}>
                                <input
                                    className={cn(
                                        'oxobz-sr-only',
                                        checkboxStyles.input,
                                    )}
                                    type="checkbox"
                                    value={value}
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    name={name}
                                    onChange={handleChange}
                                />
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        checkboxStyles.icon,
                                        isDisabled && checkboxStyles.disabled,
                                        styles.icon,
                                    )}
                                >
                                    <CheckboxSvg />
                                </span>
                            </span>
                        </label>
                    )}
                </div>

                {/* Custom content slot */}
                <span className={styles.content}>{children}</span>
            </label>
        );
    },
);

ChoiceboxGroupItem.displayName = 'ChoiceboxGroup.Item';

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup Props                                               */
/* ------------------------------------------------------------------ */

export interface ChoiceboxGroupProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Accessible label for the group (rendered as aria-label or visible Label) */
    label?: string;

    /** Show a visible label above the group (uses Label component) */
    showLabel?: boolean;

    /** 'radio' for single-select, 'checkbox' for multi-select */
    type?: 'radio' | 'checkbox';

    /** Layout direction of items */
    direction?: 'row' | 'column';

    /** Currently selected value(s) — string for radio, string[] for checkbox */
    value?: string | string[];

    /** Callback when selection changes */
    onChange?: (value: string | string[]) => void;

    /** Disables all items */
    disabled?: boolean;

    /** Required attribute */
    required?: boolean;

    /** Children — should contain ChoiceboxGroup.Item */
    children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  ChoiceboxGroup                                                     */
/* ------------------------------------------------------------------ */

/**
 * Compound component providing choicebox group context.
 *
 * Production DOM:
 * ```html
 * <div aria-label="select a plan" aria-multiselectable="false"
 *      aria-required="false"
 *      class="choicebox-group"
 *      role="radiogroup">
 *   <label ...>Label</label>   <!-- optional, when showLabel -->
 *   <ul class="stack" data-version="v1" style="--stack-direction:row; ...">
 *     <!-- ChoiceboxGroup.Item children -->
 *   </ul>
 * </div>
 * ```
 */
function ChoiceboxGroupRoot({
    children,
    className,
    direction = 'row',
    disabled,
    label,
    onChange,
    required = false,
    showLabel = false,
    type = 'radio',
    value,
    ...rest
}: ChoiceboxGroupProps) {
    const autoId = useId();
    const name = `choicebox-name-${autoId}`;
    const labelId = label && showLabel ? `choicebox-${autoId}` : undefined;
    const isMulti = type === 'checkbox';

    return (
        <ChoiceboxGroupContext.Provider
            value={{ name, type, disabled, value, onChange }}
        >
            <div
                {...rest}
                aria-label={!showLabel ? label : undefined}
                aria-labelledby={showLabel ? labelId : undefined}
                aria-multiselectable={isMulti}
                aria-required={required}
                className={cn(styles['choicebox-group'], className)}
                role={isMulti ? 'group' : 'radiogroup'}
            >
                {showLabel && label && (
                    <Label htmlFor={labelId} data-version="v1">
                        {label}
                    </Label>
                )}
                <ul
                    className={stackStyles.stack}
                    data-version="v1"
                    style={{
                        '--stack-flex': 'initial',
                        '--stack-direction': direction,
                        '--stack-align': 'stretch',
                        '--stack-justify': 'stretch',
                        '--stack-padding': '0px',
                        '--stack-gap': '12px',
                    } as React.CSSProperties}
                >
                    {children}
                </ul>
            </div>
        </ChoiceboxGroupContext.Provider>
    );
}

ChoiceboxGroupRoot.displayName = 'ChoiceboxGroup';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const ChoiceboxGroup = Object.assign(ChoiceboxGroupRoot, {
    Item: ChoiceboxGroupItem,
});

export { ChoiceboxGroup };
