import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef, type ComponentProps } from 'react';
import { Tabs, type TabItem } from './Tabs';

const FRUIT_TABS: TabItem[] = [
    { title: 'Apple', value: 'apple' },
    { title: 'Orange', value: 'orange' },
    { title: 'Mango', value: 'mango' },
];

function renderTabs(props: Partial<ComponentProps<typeof Tabs>> = {}) {
    const setSelected = vi.fn();
    const utils = render(
        <Tabs
            selected="apple"
            setSelected={setSelected}
            tabs={FRUIT_TABS}
            {...props}
        />,
    );
    return { setSelected, ...utils };
}

describe('Tabs', () => {
    // ── Rendering ──

    it('renders a tablist with data-oxobz-tabs, role, orientation and version', () => {
        const { container } = renderTabs();
        const tablist = container.querySelector('[data-oxobz-tabs]');
        expect(tablist).toBeInTheDocument();
        expect(tablist).toHaveAttribute('role', 'tablist');
        expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
        expect(tablist).toHaveAttribute('data-version', 'v1');
        expect(tablist?.className).toContain('tabs');
    });

    it('defaults to the primary variant', () => {
        const { container } = renderTabs();
        expect(container.querySelector('[data-oxobz-tabs]')).toHaveAttribute(
            'data-variant',
            'primary',
        );
    });

    it('renders one button per tab with role, type and value', () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        tabs.forEach((tab) => {
            expect(tab).toHaveAttribute('type', 'button');
            expect(tab).toHaveAttribute('data-oxobz-tab');
            expect(tab).toHaveAttribute('data-show-focus-ring', 'true');
        });
        expect(tabs[0]).toHaveAttribute('value', 'apple');
    });

    it('renders every tab title', () => {
        renderTabs();
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Orange')).toBeInTheDocument();
        expect(screen.getByText('Mango')).toBeInTheDocument();
    });

    it('wires aria-controls to the tab id', () => {
        renderTabs();
        const [apple] = screen.getAllByRole('tab');
        expect(apple.getAttribute('aria-controls')).toBe(apple.id);
        expect(apple.id).not.toBe('');
    });

    it('allows a custom data-version', () => {
        const { container } = renderTabs({ 'data-version': 'v2' });
        expect(container.querySelector('[data-oxobz-tabs]')).toHaveAttribute(
            'data-version',
            'v2',
        );
    });

    // ── Selection state (roving tabindex) ──

    it('marks the selected tab and applies roving tabindex', () => {
        renderTabs({ selected: 'orange' });
        const [apple, orange, mango] = screen.getAllByRole('tab');
        expect(orange).toHaveAttribute('aria-selected', 'true');
        expect(apple).toHaveAttribute('aria-selected', 'false');
        expect(mango).toHaveAttribute('aria-selected', 'false');
        expect(orange).toHaveAttribute('tabindex', '0');
        expect(apple).toHaveAttribute('tabindex', '-1');
        expect(mango).toHaveAttribute('tabindex', '-1');
    });

    // ── Activation ──

    it('calls setSelected with the clicked tab value', () => {
        const { setSelected } = renderTabs();
        fireEvent.click(screen.getByText('Orange'));
        expect(setSelected).toHaveBeenCalledTimes(1);
        expect(setSelected).toHaveBeenCalledWith('orange');
    });

    // ── Variant ──

    it('reflects the secondary variant on the tablist', () => {
        const { container } = renderTabs({ variant: 'secondary' });
        expect(container.querySelector('[data-oxobz-tabs]')).toHaveAttribute(
            'data-variant',
            'secondary',
        );
    });

    // ── Disabled (all) ──

    it('disables every tab when disabled is set', () => {
        renderTabs({ disabled: true });
        screen.getAllByRole('tab').forEach((tab) => {
            expect(tab).toBeDisabled();
        });
    });

    it('does not fire setSelected when a disabled tab is clicked', () => {
        const { setSelected } = renderTabs({ disabled: true });
        fireEvent.click(screen.getByText('Orange'));
        expect(setSelected).not.toHaveBeenCalled();
    });

    // ── Disabled (specific) ──

    it('disables only the tabs flagged disabled', () => {
        renderTabs({
            tabs: [
                { title: 'Apple', value: 'apple' },
                { title: 'Orange', value: 'orange' },
                { title: 'Mango', value: 'mango', disabled: true },
            ],
        });
        const [apple, orange, mango] = screen.getAllByRole('tab');
        expect(apple).not.toBeDisabled();
        expect(orange).not.toBeDisabled();
        expect(mango).toBeDisabled();
    });

    // ── Tooltip ──

    it('wraps a tab that has a tooltip in a tooltip trigger', () => {
        const { container } = renderTabs({
            tabs: [
                { title: 'Apple', value: 'apple' },
                {
                    title: 'Mango',
                    value: 'mango',
                    disabled: true,
                    tooltip: 'Mangos are not allowed',
                },
            ],
        });
        const trigger = container.querySelector('[data-oxobz-tooltip]');
        expect(trigger).toBeInTheDocument();
        expect(trigger?.querySelector('button[value="mango"]')).toBeInTheDocument();
    });

    it('does not wrap tabs without a tooltip', () => {
        const { container } = renderTabs();
        expect(container.querySelector('[data-oxobz-tooltip]')).toBeNull();
    });

    // ── Icons ──

    it('renders an icon inside the tabIcon slot', () => {
        const { container } = renderTabs({
            tabs: [
                {
                    title: 'GitHub',
                    value: 'github',
                    icon: <svg data-testid="gh-icon" />,
                },
            ],
        });
        expect(screen.getByTestId('gh-icon')).toBeInTheDocument();
        const iconSlot = container.querySelector('[class*="tabIcon"]');
        expect(iconSlot).toBeInTheDocument();
        expect(iconSlot?.querySelector('svg')).toBeInTheDocument();
    });

    // ── Keyboard navigation ──

    it('moves focus to the next tab on ArrowRight', () => {
        renderTabs();
        const [apple, orange] = screen.getAllByRole('tab');
        apple.focus();
        fireEvent.keyDown(apple, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(orange);
    });

    it('moves focus to the previous tab on ArrowLeft', () => {
        renderTabs({ selected: 'orange' });
        const [apple, orange] = screen.getAllByRole('tab');
        orange.focus();
        fireEvent.keyDown(orange, { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(apple);
    });

    it('wraps focus from the first tab to the last on ArrowLeft', () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        const [apple] = tabs;
        const mango = tabs[tabs.length - 1];
        apple.focus();
        fireEvent.keyDown(apple, { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(mango);
    });

    it('skips disabled tabs during arrow navigation', () => {
        renderTabs({
            tabs: [
                { title: 'Apple', value: 'apple' },
                { title: 'Orange', value: 'orange', disabled: true },
                { title: 'Mango', value: 'mango' },
            ],
        });
        const tabs = screen.getAllByRole('tab');
        const [apple] = tabs;
        const mango = tabs[tabs.length - 1];
        apple.focus();
        fireEvent.keyDown(apple, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(mango);
    });

    // ── Custom className / prop forwarding ──

    it('appends a custom className on the tablist', () => {
        const { container } = renderTabs({ className: 'custom-row' });
        const tablist = container.querySelector('[data-oxobz-tabs]');
        expect(tablist?.className).toContain('tabs');
        expect(tablist?.className).toContain('custom-row');
    });

    it('forwards extra HTML attributes (aria-label)', () => {
        const { container } = renderTabs({ 'aria-label': 'Sections' });
        expect(container.querySelector('[data-oxobz-tabs]')).toHaveAttribute(
            'aria-label',
            'Sections',
        );
    });

    // ── Ref forwarding ──

    it('forwards ref to the tablist div', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Tabs
                ref={ref}
                selected="apple"
                setSelected={vi.fn()}
                tabs={FRUIT_TABS}
            />,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-tabs');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Tabs.displayName).toBe('Tabs');
    });
});
