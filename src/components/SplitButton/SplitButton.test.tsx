import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { SplitButton, SplitButtonMenuItem } from './SplitButton';

/** A default, fully-populated SplitButton used across several tests. */
function renderSplitButton(
    props: {
        onSave?: () => void;
        onRedeploy?: () => void;
        variant?: 'default' | 'secondary';
        size?: 'small' | 'medium' | 'large';
        disabled?: boolean;
        menuAlignment?: 'bottom-start' | 'bottom-end';
        className?: string;
    } = {},
) {
    return render(
        <SplitButton
            buttonProps={{
                onClick: props.onSave,
                variant: props.variant,
                size: props.size,
                disabled: props.disabled,
            }}
            className={props.className}
            menuAlignment={props.menuAlignment}
            menuButtonLabel="Select save method"
            menuItems={
                <>
                    <SplitButtonMenuItem
                        description="Save changes"
                        menuItemProps={{ onClick: props.onSave }}
                        title="Save"
                    />
                    <SplitButtonMenuItem
                        description="Save changes and create a new production deployment"
                        menuItemProps={{ onClick: props.onRedeploy }}
                        title="Save + Redeploy"
                    />
                </>
            }
            menuProps={{ width: 264 }}
        >
            Save
        </SplitButton>,
    );
}

/** Opens the dropdown via the toggle trigger. */
function openMenu(label: string | RegExp = 'Select save method') {
    fireEvent.click(screen.getByRole('button', { name: label }));
}

describe('SplitButton', () => {
    // ── Rendering ──

    it('renders a root wrapper with data-oxobz-split-button and data-version="v1"', () => {
        const { container } = renderSplitButton();
        const root = container.querySelector('[data-oxobz-split-button]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
    });

    it('renders the primary button with its label', () => {
        renderSplitButton();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders the dropdown toggle with the menuButtonLabel as its aria-label', () => {
        renderSplitButton();
        const toggle = screen.getByRole('button', { name: 'Select save method' });
        expect(toggle).toBeInTheDocument();
        expect(toggle).toHaveAttribute('aria-haspopup', 'true');
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    // ── Primary button interaction ──

    it('calls buttonProps.onClick when the primary button is clicked', () => {
        const onSave = vi.fn();
        renderSplitButton({ onSave });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    // ── Dropdown open / close ──

    it('is closed by default (no menu in the document)', () => {
        renderSplitButton();
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens the dropdown on toggle click and renders the menu items', () => {
        renderSplitButton();
        openMenu();
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByText('Save + Redeploy')).toBeInTheDocument();
        expect(screen.getByText('Save changes and create a new production deployment')).toBeInTheDocument();
    });

    it('closes the dropdown after activating a menu item and calls its onClick', () => {
        const onRedeploy = vi.fn();
        renderSplitButton({ onRedeploy });
        openMenu();
        fireEvent.click(screen.getByText('Save + Redeploy'));
        expect(onRedeploy).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    // ── Variant / size / disabled propagation ──

    it.each(['default', 'secondary'] as const)('applies the %s variant to both buttons', (variant) => {
        const { container } = renderSplitButton({ variant });
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(2);
        buttons.forEach((button) => {
            if (variant === 'secondary') {
                expect(button.className).toContain('secondary');
            }
        });
    });

    it.each(['small', 'medium', 'large'] as const)('applies the %s size to both buttons', (size) => {
        const { container } = renderSplitButton({ size });
        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(2);
        if (size !== 'medium') {
            buttons.forEach((button) => expect(button.className).toContain(size));
        }
    });

    it('disables both the primary and toggle buttons', () => {
        renderSplitButton({ disabled: true });
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Select save method' })).toBeDisabled();
    });

    // ── menuAlignment ──

    it('defaults menuAlignment to bottom-start', () => {
        renderSplitButton();
        openMenu();
        const popover = screen.getByRole('menu').parentElement;
        expect(popover).toHaveAttribute('data-popper-placement', 'bottom-start');
    });

    it('forwards a custom menuAlignment', () => {
        renderSplitButton({ menuAlignment: 'bottom-end' });
        openMenu();
        const popover = screen.getByRole('menu').parentElement;
        expect(popover).toHaveAttribute('data-popper-placement', 'bottom-end');
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = renderSplitButton({ className: 'custom-split' });
        const root = container.querySelector('[data-oxobz-split-button]');
        expect(root?.className).toContain('custom-split');
        expect(root?.className.endsWith('custom-split')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root wrapper', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <SplitButton ref={ref} menuButtonLabel="Select save method">
                Save
            </SplitButton>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-split-button');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(SplitButton.displayName).toBe('SplitButton');
    });
});

describe('SplitButtonMenuItem', () => {
    it('renders the title and description text', () => {
        render(
            <SplitButton
                menuButtonLabel="Select save method"
                menuItems={<SplitButtonMenuItem description="Save changes" title="Save" />}
            >
                Save
            </SplitButton>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Select save method' }));
        const item = screen.getByRole('menuitem');
        expect(item).toHaveTextContent('Save');
        expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    it('renders without a description when omitted', () => {
        render(
            <SplitButton menuButtonLabel="Select save method" menuItems={<SplitButtonMenuItem title="Save" />}>
                Save
            </SplitButton>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Select save method' }));
        const item = screen.getByRole('menuitem');
        expect(item.querySelectorAll('span').length).toBeGreaterThan(0);
        expect(item.textContent).toBe('Save');
    });

    it('renders an optional icon as the item prefix', () => {
        render(
            <SplitButton
                menuButtonLabel="Select save method"
                menuItems={<SplitButtonMenuItem icon={<svg data-testid="item-icon" />} title="Save" />}
            >
                Save
            </SplitButton>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Select save method' }));
        expect(screen.getByTestId('item-icon')).toBeInTheDocument();
    });

    it('forwards ref to the underlying menu item', () => {
        const ref = createRef<HTMLLIElement>();
        render(
            <SplitButton
                menuButtonLabel="Select save method"
                menuItems={<SplitButtonMenuItem ref={ref} title="Save" />}
            >
                Save
            </SplitButton>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Select save method' }));
        expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });

    it('has the correct displayName', () => {
        expect(SplitButtonMenuItem.displayName).toBe('SplitButtonMenuItem');
    });
});
