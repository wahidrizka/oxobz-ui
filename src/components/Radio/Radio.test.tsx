import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Radio } from './Radio';

describe('Radio', () => {
    // ── Rendering ──

    it('renders a radio input', () => {
        render(<Radio />);
        const input = screen.getByRole('radio');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'radio');
    });

    it('hides the input visually via oxobz-sr-only class', () => {
        const { container } = render(<Radio />);
        const input = container.querySelector('input');
        expect(input?.className).toContain('oxobz-sr-only');
        expect(input?.className).toContain('input');
    });

    it('wraps the input in a span with the check class', () => {
        const { container } = render(<Radio />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.tagName).toBe('SPAN');
        expect(wrapper.className).toContain('check');
    });

    it('renders the visual icon span with aria-hidden="true"', () => {
        const { container } = render(<Radio />);
        const icon = container.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
        expect(icon?.className).toContain('icon');
    });

    // ── Checked state ──

    it('respects defaultChecked prop', () => {
        render(<Radio defaultChecked />);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('respects checked prop', () => {
        render(<Radio checked onChange={() => { }} />);
        expect(screen.getByRole('radio')).toBeChecked();
    });

    it('fires onChange when clicked', () => {
        const onChange = vi.fn();
        render(<Radio onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    // ── Disabled state ──

    it('applies disabled attribute to the input', () => {
        render(<Radio disabled />);
        expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('applies disabled CSS class to the wrapper span', () => {
        const { container } = render(<Radio disabled />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('disabled');
    });

    it('does not apply disabled class when not disabled', () => {
        const { container } = render(<Radio />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).not.toContain('disabled');
    });

    // ── className ──

    it('merges custom className onto the wrapper span', () => {
        const { container } = render(<Radio className="my-radio" />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('my-radio');
        expect(wrapper.className).toContain('check');
    });

    // ── Ref forwarding ──

    it('forwards ref to the input element', () => {
        const ref = vi.fn();
        render(<Radio ref={ref} />);
        expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    // ── Prop forwarding ──

    it('forwards additional HTML input attributes', () => {
        render(<Radio name="plan" value="pro" />);
        const input = screen.getByRole('radio');
        expect(input).toHaveAttribute('name', 'plan');
        expect(input).toHaveAttribute('value', 'pro');
    });

    // ── Display name ──

    it('has displayName "Radio"', () => {
        expect(Radio.displayName).toBe('Radio');
    });
});
