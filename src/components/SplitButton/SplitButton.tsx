import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps, type ButtonVariant } from '../Button';
import { MenuContainer, MenuButton, Menu, MenuItem, type MenuItemProps, type MenuProps } from '../Menu';
import styles from './SplitButton.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Primary action variant. Restricted to 'default' | 'secondary' — Geist
 * blocks the destructive variants on purpose (split-button.html,
 * "Best Practices": "hiding a delete inside a dropdown is a sharp edge").
 */
export type SplitButtonVariant = Extract<ButtonVariant, 'default' | 'secondary'>;

/**
 * Dropdown placement relative to the primary button. Best Practices prose:
 * "Default menuAlignment=bottom-start aligns the menu under the primary
 * button; switch to bottom-end only when the button sits flush with the
 * right edge of its container."
 */
export type SplitButtonMenuAlignment = 'bottom-start' | 'bottom-end';

export interface SplitButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Label of the primary (left) button — must mirror the dropdown's first item. */
    children: ReactNode;
    /** Props forwarded to the primary Button (onClick, size, disabled, ...). */
    buttonProps?: Omit<ButtonProps, 'children' | 'variant'> & { variant?: SplitButtonVariant };
    /**
     * Screen-reader label for the dropdown trigger. The trigger renders no
     * visible text (only the chevron icon) so this becomes its sole
     * accessible name, per Best Practices: "It becomes the aria-label on the
     * dropdown trigger and is the only label a screen reader hears for that
     * button."
     */
    menuButtonLabel: string;
    /** `<SplitButtonMenuItem>` elements (or a fragment/array of them) rendered inside the dropdown. */
    menuItems?: ReactNode;
    /** Props forwarded to the dropdown Menu popover (e.g. `width`). */
    menuProps?: Omit<MenuProps, 'children'>;
    /** Dropdown placement. Default `'bottom-start'`. */
    menuAlignment?: SplitButtonMenuAlignment;
    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  SplitButton                                                        */
/* ------------------------------------------------------------------ */

/**
 * A primary Button joined with a dropdown-toggle Button that opens a Menu of
 * closely related actions. Built entirely on the existing Button + Menu
 * primitives — their variant/size/hover/focus/popover behaviour is already
 * verified for those components — this component only adds the "joined
 * pair" seam chrome (shared border, seam-side corner removal, hairline
 * divider) that is specific to SplitButton.
 *
 * Rendered DOM (split-button.html, closed state — the only state captured
 * anywhere in the snapshot):
 * ```html
 * <div class="flex relative" data-oxobz-split-button="" data-version="v1">
 *   <button ...primary Button, seam on the right, border-right: 0...>Save</button>
 *   <button aria-haspopup="true" aria-expanded="false" aria-label="..."
 *           data-is-open="false" ...seam on the left, border-left: 0...>
 *     <svg><!-- chevron-down --></svg>
 *   </button>
 *   <!-- Menu popover renders in a portal while open (see the Menu component) -->
 * </div>
 * ```
 *
 * Divider color is a real, verified production quirk: the `default` variant
 * paints the seam with a static color (`#404040` light / `#cdcdcd` dark) —
 * the `--divider-color` custom property is declared on the wrapper but left
 * unused for that variant — while the `secondary` variant actually consumes
 * `--divider-color` (`var(--ds-gray-300)`). Both are reproduced as-is.
 *
 * needsRecapture: every instance in split-button.html is closed
 * (`aria-expanded="false"`, `data-is-open="false"`) — the open dropdown
 * content was never captured. `SplitButtonMenuItem`'s two-line
 * title/description row therefore reuses the existing Menu `.item` row plus
 * the title/description typography already verified for `ChoiceboxGroup`
 * (14px / 20px line-height) rather than a captured production layout — see
 * the note on `SplitButtonMenuItem` below.
 */
const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(
    (
        {
            children,
            buttonProps,
            menuButtonLabel,
            menuItems,
            menuProps,
            menuAlignment = 'bottom-start',
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const { variant = 'default', disabled, size, ...restButtonProps } = buttonProps ?? {};
        const isSecondary = variant === 'secondary';

        return (
            <MenuContainer
                {...rest}
                ref={ref}
                position={menuAlignment}
                className={cn(styles.wrapper, className)}
                data-oxobz-split-button=""
                data-version={dataVersion}
            >
                <Button
                    {...restButtonProps}
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    className={styles.primary}
                >
                    {children}
                </Button>
                <MenuButton
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    shape="square"
                    svgOnly
                    aria-label={menuButtonLabel}
                    className={cn(styles.toggle, isSecondary && styles.toggleSecondary)}
                >
                    <ChevronDown size={16} />
                </MenuButton>
                <Menu {...menuProps}>{menuItems}</Menu>
            </MenuContainer>
        );
    },
);

SplitButton.displayName = 'SplitButton';

/* ------------------------------------------------------------------ */
/*  SplitButtonMenuItem                                                */
/* ------------------------------------------------------------------ */

export interface SplitButtonMenuItemProps {
    /** Item label. String or JSX (e.g. an icon + text span, per the "Title with Icon" example). */
    title: ReactNode;
    /** Secondary line explaining the action. */
    description?: string;
    /** Icon rendered before the title (16px — the icon example uses `w-4 h-4`). */
    icon?: ReactNode;
    /** Props forwarded to the underlying MenuItem (onClick, className, ...). */
    menuItemProps?: MenuItemProps;
}

/**
 * A row in the SplitButton's dropdown: title + optional description + optional
 * icon, composed from the existing `MenuItem`. See the `needsRecapture` note
 * on `SplitButton` above — the exact production layout for this row was
 * never captured open, so this is a best-effort composition of already-
 * verified pieces rather than a 1:1 translation of a captured DOM.
 */
const SplitButtonMenuItem = forwardRef<HTMLLIElement, SplitButtonMenuItemProps>(
    ({ title, description, icon, menuItemProps }, ref) => {
        const { className, style, ...restItemProps } = menuItemProps ?? {};
        return (
            <MenuItem
                {...restItemProps}
                ref={ref}
                prefix={icon}
                data-oxobz-split-button-menu-item=""
                className={cn(styles.menuItem, className)}
                style={{ '--oxobz-icon-size': '16px', ...style } as CSSProperties}
            >
                <span className={styles.itemTitle}>{title}</span>
                {description !== undefined && <span className={styles.itemDescription}>{description}</span>}
            </MenuItem>
        );
    },
);

SplitButtonMenuItem.displayName = 'SplitButtonMenuItem';

export { SplitButton, SplitButtonMenuItem };
