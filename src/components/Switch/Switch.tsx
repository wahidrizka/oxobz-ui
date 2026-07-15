import {
    createContext,
    forwardRef,
    useContext,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Switch.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SwitchSize = 'small' | 'medium' | 'large';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface SwitchContextValue {
    /** Radio group name shared by every Switch.Control */
    name?: string;
    /** Size inherited by every Switch.Control */
    size: SwitchSize;
}

const SwitchContext = createContext<SwitchContextValue | null>(null);

function useSwitchContext() {
    return useContext(SwitchContext);
}

/* ------------------------------------------------------------------ */
/*  Switch.Control                                                     */
/* ------------------------------------------------------------------ */

export interface SwitchControlProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'children'> {
    /**
     * Text label of the option. Always provide one — for icon-only
     * controls it is rendered as sr-only text for screen readers.
     */
    label?: string;

    /** Icon rendered instead of the visible text label */
    icon?: ReactNode;

    /** Size override for this control (defaults to the Switch size) */
    size?: SwitchSize;
}

/**
 * A single option inside a Switch (radio semantics).
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <label class="container" data-disabled="false">
 *   <input class="oxobz-sr-only input" type="radio" value="..." name="..." />
 *   <div class="control text">Source</div>
 * </label>
 * ```
 */
const SwitchControl = forwardRef<HTMLInputElement, SwitchControlProps>(
    (
        {
            className,
            disabled,
            icon,
            label,
            name: nameProp,
            size: sizeProp,
            ...rest
        },
        ref,
    ) => {
        const ctx = useSwitchContext();

        const size = sizeProp ?? ctx?.size ?? 'medium';
        const name = nameProp ?? ctx?.name;
        const isIconOnly = icon != null;

        return (
            <label
                className={cn(styles.container, className)}
                data-disabled={disabled ? 'true' : 'false'}
            >
                <input
                    {...rest}
                    className={cn('oxobz-sr-only', styles.input)}
                    disabled={disabled}
                    name={name}
                    ref={ref}
                    type="radio"
                />
                <div
                    className={cn(
                        styles.control,
                        isIconOnly ? styles.icon : styles.text,
                        size !== 'medium' && styles[size],
                    )}
                >
                    {isIconOnly ? icon : label}
                    {isIconOnly && (
                        <span className="oxobz-sr-only">{label}</span>
                    )}
                </div>
            </label>
        );
    },
);

SwitchControl.displayName = 'Switch.Control';

/* ------------------------------------------------------------------ */
/*  Switch (root)                                                      */
/* ------------------------------------------------------------------ */

export interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Name grouping the underlying radios. Without it, more than one
     * option can appear selected at once (matches Geist behaviour).
     */
    name?: string;

    /** Size of the switch and (by default) all of its controls */
    size?: SwitchSize;

    /** Children — should contain Switch.Control elements */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/**
 * Segmented control to choose between a set of mutually exclusive
 * options (radio semantics). For a boolean on/off setting use Toggle.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <div class="switch" data-oxobz-switch="" data-version="v1">
 *   {children}
 * </div>
 * ```
 */
const SwitchRoot = forwardRef<HTMLDivElement, SwitchProps>(
    (
        {
            children,
            className,
            name,
            size = 'medium',
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        return (
            <SwitchContext.Provider value={{ name, size }}>
                <div
                    {...rest}
                    className={cn(
                        styles.switch,
                        size !== 'medium' && styles[size],
                        className,
                    )}
                    data-oxobz-switch=""
                    data-version={dataVersion}
                    ref={ref}
                >
                    {children}
                </div>
            </SwitchContext.Provider>
        );
    },
);

SwitchRoot.displayName = 'Switch';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Switch = Object.assign(SwitchRoot, {
    Control: SwitchControl,
});

export { Switch, SwitchControl };
