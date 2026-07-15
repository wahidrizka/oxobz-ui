import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
    // ── Rendering ──

    it('renders the DOM structure label > div[data-oxobz-textarea-wrapper] > textarea', () => {
        const { container } = render(<Textarea aria-label="Default" />);
        const label = container.querySelector('label');
        expect(label).toBeInTheDocument();
        expect(label).toHaveAttribute('data-version', 'v1');
        const wrapper = label?.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper?.className).toContain('wrapper');
        const textarea = wrapper?.querySelector('textarea');
        expect(textarea).toBeInTheDocument();
        expect(textarea?.className).toContain('textarea');
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Textarea aria-label="Default" data-version="v2" />,
        );
        expect(container.querySelector('label')).toHaveAttribute(
            'data-version',
            'v2',
        );
    });

    it('applies production default attributes to the textarea', () => {
        render(<Textarea aria-label="Default" />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('autocapitalize', 'off');
        expect(textarea).toHaveAttribute('autocomplete', 'off');
        expect(textarea).toHaveAttribute('autocorrect', 'off');
        expect(textarea).toHaveAttribute('spellcheck', 'false');
    });

    it('generates an id with the textarea- prefix and accepts a custom id', () => {
        const { rerender } = render(<Textarea aria-label="Default" />);
        expect(screen.getByRole('textbox').id).toMatch(/^textarea-/);
        rerender(<Textarea aria-label="Default" id="my-notes" />);
        expect(screen.getByRole('textbox').id).toBe('my-notes');
    });

    it('forwards placeholder, aria-label and style (min-height docs example)', () => {
        render(
            <Textarea
                aria-label="Default"
                placeholder="Lorem ipsum"
                style={{ minHeight: 100 }}
            />,
        );
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', 'Lorem ipsum');
        expect(textarea).toHaveAttribute('aria-label', 'Default');
        expect(textarea).toHaveStyle({ minHeight: '100px' });
    });

    it('forwards rows (Rows docs example)', () => {
        render(<Textarea aria-label="Textarea with fixed rows" rows={5} />);
        expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    // ── Sizes ──

    it('applies no size class for the default (medium) size', () => {
        const { container } = render(<Textarea aria-label="Textarea" />);
        const wrapper = container.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper?.className).not.toContain('small');
        expect(wrapper?.className).not.toContain('large');
    });

    it('applies the small class on the wrapper', () => {
        const { container } = render(
            <Textarea aria-label="Textarea" size="small" />,
        );
        const wrapper = container.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper?.className).toContain('small');
    });

    it('applies the large class on the wrapper', () => {
        const { container } = render(
            <Textarea aria-label="Textarea" size="large" />,
        );
        const wrapper = container.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper?.className).toContain('large');
    });

    // ── Error state ──

    it('renders the error message with role="alert" and production attributes', () => {
        const { container } = render(
            <Textarea
                aria-label="With error"
                error="There has been an error."
                id="ta"
            />,
        );
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('There has been an error.');
        expect(alert).toHaveAttribute('aria-atomic', 'true');
        expect(alert).toHaveAttribute('data-oxobz-error', '');
        expect(alert).toHaveAttribute('data-version', 'v1');
        expect(alert.id).toBe('ta-error');
        // Error block is a sibling of the wrapper, inside the label
        expect(alert.parentElement).toBe(container.querySelector('label'));
    });

    it('marks the wrapper with the error class', () => {
        const { container } = render(
            <Textarea aria-label="With error" error="Oops." />,
        );
        const wrapper = container.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper?.className).toContain('error');
    });

    it('renders the stop icon inside the error message', () => {
        render(<Textarea aria-label="With error" error="Oops." />);
        const alert = screen.getByRole('alert');
        const icon = alert.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies the large error message class only for size="large"', () => {
        const { rerender } = render(
            <Textarea aria-label="With error" error="Oops." size="medium" />,
        );
        expect(screen.getByRole('alert').className).not.toContain(
            'errorMessageLarge',
        );
        rerender(
            <Textarea aria-label="With error" error="Oops." size="large" />,
        );
        expect(screen.getByRole('alert').className).toContain(
            'errorMessageLarge',
        );
    });

    it('renders no alert without an error', () => {
        const { container } = render(<Textarea aria-label="Default" />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        const wrapper = container.querySelector('[data-oxobz-textarea-wrapper]');
        expect(wrapper?.className).not.toContain('error');
    });

    it('treats an empty error string as no error', () => {
        render(<Textarea aria-label="Default" error="" />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // ── Disabled / read only ──

    it('supports disabled', () => {
        render(<Textarea aria-label="Disabled" disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('supports readOnly (Read Only docs example)', () => {
        render(
            <Textarea aria-label="Read only" defaultValue="Lorem" readOnly />,
        );
        expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    // ── Value handling ──

    it('supports defaultValue (uncontrolled)', () => {
        render(<Textarea aria-label="Textarea" defaultValue="Lorem ipsum" />);
        expect(screen.getByRole('textbox')).toHaveValue('Lorem ipsum');
    });

    it('supports controlled value + onChange', () => {
        const onChange = vi.fn();
        render(
            <Textarea aria-label="Textarea" onChange={onChange} value="a" />,
        );
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('a');
        fireEvent.change(textarea, { target: { value: 'ab' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Custom className ──

    it('appends custom className after the module class on the textarea', () => {
        render(<Textarea aria-label="Default" className="custom-textarea" />);
        const textarea = screen.getByRole('textbox');
        expect(textarea.className).toContain('textarea');
        expect(textarea.className).toContain('custom-textarea');
        expect(textarea.className.indexOf('custom-textarea')).toBeGreaterThan(
            textarea.className.indexOf('textarea'),
        );
    });

    // ── Ref forwarding ──

    it('forwards ref to the textarea element', () => {
        const ref = createRef<HTMLTextAreaElement>();
        render(<Textarea aria-label="Default" ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
        expect(ref.current?.tagName).toBe('TEXTAREA');
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Textarea.displayName).toBe('Textarea');
    });
});
