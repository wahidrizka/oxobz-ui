import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type AnchorHTMLAttributes,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEventHandler,
    type MutableRefObject,
    type ReactNode,
    type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LockClosed } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps } from '../Button';
import styles from './Menu.module.css';

/* ------------------------------------------------------------------ */
/*  Motion / layout constants                                          */
/* ------------------------------------------------------------------ */

/** Gap between the trigger and the popover, in px. */
const POPOVER_GAP = 8;
/** Closed-state scale for the popover enter animation. */
const POPOVER_SCALE = 0.96;
/**
 * Duration (ms) the popover stays mounted after closing, so the exit fade
 * (`data-state="closed"` -> `fadePopoverOut`, Menu.module.css) has time to
 * play before the panel is actually removed. Mirrors
 * `--ds-motion-popover-duration` (200ms, motion.css) plus a small margin, the
 * same "JS timer matching a CSS duration" approach `Feedback` already uses
 * for its own popover (`POPOVER_EXIT_MS`) — deliberately not a real
 * `animationend` listener: jsdom has no `AnimationEvent` implementation, so
 * a CSS-animation completion event can't be dispatched in tests at all (only
 * `TransitionEvent` exists there), making a timer the only mechanism that is
 * reliable in both real browsers and this test environment.
 */
const POPOVER_EXIT_FALLBACK_MS = 250;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Popover placement relative to the trigger. Mirrors the Geist `position`
 * prop; the popover auto-flips vertically when it would overflow the viewport.
 * Default = `bottom-start` (matches the snapshot `data-popper-placement`).
 */
export type MenuPosition =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Feature-detected `prefers-reduced-motion` check (jsdom has no
 * `window.matchMedia`, mirroring the `ResizeObserver` guard convention in
 * `SplitButton`). No chunk captures how production's popover behaves under
 * reduced motion, so — per this component's own accessibility policy — the
 * exit fade is skipped outright (immediate unmount) rather than guessed at.
 */
function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

/** Compute viewport (position: fixed) coordinates for the popover. */
function computePosition(
    position: MenuPosition,
    trigger: DOMRect,
    menu: DOMRect,
): { top: number; left: number } {
    const [side, align = 'center'] = position.split('-') as [string, string?];
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

    let top = 0;
    let left = 0;

    // Primary axis.
    if (side === 'bottom') top = trigger.bottom + POPOVER_GAP;
    else if (side === 'top') top = trigger.top - menu.height - POPOVER_GAP;
    else if (side === 'left') left = trigger.left - menu.width - POPOVER_GAP;
    else if (side === 'right') left = trigger.right + POPOVER_GAP;

    // Cross axis alignment.
    if (side === 'bottom' || side === 'top') {
        if (align === 'start') left = trigger.left;
        else if (align === 'end') left = trigger.right - menu.width;
        else left = trigger.left + trigger.width / 2 - menu.width / 2;
    } else {
        if (align === 'start') top = trigger.top;
        else if (align === 'end') top = trigger.bottom - menu.height;
        else top = trigger.top + trigger.height / 2 - menu.height / 2;
    }

    // Vertical auto-flip when overflowing the viewport.
    if (side === 'bottom' && vh > 0 && top + menu.height > vh) {
        top = trigger.top - menu.height - POPOVER_GAP;
    } else if (side === 'top' && top < 0) {
        top = trigger.bottom + POPOVER_GAP;
    }

    // Keep the popover within the horizontal viewport bounds.
    if (vw > 0) {
        left = Math.max(POPOVER_GAP, Math.min(left, vw - menu.width - POPOVER_GAP));
    }

    return { top, left };
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface MenuContextValue {
    open: boolean;
    toggle: () => void;
    closeMenu: (returnFocus?: boolean) => void;
    /** id of the trigger — used for `aria-labelledby` on the menu. */
    buttonId: string;
    /** id of the menu — used for `aria-controls` on the trigger. */
    menuId: string;
    position: MenuPosition;
    triggerRef: MutableRefObject<HTMLElement | null>;
    setTriggerNode: (node: HTMLElement | null) => void;
    setMenuNode: (node: HTMLElement | null) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(component: string): MenuContextValue {
    const ctx = useContext(MenuContext);
    if (!ctx) {
        throw new Error(`${component} must be used within a <MenuContainer>.`);
    }
    return ctx;
}

/* ------------------------------------------------------------------ */
/*  MenuContainer (root)                                               */
/* ------------------------------------------------------------------ */

export interface MenuContainerProps extends HTMLAttributes<HTMLDivElement> {
    /** Popover placement relative to the trigger. Default = `bottom-start`. */
    position?: MenuPosition;
    children?: ReactNode;
}

/**
 * MenuContainer — owns the open state, ids and dismissal wiring for a Menu.
 * Wraps a `MenuButton` (trigger) and a `Menu` (popover). Closes on Escape and
 * outside-click; returns focus to the trigger on Escape / item activation.
 *
 * DOM + behaviour source: geistcn snapshot
 * `_nextstatic/component-inspect-element/menu.html` and the Geist `menu.md` API.
 */
const MenuContainer = forwardRef<HTMLDivElement, MenuContainerProps>(
    ({ position = 'bottom-start', className, children, ...rest }, ref) => {
        const reactId = useId();
        const buttonId = `menu-button-${reactId}`;
        const menuId = `menu-${reactId}`;

        const [open, setOpen] = useState(false);
        const triggerRef = useRef<HTMLElement | null>(null);
        const menuNodeRef = useRef<HTMLElement | null>(null);

        const setTriggerNode = useCallback((node: HTMLElement | null) => {
            triggerRef.current = node;
        }, []);
        const setMenuNode = useCallback((node: HTMLElement | null) => {
            menuNodeRef.current = node;
        }, []);

        const closeMenu = useCallback((returnFocus = false) => {
            setOpen(false);
            if (returnFocus) {
                requestAnimationFrame(() => triggerRef.current?.focus());
            }
        }, []);
        const toggle = useCallback(() => setOpen((o) => !o), []);

        // Dismiss on outside-click (no focus return) and Escape (focus return).
        useEffect(() => {
            if (!open) return;
            const onPointerDown = (event: PointerEvent) => {
                const target = event.target as Node;
                if (triggerRef.current?.contains(target)) return;
                if (menuNodeRef.current?.contains(target)) return;
                closeMenu(false);
            };
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    closeMenu(true);
                }
            };
            document.addEventListener('pointerdown', onPointerDown, true);
            document.addEventListener('keydown', onKeyDown, true);
            return () => {
                document.removeEventListener('pointerdown', onPointerDown, true);
                document.removeEventListener('keydown', onKeyDown, true);
            };
        }, [open, closeMenu]);

        const contextValue = useMemo<MenuContextValue>(
            () => ({
                open,
                toggle,
                closeMenu,
                buttonId,
                menuId,
                position,
                triggerRef,
                setTriggerNode,
                setMenuNode,
            }),
            [open, toggle, closeMenu, buttonId, menuId, position, setTriggerNode, setMenuNode],
        );

        return (
            <MenuContext.Provider value={contextValue}>
                <div
                    {...rest}
                    ref={ref}
                    className={cn(styles.container, className)}
                    data-oxobz-menu-container=""
                >
                    {children}
                </div>
            </MenuContext.Provider>
        );
    },
);
MenuContainer.displayName = 'MenuContainer';

/* ------------------------------------------------------------------ */
/*  MenuButton (trigger)                                               */
/* ------------------------------------------------------------------ */

export interface MenuButtonProps extends ButtonProps {
    /** Render a chevron suffix that rotates while the menu is open. */
    showChevron?: boolean;
    /** `unstyled` renders a bare button wrapper (e.g. around an Avatar). */
    type?: 'unstyled';
}

/**
 * MenuButton — the trigger. Extends the shared Button (per the Geist docs:
 * "Menu extends the Button component"), adding the popup ARIA wiring
 * (`aria-haspopup` / `aria-expanded` / `aria-controls`), the `data-oxobz-menu-button`
 * marker and `data-is-open`. `type="unstyled"` drops the button chrome.
 */
const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
    (
        {
            showChevron = false,
            type,
            variant,
            size,
            shape,
            shadow,
            svgOnly,
            loading,
            typeName,
            prefix,
            suffix,
            className,
            children,
            onClick,
            ...rest
        },
        ref,
    ) => {
        const ctx = useMenuContext('MenuButton');
        const setRef = mergeRefs<HTMLButtonElement>(ref, ctx.setTriggerNode);

        const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
            (event) => {
                onClick?.(event);
                if (!event.defaultPrevented) ctx.toggle();
            },
            [onClick, ctx],
        );

        const chevron = showChevron ? (
            <ChevronDown size={16} className={cn(styles.chevron, ctx.open && styles.chevronOpen)} />
        ) : undefined;
        const effectiveSuffix = chevron ?? suffix;

        // Shared popup wiring (data attributes are string values).
        const popupProps = {
            id: ctx.buttonId,
            'aria-haspopup': 'true' as const,
            'aria-expanded': ctx.open,
            'aria-controls': ctx.open ? ctx.menuId : undefined,
            'data-oxobz-menu-button': '',
            ...(ctx.open ? { 'data-is-open': 'true' } : {}),
        };

        if (type === 'unstyled') {
            return (
                <button
                    {...rest}
                    {...popupProps}
                    ref={setRef}
                    type="button"
                    onClick={handleClick}
                    className={cn(styles.unstyled, className)}
                >
                    {children}
                </button>
            );
        }

        return (
            <Button
                {...rest}
                {...popupProps}
                ref={setRef}
                variant={variant}
                size={size}
                shape={shape}
                shadow={shadow}
                svgOnly={svgOnly}
                loading={loading}
                typeName={typeName}
                prefix={prefix}
                suffix={effectiveSuffix}
                className={className}
                onClick={handleClick}
            >
                {children}
            </Button>
        );
    },
);
MenuButton.displayName = 'MenuButton';

/* ------------------------------------------------------------------ */
/*  Menu (popover panel)                                               */
/* ------------------------------------------------------------------ */

export interface MenuProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    /** Fixed width in px. Omit to size to the content. */
    width?: number;
    children?: ReactNode;
}

/** Focusable, non-disabled `menuitem` elements inside the list, in DOM order. */
function getItems(list: HTMLElement | null): HTMLElement[] {
    if (!list) return [];
    return Array.from(list.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
        (el) => el.getAttribute('aria-disabled') !== 'true',
    );
}

/**
 * Menu — the popover panel, rendered in a portal on `document.body` while open
 * or closing. Handles roving highlight (`data-highlighted` +
 * `aria-activedescendant`), arrow / Home / End navigation, Enter / Space
 * activation and typeahead.
 *
 * Styling: `menu-module` (`.menu-module__ktVwuW__*`) in chunk
 * `b4b9d0dd5348b0c3.css` + the `.material-menu` preset (chunk
 * `2dd69db0a79ce415.css`). DOM shape from the `menu.html` snapshot.
 *
 * Mount / unmount lifecycle: mounts synchronously on open; on close it stays
 * mounted (with `data-state="closed"`) for `POPOVER_EXIT_FALLBACK_MS` so the
 * exit fade (`fadePopoverOut` in Menu.module.css) has time to play before
 * actually unmounting. See the CSS module header for the production values
 * this reproduces, and the `POPOVER_EXIT_FALLBACK_MS` doc comment above for
 * why this is a timer rather than an `animationend` listener.
 */
const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ width, className, children, style, ...rest }, ref) => {
        const ctx = useMenuContext('Menu');
        const listRef = useRef<HTMLUListElement | null>(null);
        const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
        const [visible, setVisible] = useState(false);
        const [activeId, setActiveId] = useState<string | null>(null);
        // Deferred-unmount gate — see the lifecycle note above.
        const [mounted, setMounted] = useState(false);

        const setListRef = mergeRefs<HTMLUListElement>(ref, (node) => {
            listRef.current = node;
        });

        // Enter animation (opacity + scale). Reset when closed.
        useEffect(() => {
            if (!ctx.open) {
                setVisible(false);
                setActiveId(null);
                return;
            }
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }, [ctx.open]);

        // Mount immediately on open. On close, keep the popover mounted long
        // enough for the CSS exit fade to play; a reopen before that timer
        // fires cancels it cleanly via this effect's own cleanup (deps
        // change -> React tears down the previous effect first), so rapid
        // toggling never leaves a stray timer or a duplicated popover.
        useEffect(() => {
            if (ctx.open) {
                setMounted(true);
                return undefined;
            }
            if (!mounted) return undefined;
            if (prefersReducedMotion()) {
                setMounted(false);
                return undefined;
            }
            const timer = window.setTimeout(() => setMounted(false), POPOVER_EXIT_FALLBACK_MS);
            return () => window.clearTimeout(timer);
        }, [ctx.open, mounted]);

        // Position the popover against the trigger. Depends on `mounted` (not
        // just `ctx.open`): the render where `ctx.open` first flips true still
        // has `mounted === false` (see the mount-lifecycle effect above), so
        // this component still returns `null` — `listRef.current` is null on
        // that pass and the effect used to bail out silently. Because
        // `mounted` wasn't a dependency, the effect never re-ran on the next
        // render (the one that actually mounts the portal's `<ul>`), so
        // `coords` stayed stuck at its `{ top: 0, left: 0 }` initial value —
        // the popover then renders `position: fixed` at the viewport's
        // top-left corner instead of anchored under the trigger. Adding
        // `mounted` here makes the effect re-run once the list node exists.
        useEffect(() => {
            if (!ctx.open || !mounted) return;
            const trigger = ctx.triggerRef.current;
            const list = listRef.current;
            if (!trigger || !list) return;
            setCoords(computePosition(ctx.position, trigger.getBoundingClientRect(), list.getBoundingClientRect()));
        }, [ctx.open, mounted, ctx.position, width]);

        // Move focus to the list on open so key events are captured.
        useEffect(() => {
            if (!ctx.open) return;
            const raf = requestAnimationFrame(() => listRef.current?.focus());
            return () => cancelAnimationFrame(raf);
        }, [ctx.open]);

        const highlight = useCallback((el: HTMLElement | null) => {
            const list = listRef.current;
            if (!list) return;
            list.querySelectorAll('[data-highlighted]').forEach((n) => n.removeAttribute('data-highlighted'));
            if (el) {
                el.setAttribute('data-highlighted', '');
                setActiveId(el.id || null);
                try {
                    el.scrollIntoView?.({ block: 'nearest' });
                } catch {
                    /* jsdom: scrollIntoView is not implemented. */
                }
            } else {
                setActiveId(null);
            }
        }, []);

        const handleKeyDown = useCallback(
            (event: ReactKeyboardEvent<HTMLUListElement>) => {
                const items = getItems(listRef.current);
                if (items.length === 0) return;
                const current = activeId ? items.findIndex((i) => i.id === activeId) : -1;

                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        highlight(items[(current + 1) % items.length]);
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        highlight(items[(current - 1 + items.length) % items.length]);
                        break;
                    case 'Home':
                        event.preventDefault();
                        highlight(items[0]);
                        break;
                    case 'End':
                        event.preventDefault();
                        highlight(items[items.length - 1]);
                        break;
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        if (current >= 0) items[current].click();
                        break;
                    default:
                        // Typeahead: jump to the next item starting with the typed char.
                        if (event.key.length === 1 && /\S/.test(event.key)) {
                            const char = event.key.toLowerCase();
                            const start = current + 1;
                            const ordered = [...items.slice(start), ...items.slice(0, start)];
                            const match = ordered.find((i) =>
                                (i.textContent ?? '').trim().toLowerCase().startsWith(char),
                            );
                            if (match) highlight(match);
                        }
                }
            },
            [activeId, highlight],
        );

        if (!mounted || typeof document === 'undefined') return null;

        return createPortal(
            <div
                ref={ctx.setMenuNode}
                className={styles.wrapper}
                data-popper-placement={ctx.position}
                style={{ top: coords.top, left: coords.left }}
            >
                <ul
                    {...rest}
                    ref={setListRef}
                    id={ctx.menuId}
                    role="menu"
                    tabIndex={-1}
                    aria-labelledby={ctx.buttonId}
                    aria-activedescendant={activeId ?? undefined}
                    data-oxobz-menu=""
                    data-version="v1"
                    data-state={ctx.open ? 'open' : 'closed'}
                    className={cn(styles.menu, className)}
                    style={{
                        width: width !== undefined ? `${width}px` : undefined,
                        opacity: visible ? 1 : 0,
                        transform: `scale(${visible ? 1 : POPOVER_SCALE})`,
                        ...style,
                    }}
                    onKeyDown={handleKeyDown}
                >
                    {children}
                </ul>
            </div>,
            document.body,
        );
    },
);
Menu.displayName = 'Menu';

/* ------------------------------------------------------------------ */
/*  MenuItem                                                           */
/* ------------------------------------------------------------------ */

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLElement>, 'prefix'> {
    /** Disable the item (inert, greyed out). */
    disabled?: boolean;
    /** `error` renders the destructive (red) variant. */
    type?: 'error';
    /** Icon rendered before the label. */
    prefix?: ReactNode;
    /** Icon rendered after the label. */
    suffix?: ReactNode;
    /** Render the item as a link. */
    href?: string;
    /** Anchor target (link items only). */
    target?: string;
    /** Anchor rel (link items only). */
    rel?: string;
}

/**
 * MenuItem — a single row. Renders `<li role="menuitem">` by default, or
 * `<li role="none"><a role="menuitem"></a></li>` when `href` is provided (per
 * the snapshot). Activating a non-disabled item closes the menu.
 */
const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(
    (
        {
            disabled = false,
            type,
            prefix,
            suffix,
            href,
            target,
            rel,
            className,
            children,
            onClick,
            style,
            ...rest
        },
        ref,
    ) => {
        const ctx = useMenuContext('MenuItem');
        const rid = useId();
        const itemId = `menu-item-el-${rid}`;
        const labelId = `menu-item-${rid}`;

        const activate = useCallback<MouseEventHandler<HTMLElement>>(
            (event) => {
                if (disabled) {
                    event.preventDefault();
                    return;
                }
                onClick?.(event);
                ctx.closeMenu(true);
            },
            [disabled, onClick, ctx],
        );

        const inner = (
            <>
                {prefix != null && <span className={styles.prefix}>{prefix}</span>}
                <span id={labelId}>{children}</span>
                {suffix != null && <span className={styles.suffix}>{suffix}</span>}
            </>
        );

        const itemStyle = { '--oxobz-icon-size': '18px', ...style } as React.CSSProperties;
        const itemClassName = cn(styles.item, type === 'error' && styles.error, className);

        if (href !== undefined) {
            // External links get target/rel, mirroring the snapshot.
            const isExternal = /^https?:\/\//.test(href);
            const resolvedTarget = target ?? (isExternal ? '_blank' : undefined);
            const resolvedRel = rel ?? (isExternal ? 'noopener noreferrer' : undefined);
            return (
                <li
                    ref={ref}
                    role="none"
                    data-oxobz-menu-item=""
                    data-oxobz-menu-link=""
                    className={styles.linkItem}
                >
                    <a
                        {...rest}
                        id={itemId}
                        href={disabled ? undefined : href}
                        target={resolvedTarget}
                        rel={resolvedRel}
                        role="menuitem"
                        tabIndex={-1}
                        aria-labelledby={labelId}
                        aria-disabled={disabled || undefined}
                        data-oxobz-menu-item=""
                        className={itemClassName}
                        style={itemStyle}
                        onClick={activate}
                    >
                        {inner}
                    </a>
                </li>
            );
        }

        return (
            <li
                {...rest}
                ref={ref}
                id={itemId}
                role="menuitem"
                tabIndex={-1}
                aria-labelledby={labelId}
                aria-disabled={disabled || undefined}
                data-oxobz-menu-item=""
                className={cn(itemClassName, disabled && styles.disabled)}
                style={itemStyle}
                onClick={activate}
            >
                {inner}
            </li>
        );
    },
);
MenuItem.displayName = 'MenuItem';

/* ------------------------------------------------------------------ */
/*  MenuItemLocked                                                     */
/* ------------------------------------------------------------------ */

export interface MenuItemLockedProps extends Omit<MenuItemProps, 'disabled' | 'suffix' | 'href'> {}

/**
 * MenuItemLocked — a permission-gated item. Rendered disabled with a lock icon
 * suffix, per the Geist docs.
 */
const MenuItemLocked = forwardRef<HTMLLIElement, MenuItemLockedProps>((props, ref) => (
    <MenuItem
        {...props}
        ref={ref}
        disabled
        suffix={<LockClosed size={18} />}
        data-oxobz-menu-item-locked=""
    />
));
MenuItemLocked.displayName = 'MenuItemLocked';

/* ------------------------------------------------------------------ */
/*  MenuLink                                                           */
/* ------------------------------------------------------------------ */

export interface MenuLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
    /** `error` renders the destructive (red) variant. */
    type?: 'error';
    /** Icon rendered before the label. */
    prefix?: ReactNode;
    /** Icon rendered after the label. */
    suffix?: ReactNode;
    /** Disable the link. */
    disabled?: boolean;
}

/**
 * MenuLink — a link row. Structure matches the snapshot link item
 * (`<li role="none"><a role="menuitem"></a></li>`). Forwards the ref to the
 * anchor.
 */
const MenuLink = forwardRef<HTMLAnchorElement, MenuLinkProps>(
    ({ type, prefix, suffix, disabled = false, href, className, children, onClick, style, ...rest }, ref) => {
        const ctx = useMenuContext('MenuLink');
        const rid = useId();
        const labelId = `menu-item-${rid}`;

        const activate = useCallback<MouseEventHandler<HTMLAnchorElement>>(
            (event) => {
                if (disabled) {
                    event.preventDefault();
                    return;
                }
                onClick?.(event);
                ctx.closeMenu(true);
            },
            [disabled, onClick, ctx],
        );

        const itemStyle = { '--oxobz-icon-size': '18px', ...style } as React.CSSProperties;

        return (
            <li role="none" data-oxobz-menu-item="" data-oxobz-menu-link="" className={styles.linkItem}>
                <a
                    {...rest}
                    ref={ref}
                    href={disabled ? undefined : href}
                    role="menuitem"
                    tabIndex={-1}
                    aria-labelledby={labelId}
                    aria-disabled={disabled || undefined}
                    data-oxobz-menu-item=""
                    className={cn(styles.item, type === 'error' && styles.error, className)}
                    style={itemStyle}
                    onClick={activate}
                >
                    {prefix != null && <span className={styles.prefix}>{prefix}</span>}
                    <span id={labelId}>{children}</span>
                    {suffix != null && <span className={styles.suffix}>{suffix}</span>}
                </a>
            </li>
        );
    },
);
MenuLink.displayName = 'MenuLink';

/* ------------------------------------------------------------------ */
/*  MenuSection                                                        */
/* ------------------------------------------------------------------ */

export interface MenuSectionProps extends HTMLAttributes<HTMLLIElement> {
    /** Section header (Title Case, 1–2 words). */
    title?: string;
    children?: ReactNode;
}

/**
 * MenuSection — a titled group of items (`menu-module__section`). Renders a
 * presentational `<li>` holding an optional title and a nested `role="group"`.
 */
const MenuSection = forwardRef<HTMLLIElement, MenuSectionProps>(
    ({ title, className, children, ...rest }, ref) => {
        const rid = useId();
        const titleId = `menu-section-${rid}`;
        return (
            <li
                {...rest}
                ref={ref}
                role="presentation"
                data-oxobz-menu-section=""
                className={cn(styles.section, className)}
            >
                {title != null && (
                    <span id={titleId} className={styles.title}>
                        {title}
                    </span>
                )}
                <ul role="group" aria-labelledby={title != null ? titleId : undefined} className={styles.sectionList}>
                    {children}
                </ul>
            </li>
        );
    },
);
MenuSection.displayName = 'MenuSection';

/* ------------------------------------------------------------------ */
/*  MenuDivider                                                        */
/* ------------------------------------------------------------------ */

export interface MenuDividerProps extends HTMLAttributes<HTMLLIElement> {}

/** MenuDivider — a hairline separator (`menu-module__divider`). */
const MenuDivider = forwardRef<HTMLLIElement, MenuDividerProps>(({ className, ...rest }, ref) => (
    <li
        {...rest}
        ref={ref}
        role="separator"
        data-oxobz-menu-divider=""
        className={cn(styles.divider, className)}
    />
));
MenuDivider.displayName = 'MenuDivider';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const MenuNamespace = Object.assign(Menu, {
    Container: MenuContainer,
    Button: MenuButton,
    Item: MenuItem,
    ItemLocked: MenuItemLocked,
    Link: MenuLink,
    Section: MenuSection,
    Divider: MenuDivider,
});

// Flat sub-components are exported inline via `const` + the block below,
// matching the official docs names. `Menu` additionally exposes them as
// compound members (Menu.Item, Menu.Section, …).
export {
    MenuNamespace as Menu,
    MenuContainer,
    MenuButton,
    MenuItem,
    MenuItemLocked,
    MenuLink,
    MenuSection,
    MenuDivider,
};
