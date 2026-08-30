import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { SearchInput } from './SearchInput';

/** Selects the root marker div. */
function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-search-input]');
}

describe('SearchInput', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-search-input and data-version="v1"', () => {
        const { container } = render(<SearchInput />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<SearchInput data-version="v2" />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders an Input wrapper with a type="search" field defaulting to aria-label="Search"', () => {
        const { container } = render(<SearchInput />);
        expect(
            container.querySelector('[data-oxobz-input-wrapper]'),
        ).toBeInTheDocument();
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('type', 'search');
        expect(input).toHaveAttribute('aria-label', 'Search');
    });

    it('allows overriding aria-label', () => {
        const { container } = render(<SearchInput aria-label="Find a repo" />);
        expect(container.querySelector('input')).toHaveAttribute(
            'aria-label',
            'Find a repo',
        );
    });

    it('forwards placeholder and value (Default docs example)', () => {
        const { container } = render(
            <SearchInput
                onChange={() => {}}
                placeholder="Enter some text..."
                value="hello"
            />,
        );
        const input = container.querySelector('input');
        expect(input).toHaveAttribute('placeholder', 'Enter some text...');
        expect(input).toHaveValue('hello');
    });

    // ── Default prefix (magnifying glass) ──

    it('renders a magnifying-glass icon prefix by default', () => {
        const { container } = render(<SearchInput />);
        const prefix = container.querySelector('[data-oxobz-input-prefix]');
        expect(prefix).toBeInTheDocument();
        expect(prefix?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders no suffix by default with an empty value', () => {
        const { container } = render(<SearchInput />);
        expect(
            container.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();
    });

    // ── Custom prefix icon ──

    it('renders a custom prefix node instead of the magnifying glass', () => {
        const { container } = render(
            <SearchInput prefix={<svg data-testid="custom-prefix" />} />,
        );
        expect(screen.getByTestId('custom-prefix')).toBeInTheDocument();
        const prefix = container.querySelector('[data-oxobz-input-prefix]');
        // only the custom svg, no default magnifying glass alongside it
        expect(prefix?.querySelectorAll('svg')).toHaveLength(1);
    });

    // ── Loading ──

    it('renders a spinner in the prefix while loading, taking priority over a custom prefix', () => {
        const { container } = render(
            <SearchInput
                loading
                prefix={<svg data-testid="custom-prefix" />}
                value="Project A"
            />,
        );
        expect(screen.queryByTestId('custom-prefix')).not.toBeInTheDocument();
        expect(
            container.querySelector('[data-glyph="circular"]'),
        ).toBeInTheDocument();
    });

    // ── Disabled ──

    it('disables the underlying input and hides the clear button', () => {
        const { container } = render(<SearchInput disabled value="hello" />);
        expect(container.querySelector('input')).toBeDisabled();
        expect(
            container.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();
    });

    // ── Automatic clear button ──

    // The clear button lives inside Input's `label[aria-hidden="true"]`
    // suffix wrapper — exactly like production (search-input.html) — so it
    // is (like production) excluded from the accessibility tree; queries
    // need `{ hidden: true }` to reach it, same as a screen reader would not.

    it('shows an Esc clear button once the (uncontrolled) field has a value', () => {
        const { container } = render(<SearchInput />);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(
            container.querySelector('[data-oxobz-input-suffix]'),
        ).not.toBeInTheDocument();
        fireEvent.change(input, { target: { value: 'hello' } });
        const clearButton = screen.getByRole('button', {
            hidden: true,
            name: 'Clear search',
        });
        expect(clearButton).toBeInTheDocument();
        expect(clearButton).toHaveTextContent('Esc');
    });

    it('clears the (uncontrolled) value and refocuses the input when the clear button is clicked', () => {
        const { container } = render(<SearchInput defaultValue="hello" />);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.value).toBe('hello');
        fireEvent.click(
            screen.getByRole('button', { hidden: true, name: 'Clear search' }),
        );
        expect(input.value).toBe('');
        expect(document.activeElement).toBe(input);
    });

    it('calls onChange when the clear button clears the value', () => {
        const onChange = vi.fn();
        render(<SearchInput defaultValue="hello" onChange={onChange} />);
        fireEvent.click(
            screen.getByRole('button', { hidden: true, name: 'Clear search' }),
        );
        expect(onChange).toHaveBeenCalled();
    });

    it('still clears on Escape (inherited from Input type="search")', () => {
        const { container } = render(<SearchInput defaultValue="hello" />);
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('');
    });

    // ── cmdk ──

    it('renders the cmdk hint instead of the clear button, even with a value', () => {
        const { container } = render(<SearchInput cmdk value="hello" />);
        const suffix = container.querySelector('[data-oxobz-input-suffix]');
        expect(suffix).toBeInTheDocument();
        expect(suffix).toHaveTextContent('K');
        expect(
            screen.queryByRole('button', { hidden: true, name: 'Clear search' }),
        ).not.toBeInTheDocument();
    });

    it('sets data-animate="false" by default and "true" while focused', () => {
        const { container } = render(<SearchInput cmdk />);
        const input = container.querySelector('input') as HTMLInputElement;
        const hint = container.querySelector(
            '[aria-label="Press Cmd + K to open the Command Menu"]',
        );
        expect(hint).toHaveAttribute('data-animate', 'false');
        fireEvent.focus(input);
        expect(hint).toHaveAttribute('data-animate', 'true');
        fireEvent.blur(input);
        expect(hint).toHaveAttribute('data-animate', 'false');
    });

    it('focuses the field on Cmd/Ctrl+K anywhere on the page when cmdk is set', () => {
        const { container } = render(<SearchInput cmdk />);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(document.activeElement).not.toBe(input);
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(document.activeElement).toBe(input);
    });

    it('does not react to Cmd/Ctrl+K when cmdk is not set', () => {
        const { container } = render(<SearchInput />);
        const input = container.querySelector('input') as HTMLInputElement;
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(document.activeElement).not.toBe(input);
    });

    // ── Custom className ──

    it('appends a custom className after the module class on the root', () => {
        const { container } = render(<SearchInput className="custom-search" />);
        const root = getRoot(container);
        expect(root?.className).toContain('root');
        expect(root?.className).toContain('custom-search');
        expect(root?.className.endsWith('custom-search')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the underlying input element', () => {
        const ref = createRef<HTMLInputElement>();
        render(<SearchInput ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(ref.current).toHaveAttribute('type', 'search');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(SearchInput.displayName).toBe('SearchInput');
    });
});
