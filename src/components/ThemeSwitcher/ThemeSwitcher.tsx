'use client';

import { forwardRef, useId, type HTMLAttributes } from 'react';
import { DeviceDesktop, Moon, Sun } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { useTheme, type Theme } from '../../ThemeProvider';
import styles from './ThemeSwitcher.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ThemeSwitcherProps extends HTMLAttributes<HTMLFieldSetElement> {
    /**
     * Renders the dense 24px control (theme-switcher.html "Small" example).
     * Use in footers/dropdowns; keep the default size on a settings page.
     */
    small?: boolean;

    /**
     * Disables every option. Geist production auto-disables when
     * `forcedTheme` is set on the `next-themes` provider — oxobz's
     * `ThemeProvider` has no `forcedTheme` equivalent, so this is a manual
     * override only, for read-only previews of the control itself.
     */
    disabled?: boolean;

    /** data-version attribute matching Geist production output */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Options                                                             */
/* ------------------------------------------------------------------ */

/**
 * Icon per option, verified against theme-switcher.html.
 *
 * The production snapshot swaps in visually-smaller glyph assets for the
 * `small` example (different path data for the sun/moon, still rendered in
 * a 16x16 box) — @oxobz/icons has no dedicated small variant of the
 * "system/monitor" glyph, so the same icon set is reused at both sizes;
 * only the surrounding button shrinks (32px -> 24px), matching the DOM's
 * icon wrapper (`size-4`, unchanged across both examples).
 */
const OPTIONS: ReadonlyArray<{ value: Theme; label: string; Icon: typeof Sun }> = [
    { value: 'system', label: 'system', Icon: DeviceDesktop },
    { value: 'light', label: 'light', Icon: Sun },
    { value: 'dark', label: 'dark', Icon: Moon },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Segmented System / Light / Dark control. Reads from and writes to
 * oxobz's `ThemeProvider` (`useTheme`) — mirrors the Geist production
 * component, which is wired to `next-themes` the same way.
 *
 * Rendered DOM (geistcn Tailwind, resolved from theme-switcher.html):
 * ```html
 * <fieldset class="fieldset" data-oxobz-theme-switcher="" data-version="v1">
 *   <legend class="oxobz-sr-only">Select a display theme:</legend>
 *   <span class="itemWrapper">
 *     <input class="input" type="radio" value="system" aria-label="system" />
 *     <label class="label" for="...">
 *       <span class="oxobz-sr-only">system</span>
 *       <span class="iconWrapper"><svg .../></span>
 *     </label>
 *   </span>
 *   <!-- repeated for "light" (default checked) and "dark" -->
 * </fieldset>
 * ```
 *
 * Note: the disabled example in the snapshot renders every label with a
 * single flat gray-500 + cursor-not-allowed style — no hover, checked, or
 * focus-visible distinction survives — so `.disabled` here intentionally
 * neutralizes those states via `:not(.disabled)` guards rather than
 * relying on the browser's native `:disabled` cascade.
 */
const ThemeSwitcher = forwardRef<HTMLFieldSetElement, ThemeSwitcherProps>(
    (
        {
            small = false,
            disabled = false,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const { theme, setTheme } = useTheme();
        const groupId = useId();
        const name = `theme-switch-${groupId}`;

        return (
            <fieldset
                {...rest}
                className={cn(styles.fieldset, className)}
                data-oxobz-theme-switcher=""
                data-small={small ? '' : undefined}
                data-version={dataVersion}
                ref={ref}
            >
                <legend className="oxobz-sr-only">Select a display theme:</legend>
                {OPTIONS.map(({ value, label, Icon }) => {
                    const optionId = `theme-switch-${value}-${groupId}`;
                    const checked = theme === value;

                    return (
                        <span className={styles.itemWrapper} key={value}>
                            {/*
                              Production hides this input via bare
                              `appearance-none absolute` (no explicit size),
                              relying on the unstyled radio collapsing to an
                              invisible hit target. We additionally apply the
                              codebase's `oxobz-sr-only` utility (same
                              convention as Radio/ChoiceboxGroup) for a more
                              robust, consistent hide — functionally
                              equivalent: the sibling <label for=".."> stays
                              the sole visible/clickable surface either way.
                            */}
                            <input
                                aria-label={label}
                                checked={checked}
                                className={cn(styles.input, 'oxobz-sr-only')}
                                disabled={disabled}
                                id={optionId}
                                name={name}
                                onChange={() => {
                                    // Explicit guard (matches RadioGroup/ChoiceboxGroup):
                                    // don't rely solely on the native `disabled`
                                    // attribute to suppress the change, since it's
                                    // the input's own disabled state driving this.
                                    if (disabled) return;
                                    setTheme(value);
                                }}
                                type="radio"
                                value={value}
                            />
                            <label
                                className={cn(styles.label, disabled && styles.disabled)}
                                data-small={small ? '' : undefined}
                                htmlFor={optionId}
                            >
                                <span className="oxobz-sr-only">{label}</span>
                                <span className={styles.iconWrapper}>
                                    <Icon size={16} />
                                </span>
                            </label>
                        </span>
                    );
                })}
            </fieldset>
        );
    },
);

ThemeSwitcher.displayName = 'ThemeSwitcher';

export { ThemeSwitcher };
