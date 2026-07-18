import {
    forwardRef,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
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
    /**
     * Props forwarded to the dropdown Menu popover (e.g. `width`). A custom
     * `className` / `style` is merged after this component's own offset and
     * padding correction (see `.menu` / `.menuOffsetStart` in the CSS module).
     */
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
 * divider) plus the two pieces of the OPEN dropdown that are genuinely
 * split-button-specific (see below).
 *
 * Rendered DOM (closed — split-button.html):
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
 * Open dropdown (split-button-open.html — 15 captured instances covering
 * every size, both variants, both alignments, and both icon patterns):
 * the popover's trigger is the narrow toggle button only, so the generic
 * Menu popover (which anchors its `bottom-start` math to the trigger's own
 * left edge) would render the menu under just the toggle instead of the
 * whole joined pair. Production corrects this with a
 * `--split-button-menu-offset` custom property — the primary button's
 * rendered width, negated — applied through the modern standalone
 * `translate` CSS property (confirmed in chunk `20v_289ahbeyd.css`:
 * `.md\:translate-x-[var(--split-button-menu-offset)]{--tw-translate-x:
 * var(--split-button-menu-offset);translate:var(--tw-translate-x)
 * var(--tw-translate-y)}` — the standalone property, NOT the legacy
 * `transform` shorthand, so it composes without conflict with Menu's own
 * `transform: scale(...)` enter-animation inline style). Observed values
 * (-54.03px small, -62.03px medium, -74.23px large "Save") are the primary
 * button's actual rendered width, not a fixed per-size constant, so this
 * component measures it at runtime with a `ResizeObserver` (feature-detected
 * — absent in jsdom, mirroring `MiddleTruncate`'s convention).
 * `bottom-end` needs no correction at all — the toggle's right edge already
 * sits at the pair's right edge, and Menu's own `align: 'end'` math already
 * lands correctly — production reflects this by omitting the translate
 * utility entirely for that instance (`--split-button-menu-offset: 0`, no
 * `md:translate-x-*` class), reproduced here by only applying
 * `.menuOffsetStart` for `menuAlignment="bottom-start"`.
 *
 * Known gap (inherited, out of scope for this component): production also
 * plays an exit fade (`data-[state='closed']:animate-fade-popover-out`, a
 * plain opacity animation — chunk `2dd69db0a79ce415.css`). The shared Menu
 * popover unmounts immediately on close and does not expose a hook to defer
 * that unmount for an exit transition; that limitation belongs to Menu
 * (already documented in `Menu.module.css`'s own header), not to this
 * SplitButton-only pass.
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
        const isBottomStart = menuAlignment === 'bottom-start';

        // Measure the primary button's rendered width so the popover — anchored
        // to the narrow toggle trigger by the shared Menu component — can be
        // shifted left to visually span the whole joined pair. See the
        // `--split-button-menu-offset` note in the component doc comment above.
        const primaryRef = useRef<HTMLButtonElement>(null);
        const [primaryWidth, setPrimaryWidth] = useState(0);

        useEffect(() => {
            const node = primaryRef.current;
            if (!node) return undefined;
            const measure = (): void => setPrimaryWidth(node.getBoundingClientRect().width);
            measure();
            if (typeof ResizeObserver === 'undefined') return undefined;
            const observer = new ResizeObserver(measure);
            observer.observe(node);
            return () => observer.disconnect();
        }, []);

        const { className: menuClassName, style: menuStyle, ...restMenuProps } = menuProps ?? {};

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
                    ref={primaryRef}
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
                <Menu
                    {...restMenuProps}
                    className={cn(styles.menu, isBottomStart && styles.menuOffsetStart, menuClassName)}
                    style={
                        {
                            '--split-button-menu-offset': `${-primaryWidth}px`,
                            ...menuStyle,
                        } as CSSProperties
                    }
                >
                    {menuItems}
                </Menu>
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
    /**
     * Icon rendered before the title, inside the title row (18px — the shared
     * Menu default via `--oxobz-icon-size`; every captured instance in
     * split-button-open.html carries `--geist-icon-size: 18px`, so no
     * per-item override is applied here).
     */
    icon?: ReactNode;
    /** Props forwarded to the underlying MenuItem (onClick, className, ...). */
    menuItemProps?: MenuItemProps;
}

/**
 * A row in the SplitButton's dropdown: an icon + title row, plus an optional
 * description line below it, composed from the existing `MenuItem`.
 *
 * DOM (split-button-open.html, every one of the 15 captured instances
 * agrees): `<li>` > title/description stack (`flex flex-col gap-y-1`) >
 * [title row (`flex items-center gap-x-2`, optional icon + title text),
 * description]. The `<li>` itself carries a production inline-style override
 * (`height: fit-content; padding: 8px;`) that takes precedence over the
 * default popover row tokens for this two-line layout — reproduced as
 * literals in `.menuItem` to match exactly (see the CSS module header for
 * the token values this deliberately overrides).
 */
const SplitButtonMenuItem = forwardRef<HTMLLIElement, SplitButtonMenuItemProps>(
    ({ title, description, icon, menuItemProps }, ref) => {
        const { className, ...restItemProps } = menuItemProps ?? {};
        return (
            <MenuItem
                {...restItemProps}
                ref={ref}
                data-oxobz-split-button-menu-item=""
                className={cn(styles.menuItem, className)}
            >
                <span className={styles.itemContent}>
                    <span className={styles.itemTitleRow}>
                        {icon}
                        <span className={styles.itemTitle}>{title}</span>
                    </span>
                    {description !== undefined && <span className={styles.itemDescription}>{description}</span>}
                </span>
            </MenuItem>
        );
    },
);

SplitButtonMenuItem.displayName = 'SplitButtonMenuItem';

export { SplitButton, SplitButtonMenuItem };
