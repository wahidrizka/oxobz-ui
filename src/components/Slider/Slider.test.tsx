import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef, useState } from 'react';
import { Slider } from './Slider';

/** Convenience: the root element carries data-oxobz-slider. */
function getRoot(container: HTMLElement): HTMLElement {
    const root = container.querySelector('[data-oxobz-slider]');
    if (!root) throw new Error('slider root not found');
    return root as HTMLElement;
}

describe('Slider', () => {
    // ── Rendering ──

    it('renders a root with data-oxobz-slider and data-version="v1"', () => {
        const { container } = render(<Slider value={[50]} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root).toHaveAttribute('dir', 'ltr');
        expect(root).toHaveAttribute('data-orientation', 'horizontal');
        expect(root.className).toContain('root');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<Slider data-version="v2" value={[50]} />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders the outer + slider wrappers', () => {
        const { container } = render(<Slider value={[50]} />);
        expect(container.querySelector('.outerWrapper')).toBeInTheDocument();
        expect(container.querySelector('.sliderWrapper')).toBeInTheDocument();
    });

    it('renders track and range with the correct fill geometry', () => {
        const { container } = render(<Slider value={[50]} />);
        const track = container.querySelector('.track');
        const range = container.querySelector('.range') as HTMLElement;
        expect(track).toBeInTheDocument();
        expect(range).toBeInTheDocument();
        // single thumb → filled from the start
        expect(range.style.left).toBe('0%');
        expect(range.style.right).toBe('50%');
    });

    it('renders one thumb (role="slider") per value', () => {
        render(<Slider value={[25, 75]} />);
        expect(screen.getAllByRole('slider')).toHaveLength(2);
    });

    // ── ARIA ──

    it('exposes aria-valuemin / aria-valuemax / aria-valuenow', () => {
        render(<Slider max={200} min={10} value={[40]} />);
        const thumb = screen.getByRole('slider');
        expect(thumb).toHaveAttribute('aria-valuemin', '10');
        expect(thumb).toHaveAttribute('aria-valuemax', '200');
        expect(thumb).toHaveAttribute('aria-valuenow', '40');
        expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('labels the two thumbs of a range Minimum / Maximum', () => {
        render(<Slider value={[25, 75]} />);
        expect(screen.getByLabelText('Minimum')).toBeInTheDocument();
        expect(screen.getByLabelText('Maximum')).toBeInTheDocument();
    });

    it('leaves a single thumb unlabeled', () => {
        render(<Slider value={[50]} />);
        expect(screen.getByRole('slider')).not.toHaveAttribute('aria-label');
    });

    it('makes each thumb keyboard-focusable (tabindex 0)', () => {
        render(<Slider value={[50]} />);
        expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '0');
    });

    // ── Keyboard (uncontrolled) ──

    it('increments on ArrowRight / ArrowUp by step', () => {
        render(<Slider defaultValue={[50]} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb).toHaveAttribute('aria-valuenow', '51');
        fireEvent.keyDown(thumb, { key: 'ArrowUp' });
        expect(thumb).toHaveAttribute('aria-valuenow', '52');
    });

    it('decrements on ArrowLeft / ArrowDown by step', () => {
        render(<Slider defaultValue={[50]} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
        expect(thumb).toHaveAttribute('aria-valuenow', '49');
        fireEvent.keyDown(thumb, { key: 'ArrowDown' });
        expect(thumb).toHaveAttribute('aria-valuenow', '48');
    });

    it('honors a custom step', () => {
        render(<Slider defaultValue={[50]} step={10} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb).toHaveAttribute('aria-valuenow', '60');
    });

    it('jumps by 10 steps on PageUp / PageDown', () => {
        render(<Slider defaultValue={[50]} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'PageUp' });
        expect(thumb).toHaveAttribute('aria-valuenow', '60');
        fireEvent.keyDown(thumb, { key: 'PageDown' });
        expect(thumb).toHaveAttribute('aria-valuenow', '50');
    });

    it('goes to min / max on Home / End', () => {
        render(<Slider defaultValue={[50]} max={80} min={20} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'Home' });
        expect(thumb).toHaveAttribute('aria-valuenow', '20');
        fireEvent.keyDown(thumb, { key: 'End' });
        expect(thumb).toHaveAttribute('aria-valuenow', '80');
    });

    it('clamps at the maximum', () => {
        render(<Slider defaultValue={[100]} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb).toHaveAttribute('aria-valuenow', '100');
    });

    it('prevents thumbs from crossing (range)', () => {
        render(<Slider defaultValue={[40, 60]} />);
        const [, upper] = screen.getAllByRole('slider');
        // Home would send the upper thumb to min, but it is clamped to the
        // lower thumb value.
        fireEvent.keyDown(upper, { key: 'Home' });
        expect(upper).toHaveAttribute('aria-valuenow', '40');
    });

    it('preventDefault is called for handled keys', () => {
        render(<Slider defaultValue={[50]} />);
        const thumb = screen.getByRole('slider');
        // fireEvent returns false when the dispatched event was canceled
        // (preventDefault called), and wraps the update in act().
        const notCanceled = fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(notCanceled).toBe(false);
    });

    // ── onValueChange ──

    it('calls onValueChange with the next value array', () => {
        const onValueChange = vi.fn();
        render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith([51]);
    });

    // ── Controlled ──

    it('does not update itself when controlled without a state update', () => {
        const onValueChange = vi.fn();
        render(<Slider onValueChange={onValueChange} value={[50]} />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        // value prop is fixed → aria-valuenow stays 50
        expect(thumb).toHaveAttribute('aria-valuenow', '50');
        expect(onValueChange).toHaveBeenCalledWith([51]);
    });

    it('reflects a controlled value driven by parent state', () => {
        function Controlled() {
            const [val, setVal] = useState([50]);
            return <Slider onValueChange={setVal} value={val} />;
        }
        render(<Controlled />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb).toHaveAttribute('aria-valuenow', '51');
    });

    // ── Pointer (drag) ──

    it('moves the nearest thumb on pointer down', () => {
        const onValueChange = vi.fn();
        const { container } = render(
            <Slider defaultValue={[0]} onValueChange={onValueChange} />,
        );
        const root = getRoot(container);
        vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            right: 200,
            bottom: 8,
            width: 200,
            height: 8,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        } as DOMRect);
        fireEvent.pointerDown(root, { clientX: 100, pointerId: 1 });
        expect(onValueChange).toHaveBeenCalledWith([50]);
    });

    // ── Disabled ──

    it('marks the root aria-disabled and drops thumb tabindex when disabled', () => {
        const { container } = render(<Slider disabled value={[50]} />);
        const root = getRoot(container);
        expect(root).toHaveAttribute('aria-disabled', 'true');
        expect(root).toHaveAttribute('data-disabled');
        expect(screen.getByRole('slider')).not.toHaveAttribute('tabindex');
    });

    it('ignores keyboard interaction when disabled', () => {
        const onValueChange = vi.fn();
        render(
            <Slider defaultValue={[50]} disabled onValueChange={onValueChange} />,
        );
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByRole('slider')).toHaveAttribute(
            'aria-valuenow',
            '50',
        );
    });

    // ── fullWidth ──

    it('applies the fullWidth class only when requested', () => {
        const { container, rerender } = render(<Slider value={[50]} />);
        expect(getRoot(container).className).not.toContain('fullWidth');
        rerender(<Slider fullWidth value={[50]} />);
        expect(getRoot(container).className).toContain('fullWidth');
    });

    // ── Inputs ──

    it('renders numeric inputs for showStartInput / showEndInput', () => {
        const { container } = render(
            <Slider showEndInput showStartInput value={[25, 75]} />,
        );
        const inputs = container.querySelectorAll('input[data-oxobz-input]');
        expect(inputs).toHaveLength(2);
        expect((inputs[0] as HTMLInputElement).value).toBe('25');
        expect((inputs[1] as HTMLInputElement).value).toBe('75');
    });

    it('updates the first thumb from the start input', () => {
        const onValueChange = vi.fn();
        const { container } = render(
            <Slider
                defaultValue={[25, 75]}
                onValueChange={onValueChange}
                showStartInput
            />,
        );
        const input = container.querySelector(
            'input[data-oxobz-input]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { value: '30' } });
        expect(onValueChange).toHaveBeenCalledWith([30, 75]);
    });

    it('disables the numeric inputs when the slider is disabled', () => {
        const { container } = render(
            <Slider disabled showStartInput value={[25, 75]} />,
        );
        const input = container.querySelector(
            'input[data-oxobz-input]',
        ) as HTMLInputElement;
        expect(input).toBeDisabled();
    });

    // ── Hidden form values ──

    it('renders a hidden form-value input per thumb', () => {
        const { container } = render(
            <Slider name="volume" value={[25, 75]} />,
        );
        const hidden = container.querySelectorAll('input[name="volume"]');
        expect(hidden).toHaveLength(2);
        expect((hidden[0] as HTMLInputElement).value).toBe('25');
        expect((hidden[1] as HTMLInputElement).value).toBe('75');
    });

    // ── className / ref ──

    it('appends a custom className on the root', () => {
        const { container } = render(
            <Slider className="custom-slider" value={[50]} />,
        );
        const root = getRoot(container);
        expect(root.className).toContain('root');
        expect(root.className).toContain('custom-slider');
    });

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<Slider ref={ref} value={[50]} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-slider');
    });

    it('forwards extra HTML attributes to the root', () => {
        const { container } = render(
            <Slider id="bandwidth" value={[50]} />,
        );
        expect(getRoot(container)).toHaveAttribute('id', 'bandwidth');
    });

    it('has the correct displayName', () => {
        expect(Slider.displayName).toBe('Slider');
    });
});
