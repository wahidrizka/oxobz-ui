import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import styles from './Radio.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RadioProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Whether the radio is visually & functionally disabled */
    disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Standalone radio input — used outside of RadioGroup.
 *
 * DOM structure mirrors Geist production (geist→oxobz prefix rename).
 * Note: the production standalone radio carries no `data-*` marker attribute
 * (only RadioGroup and its items do), so none is rendered here either.
 * ```html
 * <span class="check">
 *   <input class="input oxobz-sr-only" type="radio" />
 *   <span class="icon" aria-hidden="true" />
 * </span>
 * ```
 */
const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ className, disabled, ...rest }, ref) => {
        return (
            <span
                className={cn(
                    styles.check,
                    disabled && styles.disabled,
                    className,
                )}
            >
                <input
                    {...rest}
                    className={cn(styles.input, 'oxobz-sr-only')}
                    disabled={disabled}
                    ref={ref}
                    type="radio"
                />
                <span aria-hidden="true" className={styles.icon} />
            </span>
        );
    },
);

Radio.displayName = 'Radio';

export { Radio };
