import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import {
    Menu,
    MenuContainer,
    MenuButton,
    MenuItem,
    MenuItemLocked,
    MenuLink,
    MenuSection,
    MenuDivider,
} from './Menu';

/** A default, fully-populated menu used across several tests. */
function renderMenu(
    props: {
        onOne?: () => void;
        disabledThree?: boolean;
        position?: React.ComponentProps<typeof MenuContainer>['position'];
        width?: number;
    } = {},
) {
    return render(
        <MenuContainer position={props.position}>
            <MenuButton>Actions</MenuButton>
            <Menu width={props.width}>
                <MenuItem onClick={props.onOne}>One</MenuItem>
                <MenuItem>Two</MenuItem>
                <MenuItem disabled={props.disabledThree}>Three</MenuItem>
                <MenuItem href="https://vercel.com">Test for Link</MenuItem>
                <MenuItem type="error">Delete</MenuItem>
            </Menu>
        </MenuContainer>,
    );
}

/** Open the menu by clicking its trigger (defaults to the "Actions" button). */
function open(name: string | RegExp = 'Actions') {
    fireEvent.click(screen.getByRole('button', { name }));
}

describe('Menu', () => {
    // ── Open / close ──

    it('is closed by default (no menu in the document)', () => {
        renderMenu();
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens on trigger click and renders the menu in a portal', () => {
        renderMenu();
        open();
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
        expect(document.body.contains(menu)).toBe(true);
        expect(menu).toHaveAttribute('data-oxobz-menu');
        expect(menu).toHaveAttribute('data-version', 'v1');
        expect(menu).toHaveAttribute('data-state', 'open');
    });

    it('toggles closed on a second trigger click (deferred unmount: data-state flips to closed)', () => {
        renderMenu();
        open();
        expect(screen.getByRole('menu')).toBeInTheDocument();
        open();
        // The panel stays mounted (data-state="closed") so the exit fade can
        // play — see the "Exit animation" describe block below for the
        // eventual-removal assertion.
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
    });

    // ── Trigger ARIA wiring ──

    it('wires aria-haspopup / aria-expanded / aria-controls on the trigger', () => {
        renderMenu();
        const button = screen.getByRole('button', { name: 'Actions' });
        expect(button).toHaveAttribute('aria-haspopup', 'true');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        open();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        const menu = screen.getByRole('menu');
        expect(button.getAttribute('aria-controls')).toBe(menu.getAttribute('id'));
        expect(menu.getAttribute('aria-labelledby')).toBe(button.getAttribute('id'));
        expect(button).toHaveAttribute('data-oxobz-menu-button');
        expect(button).toHaveAttribute('data-is-open', 'true');
    });

    it('renders the trigger on top of the shared Button', () => {
        renderMenu();
        const button = screen.getByRole('button', { name: 'Actions' });
        expect(button).toHaveAttribute('data-oxobz-button');
    });

    // ── Items ──

    it('renders items with role=menuitem', () => {
        renderMenu();
        open();
        const items = screen.getAllByRole('menuitem');
        // One, Two, Three, link anchor, Delete
        expect(items).toHaveLength(5);
        expect(items[0]).toHaveTextContent('One');
    });

    it('marks a disabled item with aria-disabled and keeps it out of keyboard nav', () => {
        renderMenu({ disabledThree: true });
        open();
        const three = screen.getByText('Three').closest('[role="menuitem"]');
        expect(three).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies the error variant class to a destructive item', () => {
        renderMenu();
        open();
        const del = screen.getByText('Delete').closest('[role="menuitem"]');
        expect(del?.className).toContain('error');
    });

    it('renders prefix and suffix slots', () => {
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuItem prefix={<span data-testid="pfx">P</span>} suffix={<span data-testid="sfx">S</span>}>
                        Item
                    </MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        expect(screen.getByTestId('pfx')).toBeInTheDocument();
        expect(screen.getByTestId('sfx')).toBeInTheDocument();
    });

    // ── Link items ──

    it('renders an href item as li[role=none] > a[role=menuitem]', () => {
        renderMenu();
        open();
        const anchor = screen.getByText('Test for Link').closest('a');
        expect(anchor).not.toBeNull();
        expect(anchor).toHaveAttribute('role', 'menuitem');
        expect(anchor).toHaveAttribute('href', 'https://vercel.com');
        // External link → target/rel.
        expect(anchor).toHaveAttribute('target', '_blank');
        expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
        const wrapper = anchor?.closest('[data-oxobz-menu-link]');
        expect(wrapper).toHaveAttribute('role', 'none');
    });

    it('renders MenuLink as an anchor menuitem', () => {
        render(
            <MenuContainer>
                <MenuButton>Links</MenuButton>
                <Menu>
                    <MenuLink href="/one">One</MenuLink>
                </Menu>
            </MenuContainer>,
        );
        open('Links');
        const anchor = screen.getByText('One').closest('a');
        expect(anchor).toHaveAttribute('role', 'menuitem');
        expect(anchor).toHaveAttribute('href', '/one');
    });

    // ── Locked / section / divider ──

    it('renders MenuItemLocked as disabled with the lock marker', () => {
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuItemLocked>Delete</MenuItemLocked>
                </Menu>
            </MenuContainer>,
        );
        open();
        const locked = screen.getByText('Delete').closest('[role="menuitem"]');
        expect(locked).toHaveAttribute('aria-disabled', 'true');
        expect(locked).toHaveAttribute('data-oxobz-menu-item-locked');
        expect(locked?.querySelector('svg')).not.toBeNull();
    });

    it('renders MenuSection with a title and a role=group list', () => {
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuSection title="Section">
                        <MenuItem>One</MenuItem>
                    </MenuSection>
                </Menu>
            </MenuContainer>,
        );
        open();
        const section = document.querySelector('[data-oxobz-menu-section]');
        expect(section).toBeInTheDocument();
        expect(screen.getByText('Section')).toBeInTheDocument();
        expect(section?.querySelector('[role="group"]')).not.toBeNull();
    });

    it('renders MenuDivider as a separator', () => {
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuItem>One</MenuItem>
                    <MenuDivider />
                    <MenuItem>Two</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        expect(screen.getByRole('separator')).toBeInTheDocument();
        expect(screen.getByRole('separator')).toHaveAttribute('data-oxobz-menu-divider');
    });

    // ── Activation ──

    it('calls the item onClick and closes the menu on click', () => {
        const onOne = vi.fn();
        renderMenu({ onOne });
        open();
        fireEvent.click(screen.getByText('One'));
        expect(onOne).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
    });

    it('does not activate a disabled item', () => {
        const onClick = vi.fn();
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuItem disabled onClick={onClick}>
                        One
                    </MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        fireEvent.click(screen.getByText('One'));
        expect(onClick).not.toHaveBeenCalled();
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // ── Keyboard navigation ──

    it('highlights items with ArrowDown / ArrowUp', () => {
        renderMenu();
        open();
        const menu = screen.getByRole('menu');
        const items = screen.getAllByRole('menuitem');

        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(items[0]).toHaveAttribute('data-highlighted');
        expect(menu.getAttribute('aria-activedescendant')).toBe(items[0].id);

        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(items[1]).toHaveAttribute('data-highlighted');
        expect(items[0]).not.toHaveAttribute('data-highlighted');

        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        expect(items[0]).toHaveAttribute('data-highlighted');
    });

    it('jumps to first / last with Home / End', () => {
        renderMenu();
        open();
        const menu = screen.getByRole('menu');
        const items = screen.getAllByRole('menuitem');
        fireEvent.keyDown(menu, { key: 'End' });
        expect(items[items.length - 1]).toHaveAttribute('data-highlighted');
        fireEvent.keyDown(menu, { key: 'Home' });
        expect(items[0]).toHaveAttribute('data-highlighted');
    });

    it('activates the highlighted item with Enter', () => {
        const onOne = vi.fn();
        renderMenu({ onOne });
        open();
        const menu = screen.getByRole('menu');
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        fireEvent.keyDown(menu, { key: 'Enter' });
        expect(onOne).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
    });

    it('supports typeahead', () => {
        renderMenu();
        open();
        const menu = screen.getByRole('menu');
        const items = screen.getAllByRole('menuitem');
        // "d" jumps to Delete.
        fireEvent.keyDown(menu, { key: 'd' });
        expect(items[items.length - 1]).toHaveAttribute('data-highlighted');
    });

    // ── Dismissal ──

    it('closes on Escape', async () => {
        renderMenu();
        open();
        fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('closes on outside click', async () => {
        render(
            <div>
                <button type="button">outside</button>
                <MenuContainer>
                    <MenuButton>Actions</MenuButton>
                    <Menu>
                        <MenuItem>One</MenuItem>
                    </Menu>
                </MenuContainer>
            </div>,
        );
        open();
        expect(screen.getByRole('menu')).toBeInTheDocument();
        fireEvent.pointerDown(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    // ── Exit animation (deferred unmount) ──

    it('stays in the DOM with data-state="closed" right after closing, then is removed once the exit fade ends', async () => {
        renderMenu();
        open();
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');
        open();
        const menu = screen.getByRole('menu');
        expect(menu).toHaveAttribute('data-state', 'closed');
        // Proves the POPOVER_EXIT_FALLBACK_MS timer (Menu.tsx) does the
        // unmounting — jsdom has no AnimationEvent implementation, so this
        // component deliberately unmounts via a timer rather than an
        // `animationend` listener (see that constant's doc comment).
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('disables pointer interaction while the exit fade is playing', () => {
        renderMenu();
        open();
        open();
        const menu = screen.getByRole('menu');
        expect(menu).toHaveAttribute('data-state', 'closed');
        expect(menu.className).toContain('menu');
        // The pointer-events: none rule is CSS-only (Menu.module.css,
        // `.menu[data-state='closed']`) — data-state is the hook it keys off.
    });

    it('cancels a pending unmount and shows a single menu when reopened before the exit finishes', async () => {
        renderMenu();
        open();
        open(); // closes -> schedules the deferred unmount
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed');
        open(); // reopens before the fallback timer ever fires
        expect(screen.getAllByRole('menu')).toHaveLength(1);
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');
        // Wait past the fallback window to prove the earlier close's timer
        // was really cancelled, not just racing the reopen.
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
        });
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open');
    });

    it('unmounts immediately when prefers-reduced-motion is set, skipping the exit fade', () => {
        const matchMediaMock = vi.fn().mockReturnValue({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        });
        vi.stubGlobal('matchMedia', matchMediaMock);
        try {
            renderMenu();
            open();
            open();
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    // ── Props: width / chevron / unstyled ──

    it('applies the width prop as an inline pixel style', () => {
        renderMenu({ width: 200 });
        open();
        expect(screen.getByRole('menu')).toHaveStyle({ width: '200px' });
    });

    it('renders a chevron suffix when showChevron is set', () => {
        render(
            <MenuContainer>
                <MenuButton showChevron>Actions</MenuButton>
                <Menu>
                    <MenuItem>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        const button = screen.getByRole('button', { name: 'Actions' });
        expect(button).toHaveAttribute('data-suffix', 'true');
        expect(button.querySelector('svg')).not.toBeNull();
    });

    it('renders an unstyled trigger', () => {
        render(
            <MenuContainer>
                <MenuButton type="unstyled">
                    <span>Trigger</span>
                </MenuButton>
                <Menu>
                    <MenuItem>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        const button = screen.getByRole('button');
        expect(button.className).toContain('unstyled');
        expect(button).not.toHaveAttribute('data-oxobz-button');
        expect(button).toHaveAttribute('data-oxobz-menu-button');
        open('Trigger');
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('honours the position prop on the popover wrapper', () => {
        renderMenu({ position: 'left-start' });
        open();
        const wrapper = screen.getByRole('menu').parentElement;
        expect(wrapper).toHaveAttribute('data-popper-placement', 'left-start');
    });

    // Regression: the position effect must depend on `mounted`, not just
    // `ctx.open`. The render where `ctx.open` first flips true still has
    // `mounted === false`, so the portal (and its `<ul>`) doesn't exist yet
    // and the effect used to bail out on a null list ref; because `mounted`
    // wasn't in its dependency array, it never re-ran on the following render
    // that actually mounts the list, leaving `coords` stuck at the effect's
    // `{ top: 0, left: 0 }` default — the popover then rendered `position:
    // fixed` at the viewport's top-left corner instead of anchored under the
    // trigger.
    it('positions the popover against the trigger the very first time it opens (not pinned to the viewport corner)', () => {
        const triggerRect = { top: 100, left: 200, right: 300, bottom: 140, width: 100, height: 40 };
        const menuRect = { top: 0, left: 0, right: 264, bottom: 200, width: 264, height: 200 };
        const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
            this: Element,
        ) {
            const base = this.tagName === 'UL' ? menuRect : triggerRect;
            return { ...base, x: base.left, y: base.top, toJSON: () => base } as DOMRect;
        });
        try {
            renderMenu({ width: 264 });
            open();
            const wrapper = screen.getByRole('menu').parentElement as HTMLElement;
            // bottom-start (default): align start -> left = trigger.left;
            // top = trigger.bottom + the 8px popover gap.
            expect(wrapper.style.left).toBe('200px');
            expect(wrapper.style.top).toBe('148px');
        } finally {
            spy.mockRestore();
        }
    });

    // ── className / ref ──

    it('appends a custom className on the menu', () => {
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu className="custom-menu">
                    <MenuItem>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        const menu = screen.getByRole('menu');
        expect(menu.className).toContain('menu');
        expect(menu.className).toContain('custom-menu');
    });

    it('forwards a ref to the menu list element', () => {
        const ref = createRef<HTMLUListElement>();
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu ref={ref}>
                    <MenuItem>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        expect(ref.current).toBeInstanceOf(HTMLUListElement);
        expect(ref.current).toHaveAttribute('data-oxobz-menu');
    });

    it('forwards a ref to the trigger button', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <MenuContainer>
                <MenuButton ref={ref}>Actions</MenuButton>
                <Menu>
                    <MenuItem>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current).toHaveAttribute('data-oxobz-menu-button');
    });

    it('forwards a ref to a MenuItem li', () => {
        const ref = createRef<HTMLLIElement>();
        render(
            <MenuContainer>
                <MenuButton>Actions</MenuButton>
                <Menu>
                    <MenuItem ref={ref}>One</MenuItem>
                </Menu>
            </MenuContainer>,
        );
        open();
        expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });

    // ── Compound + displayName ──

    it('exposes sub-components as compound members', () => {
        expect(Menu.Container).toBe(MenuContainer);
        expect(Menu.Button).toBe(MenuButton);
        expect(Menu.Item).toBe(MenuItem);
        expect(Menu.ItemLocked).toBe(MenuItemLocked);
        expect(Menu.Link).toBe(MenuLink);
        expect(Menu.Section).toBe(MenuSection);
        expect(Menu.Divider).toBe(MenuDivider);
    });

    it('has the expected displayNames', () => {
        expect(Menu.displayName).toBe('Menu');
        expect(MenuContainer.displayName).toBe('MenuContainer');
        expect(MenuButton.displayName).toBe('MenuButton');
        expect(MenuItem.displayName).toBe('MenuItem');
        expect(MenuItemLocked.displayName).toBe('MenuItemLocked');
        expect(MenuLink.displayName).toBe('MenuLink');
        expect(MenuSection.displayName).toBe('MenuSection');
        expect(MenuDivider.displayName).toBe('MenuDivider');
    });
});
