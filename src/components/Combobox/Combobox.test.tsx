import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxList, ComboboxOption } from './Combobox';

/** A default, fully-populated combobox used across several tests. */
function renderCombobox(
    props: Partial<React.ComponentProps<typeof Combobox>> = {},
    listProps: Partial<React.ComponentProps<typeof ComboboxList>> = {},
) {
    return render(
        <Combobox aria-label="Search" placeholder="Search..." {...props}>
            <ComboboxInput />
            <ComboboxList {...listProps}>
                <ComboboxOption value="a">One</ComboboxOption>
                <ComboboxOption value="b">Two</ComboboxOption>
                <ComboboxOption value="c">Three</ComboboxOption>
            </ComboboxList>
        </Combobox>,
    );
}

const input = () => screen.getByRole('searchbox') as HTMLInputElement;
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

describe('Combobox', () => {
    // ── Render ──

    it('renders the combobox wrapper and the searchbox input', () => {
        renderCombobox();
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('data-oxobz-combobox');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root).toHaveAttribute('aria-haspopup', 'listbox');
        expect(input()).toBeInTheDocument();
        expect(input()).toHaveAttribute('placeholder', 'Search...');
        expect(input()).toHaveAttribute('aria-label', 'Search');
    });

    // ── Open / close ──

    it('is closed by default (no listbox exposed)', () => {
        renderCombobox();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('opens on input focus', () => {
        renderCombobox();
        fireEvent.focus(input());
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('opens on open-menu button click and toggles closed again', () => {
        renderCombobox();
        openMenu();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        openMenu();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes on Escape', () => {
        renderCombobox();
        fireEvent.focus(input());
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(input(), { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes on outside click', () => {
        renderCombobox();
        fireEvent.focus(input());
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // ── Filter / search ──

    it('filters options by the typed query', () => {
        renderCombobox();
        fireEvent.focus(input());
        fireEvent.change(input(), { target: { value: 'Tw' } });
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Two');
    });

    it('shows the default empty message when nothing matches', () => {
        renderCombobox();
        fireEvent.focus(input());
        fireEvent.change(input(), { target: { value: 'zzz' } });
        expect(screen.queryAllByRole('option')).toHaveLength(0);
        expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('renders a custom empty message when there are no options', () => {
        render(
            <Combobox aria-label="Search" placeholder="Search...">
                <ComboboxInput />
                <ComboboxList emptyMessage="Nothing to see here..." />
            </Combobox>,
        );
        expect(screen.getByText('Nothing to see here...')).toBeInTheDocument();
    });

    // ── Selection ──

    it('selects an option on click, shows its label and closes', () => {
        const onChange = vi.fn();
        renderCombobox({ onChange });
        fireEvent.focus(input());
        fireEvent.click(screen.getByRole('option', { name: 'Two' }));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(input().value).toBe('Two');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects the highlighted option with ArrowDown + Enter', () => {
        const onChange = vi.fn();
        renderCombobox({ onChange });
        fireEvent.focus(input());
        fireEvent.keyDown(input(), { key: 'ArrowDown' }); // highlight "One"
        fireEvent.keyDown(input(), { key: 'ArrowDown' }); // highlight "Two"
        fireEvent.keyDown(input(), { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('b');
        expect(input().value).toBe('Two');
    });

    // ── ARIA wiring ──

    it('wires aria-controls / activedescendant / aria-selected', () => {
        renderCombobox();
        const root = screen.getByRole('combobox');
        const listId = root.getAttribute('aria-controls');
        expect(listId).toBeTruthy();
        expect(input()).toHaveAttribute('aria-controls', listId as string);
        expect(input()).toHaveAttribute('aria-autocomplete', 'list');

        fireEvent.focus(input());
        expect(screen.getByRole('listbox')).toHaveAttribute('id', listId as string);

        fireEvent.keyDown(input(), { key: 'ArrowDown' });
        const active = screen.getByRole('option', { name: 'One' });
        expect(active).toHaveAttribute('aria-selected', 'true');
        expect(active).toHaveAttribute('data-highlighted', 'true');
        expect(input()).toHaveAttribute('aria-activedescendant', active.id);
    });

    // ── Controlled ──

    it('displays the label for a controlled value', () => {
        renderCombobox({ value: 'b' });
        expect(input().value).toBe('Two');
    });

    it('supports a controlled value updated from onChange', () => {
        function Controlled() {
            const [value, setValue] = useState<string | null>(null);
            return (
                <Combobox aria-label="Search" placeholder="Search..." onChange={setValue} value={value}>
                    <ComboboxInput />
                    <ComboboxList>
                        <ComboboxOption value="a">One</ComboboxOption>
                        <ComboboxOption value="b">Two</ComboboxOption>
                    </ComboboxList>
                </Combobox>
            );
        }
        render(<Controlled />);
        fireEvent.focus(input());
        fireEvent.click(screen.getByRole('option', { name: 'Two' }));
        expect(input().value).toBe('Two');
    });

    // ── Disabled ──

    it('renders a disabled input when disabled', () => {
        renderCombobox({ disabled: true });
        expect(input()).toBeDisabled();
    });

    // ── Errored ──

    it('marks the input invalid when errored', () => {
        renderCombobox({ errored: true });
        expect(input()).toHaveAttribute('aria-invalid', 'true');
        expect(input().className).toContain('errored');
    });

    // ── Clearable ──

    it('hides the clear button unless clearable and a value is set', () => {
        renderCombobox({ value: 'b' });
        expect(screen.queryByRole('button', { name: 'Clear selected value' })).not.toBeInTheDocument();
    });

    it('shows and fires the clear button when clearable with a value', () => {
        const onChange = vi.fn();
        renderCombobox({ value: 'b', clearable: true, onChange });
        const clear = screen.getByRole('button', { name: 'Clear selected value' });
        expect(clear).toBeInTheDocument();
        fireEvent.click(clear);
        expect(onChange).toHaveBeenCalledWith(null);
    });

    // ── Option decorations ──

    it('renders option prefix and suffix slots', () => {
        render(
            <Combobox aria-label="Search" placeholder="Search...">
                <ComboboxInput />
                <ComboboxList>
                    <ComboboxOption value="a" prefix={<span>P</span>} suffix={<span>S</span>}>
                        One
                    </ComboboxOption>
                </ComboboxList>
            </Combobox>,
        );
        fireEvent.focus(input());
        const option = screen.getByRole('option', { name: /One/ });
        expect(option.querySelector('[data-oxobz-combobox-option-prefix]')).not.toBeNull();
        expect(option.querySelector('[data-oxobz-combobox-option-suffix]')).not.toBeNull();
    });

    // ── className / ref ──

    it('merges a custom className on the root', () => {
        renderCombobox({ className: 'my-combobox' });
        const root = screen.getByRole('combobox');
        expect(root.className).toContain('my-combobox');
        expect(root.className).toContain('root');
    });

    it('forwards the ref to the root element', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Combobox aria-label="Search" ref={ref}>
                <ComboboxInput />
                <ComboboxList>
                    <ComboboxOption value="a">One</ComboboxOption>
                </ComboboxList>
            </Combobox>,
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('role', 'combobox');
    });

    // ── Compound API ──

    it('exposes sub-components as compound members', () => {
        expect(Combobox.Input).toBe(ComboboxInput);
        expect(Combobox.List).toBe(ComboboxList);
        expect(Combobox.Option).toBe(ComboboxOption);
    });
});
