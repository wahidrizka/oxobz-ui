import {
    forwardRef,
    type CSSProperties,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Toggle.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Toggle size. Default is `small` (14x28 track) — matching Geist
 * production, where the bare `<Toggle />` renders the smallest track and
 * `medium` / `large` are explicit opt-ins.
 */
export type ToggleSize = 'small' | 'medium' | 'large';

/**
 * Custom accent color for the track/thumb. Only `amber` and `red` have
 * verified production override values, so the union is limited to those.
 */
export type ToggleColor = 'amber' | 'red';

/**
 * Layout order of the label relative to the switch. `label-first` (default)
 * renders the label before the switch; `switch-first` reverses them.
 */
export type ToggleDirection = 'label-first' | 'switch-first';

/** Casing applied to the visible label. `title` (default) capitalizes it. */
export type ToggleLabelCasing = 'title' | 'normal';

/** Thumb icons rendered per state (Geist `icon` prop shape). */
export interface ToggleIcon {
    /** Icon shown while the toggle is on */
    checked: ReactNode;
    /** Icon shown while the toggle is off */
    unchecked: ReactNode;
}

export interface ToggleProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        'size' | 'color' | 'children'
    > {
    /**
     * On/off state. Required and controlled — own the state and update it
     * from `onChange` (Geist production behaviour).
     */
    checked: boolean;

    /** Size of the toggle (default: small) */
    size?: ToggleSize;

    /** Custom accent color applied via CSS variable overrides */
    color?: ToggleColor;

    /** Icons rendered inside the thumb, switched on `checked` */
    icon?: ToggleIcon;

    /** Order of the label relative to the switch (default: label-first) */
    direction?: ToggleDirection;

    /** Casing of the visible label (default: title) */
    labelCasing?: ToggleLabelCasing;

    /** Visible label rendered next to the switch */
    children?: ReactNode;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Custom color overrides                                             */
/* ------------------------------------------------------------------ */

/**
 * CSS variable presets per custom color, verified against toggle.html.
 * The unchecked step differs between colors (amber-700 vs red-600), so the
 * values are stored per color rather than derived from a single formula.
 */
const COLOR_OVERRIDES: Record<ToggleColor, Record<string, string>> = {
    amber: {
        '--unchecked-bg-color-override': 'var(--ds-amber-700)',
        '--checked-bg-color-override': 'var(--ds-gray-100)',
        '--thumb-fg-color-override': 'var(--ds-amber-100)',
        '--thumb-light-fg-color-override': 'var(--ds-amber-1000)',
    },
    red: {
        '--unchecked-bg-color-override': 'var(--ds-red-600)',
        '--checked-bg-color-override': 'var(--ds-gray-100)',
        '--thumb-fg-color-override': 'var(--ds-red-100)',
        '--thumb-light-fg-color-override': 'var(--ds-red-1000)',
    },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Displays a boolean value. Unlike `Switch` (a segmented, radio-based control
 * for mutually exclusive options), Toggle is a single controlled checkbox
 * where ON takes effect immediately.
 *
 * Rendered DOM (Geist production structure):
 * ```html
 * <label class="wrapper titleCasing" data-oxobz-toggle="" data-version="v1"
 *        aria-label="Enable Firewall">
 *   <span>{children}</span>            <!-- only when a label is provided -->
 *   <input class="oxobz-sr-only input" type="checkbox" data-testid="toggle/input" />
 *   <span class="track [checked] [disabled]">
 *     <div class="thumb [checked] [disabled]">
 *       <div class="thumbIcon" aria-hidden="true">…icon…</div>  <!-- when icon -->
 *     </div>
 *   </span>
 * </label>
 * ```
 */
const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
    (
        {
            checked,
            disabled = false,
            size = 'small',
            color,
            icon,
            direction = 'label-first',
            labelCasing = 'title',
            children,
            className,
            style,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledby,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        // Color overrides are set inline (as CSS custom properties) exactly
        // like production; the user-provided style wins over them.
        const wrapperStyle: CSSProperties & Record<string, string | number> = {
            ...(color != null ? COLOR_OVERRIDES[color] : {}),
            ...style,
        };

        return (
            <label
                className={cn(
                    styles.wrapper,
                    labelCasing === 'title' && styles.titleCasing,
                    direction === 'switch-first' && styles.switchFirst,
                    size === 'medium' && styles.medium,
                    size === 'large' && styles.large,
                    className,
                )}
                style={wrapperStyle}
                data-oxobz-toggle=""
                data-version={dataVersion}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
            >
                {children != null && <span>{children}</span>}
                <input
                    {...rest}
                    ref={ref}
                    type="checkbox"
                    className={cn('oxobz-sr-only', styles.input)}
                    checked={checked}
                    disabled={disabled}
                    data-testid="toggle/input"
                />
                <span
                    className={cn(
                        styles.track,
                        checked && styles.checked,
                        disabled && styles.disabled,
                    )}
                >
                    <div
                        className={cn(
                            styles.thumb,
                            checked && styles.checked,
                            disabled && styles.disabled,
                        )}
                    >
                        {icon != null && (
                            <div aria-hidden="true" className={styles.thumbIcon}>
                                {checked ? icon.checked : icon.unchecked}
                            </div>
                        )}
                    </div>
                </span>
            </label>
        );
    },
);

Toggle.displayName = 'Toggle';

export { Toggle };
