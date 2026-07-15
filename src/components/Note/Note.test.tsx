import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { Note, type NoteType } from './Note';

describe('Note', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-note and data-version="v1"', () => {
        const { container } = render(<Note>A default note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('note');
    });

    it('allows custom data-version', () => {
        const { container } = render(
            <Note data-version="v2">A note.</Note>,
        );
        const root = container.querySelector('[data-oxobz-note]');
        expect(root).toHaveAttribute('data-version', 'v2');
    });

    it('renders children inside a span within the content div', () => {
        const { container } = render(<Note>A default note.</Note>);
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content?.className).toContain('content');
        const text = screen.getByText('A default note.');
        expect(text.tagName).toBe('SPAN');
        expect(content).toContainElement(text);
    });

    // ── Default label (icon) ──

    it('renders the default info icon inside an iconContainer span', () => {
        const { container } = render(<Note>A default note.</Note>);
        const iconWrapper = container.querySelector('span[class*="iconContainer"]');
        expect(iconWrapper).toBeInTheDocument();
        const svg = iconWrapper?.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Information icon renders with currentcolor (snapshot parity)
        expect(svg?.getAttribute('style')).toContain('color: currentcolor');
    });

    it('renders the success icon in blue (var(--ds-blue-900))', () => {
        const { container } = render(<Note type="success">Ok.</Note>);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('style')).toContain('var(--ds-blue-900)');
    });

    it('renders the error icon in red (var(--ds-red-900))', () => {
        const { container } = render(<Note type="error">Bad.</Note>);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('style')).toContain('var(--ds-red-900)');
    });

    it('renders the warning icon in amber (var(--ds-amber-900))', () => {
        const { container } = render(<Note type="warning">Careful.</Note>);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('style')).toContain('var(--ds-amber-900)');
    });

    it('renders the info icon with currentcolor for non-status types', () => {
        const { container } = render(<Note type="secondary">Meh.</Note>);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('style')).toContain('color: currentcolor');
    });

    // ── Sizes ──

    it('applies no size class for the default (medium) size', () => {
        const { container } = render(<Note>A note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).not.toContain('small');
        expect(root?.className).not.toContain('large');
    });

    it('applies no size class when size="medium" is explicit', () => {
        const { container } = render(<Note size="medium">A note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).not.toContain('small');
        expect(root?.className).not.toContain('large');
    });

    it('applies the small class', () => {
        const { container } = render(<Note size="small">A small note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('small');
    });

    it('applies the large class', () => {
        const { container } = render(<Note size="large">A large note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('large');
    });

    // ── Content gap (inline style, snapshot parity) ──

    it('uses a 12px content gap for medium and large', () => {
        const { container } = render(<Note>A note.</Note>);
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content).toHaveStyle({ gap: '12px' });
    });

    it('uses an 8px content gap for small', () => {
        const { container } = render(<Note size="small">A note.</Note>);
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content).toHaveStyle({ gap: '8px' });
    });

    it('uses a 4px content gap in custom-label mode', () => {
        const { container } = render(<Note label="Region">A note.</Note>);
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content).toHaveStyle({ gap: '4px' });
    });

    // ── Types ──

    const allTypes: NoteType[] = [
        'default',
        'secondary',
        'tertiary',
        'success',
        'error',
        'warning',
        'alert',
        'lite',
        'ghost',
        'violet',
        'cyan',
        'rotate-ccw',
    ];

    it.each(allTypes)('applies the %s type class', (type) => {
        const { container } = render(<Note type={type}>Typed.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain(type);
    });

    it('applies no type class when type is omitted', () => {
        const { container } = render(<Note>A note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        allTypes.forEach((type) => {
            expect(root?.className).not.toContain(type);
        });
    });

    // ── Fill ──

    it('applies the fill class when fill is combined with a type', () => {
        const { container } = render(
            <Note fill type="success">
                Filled.
            </Note>,
        );
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('success');
        expect(root?.className).toContain('fill');
    });

    it('ignores fill without a type (production parity)', () => {
        const { container } = render(<Note fill>Filled?</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).not.toContain('fill');
    });

    // ── Action slot ──

    it('renders the action node in a trailing div and adds the action class', () => {
        const { container } = render(
            <Note action={<button type="button">Upgrade</button>}>
                A note with action.
            </Note>,
        );
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('action');
        const actionWrapper = root?.lastElementChild;
        expect(actionWrapper?.tagName).toBe('DIV');
        expect(actionWrapper).toContainElement(
            screen.getByRole('button', { name: 'Upgrade' }),
        );
    });

    it('adds no action class without an action', () => {
        const { container } = render(<Note>A note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).not.toContain('action');
        // only the content div is rendered
        expect(root?.children).toHaveLength(1);
    });

    // ── Disabled ──

    it('applies the disabled class', () => {
        const { container } = render(<Note disabled>Disabled note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('disabled');
    });

    it('is not disabled by default', () => {
        const { container } = render(<Note>A note.</Note>);
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).not.toContain('disabled');
    });

    // ── Label ──

    it('renders a bold "label: " prefix instead of the icon for a custom label', () => {
        const { container } = render(
            <Note label="Region Change" type="warning">
                Changing this region restarts all functions.
            </Note>,
        );
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content?.className).toContain('hasLabel');
        const labelSpan = container.querySelector('span[class*="label"]');
        expect(labelSpan?.textContent).toBe('Region Change: ');
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders neither icon nor label prefix when label={false}', () => {
        const { container } = render(
            <Note label={false} type="warning">
                No label here.
            </Note>,
        );
        expect(container.querySelector('svg')).not.toBeInTheDocument();
        const content = container.querySelector('[data-oxobz-note] > div');
        expect(content?.className).not.toContain('hasLabel');
        expect(content?.children).toHaveLength(1);
        expect(content?.textContent).toBe('No label here.');
    });

    // ── Custom className ──

    it('appends custom className after the module classes', () => {
        const { container } = render(
            <Note className="custom-note">A note.</Note>,
        );
        const root = container.querySelector('[data-oxobz-note]');
        expect(root?.className).toContain('note');
        expect(root?.className).toContain('custom-note');
        expect(root?.className.endsWith('custom-note')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Note ref={ref}>A note.</Note>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-note');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes and inline style', () => {
        const { container } = render(
            <Note id="note-1" style={{ maxWidth: '400px' }}>
                A note.
            </Note>,
        );
        const root = container.querySelector('[data-oxobz-note]');
        expect(root).toHaveAttribute('id', 'note-1');
        expect(root).toHaveStyle({ maxWidth: '400px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(Note.displayName).toBe('Note');
    });
});
