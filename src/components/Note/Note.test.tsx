import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import {
    Note,
    NoteContent,
    NoteAction,
    NoteLabel,
    type NoteVariant,
} from './Note';

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-note]');
}

describe('Note', () => {
    // ── Rendering ──

    it('renders a root div with data-oxobz-note, data-slot="note", role="note" and data-version="v1"', () => {
        const { container } = render(
            <Note>
                <NoteContent>A default note.</NoteContent>
            </Note>,
        );
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-slot', 'note');
        expect(root).toHaveAttribute('role', 'note');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('note');
    });

    it('allows a custom data-version', () => {
        const { container } = render(
            <Note data-version="v2">
                <NoteContent>Content</NoteContent>
            </Note>,
        );
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders body > icon + content structure with production data-slots', () => {
        const { container } = render(
            <Note>
                <NoteContent>Body copy.</NoteContent>
            </Note>,
        );
        const body = container.querySelector('[data-slot="note-body"]');
        expect(body).toBeInTheDocument();
        const icon = body?.querySelector('[data-slot="note-icon"]');
        expect(icon).toBeInTheDocument();
        expect(icon?.querySelector('svg')).toBeInTheDocument();
        const content = body?.querySelector('[data-slot="note-content"]');
        expect(content).toBeInTheDocument();
        expect(content).toHaveTextContent('Body copy.');
    });

    it('applies the medium typography class by default and text-copy-13 when small', () => {
        const { container: m } = render(
            <Note>
                <NoteContent>Medium</NoteContent>
            </Note>,
        );
        expect(getRoot(m)?.className).toContain('text-copy-14');
        const { container: s } = render(
            <Note size="small">
                <NoteContent>Small</NoteContent>
            </Note>,
        );
        const root = getRoot(s);
        expect(root?.className).toContain('text-copy-13');
        expect(root?.className).toContain('small');
    });

    // ── Variants ──

    it.each([
        'secondary',
        'success',
        'error',
        'warning',
        'violet',
        'cyan',
    ] as NoteVariant[])('applies the %s variant class', (variant) => {
        const { container } = render(
            <Note variant={variant}>
                <NoteContent>Variant note</NoteContent>
            </Note>,
        );
        expect(getRoot(container)?.className).toContain(variant);
    });

    it('applies no variant class by default', () => {
        const { container } = render(
            <Note>
                <NoteContent>Default</NoteContent>
            </Note>,
        );
        const cls = getRoot(container)?.className ?? '';
        for (const v of ['secondary', 'success', 'error', 'warning', 'violet', 'cyan']) {
            expect(cls).not.toContain(v);
        }
    });

    it('applies the fill class when fill is set with a variant', () => {
        const { container } = render(
            <Note fill variant="warning">
                <NoteContent>Filled warning</NoteContent>
            </Note>,
        );
        const cls = getRoot(container)?.className ?? '';
        expect(cls).toContain('warning');
        expect(cls).toContain('fill');
    });

    // ── Disabled ──

    it('marks disabled notes with data-disabled="true" and the disabled class', () => {
        const { container } = render(
            <Note disabled fill variant="warning">
                <NoteContent>Disabled note</NoteContent>
            </Note>,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('data-disabled', 'true');
        expect(root?.className).toContain('disabled');
    });

    it('omits data-disabled when not disabled', () => {
        const { container } = render(
            <Note>
                <NoteContent>Enabled</NoteContent>
            </Note>,
        );
        expect(getRoot(container)).not.toHaveAttribute('data-disabled');
    });

    // ── Icon ──

    it('renders a custom icon in place of the variant default', () => {
        const { container } = render(
            <Note icon={<svg data-testid="custom-icon" />}>
                <NoteContent>Custom icon</NoteContent>
            </Note>,
        );
        const icon = container.querySelector('[data-slot="note-icon"]');
        expect(icon?.querySelector('[data-testid="custom-icon"]')).toBeInTheDocument();
    });

    it('renders no icon slot at all when icon={null}', () => {
        const { container } = render(
            <Note icon={null}>
                <NoteContent>No icon</NoteContent>
            </Note>,
        );
        expect(container.querySelector('[data-slot="note-icon"]')).toBeNull();
    });

    // ── NoteAction ──

    it('hoists NoteAction out of the body as a sibling with data-slot="note-action"', () => {
        const { container } = render(
            <Note>
                <NoteContent>With action</NoteContent>
                <NoteAction>
                    <button type="button">Upgrade</button>
                </NoteAction>
            </Note>,
        );
        const root = getRoot(container);
        const action = root?.querySelector('[data-slot="note-action"]');
        expect(action).toBeInTheDocument();
        // sibling of the body, not inside it
        expect(
            root?.querySelector('[data-slot="note-body"] [data-slot="note-action"]'),
        ).toBeNull();
        expect(root?.className).toContain('hasAction');
        expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
    });

    it('does not apply hasAction without a NoteAction child', () => {
        const { container } = render(
            <Note>
                <NoteContent>No action</NoteContent>
            </Note>,
        );
        expect(getRoot(container)?.className).not.toContain('hasAction');
    });

    // ── NoteLabel ──

    it('renders NoteLabel inside NoteContent with data-slot="note-label"', () => {
        const { container } = render(
            <Note>
                <NoteContent>
                    <NoteLabel>Region Change:</NoteLabel>Changing this region restarts
                    all functions.
                </NoteContent>
            </Note>,
        );
        const label = container.querySelector('[data-slot="note-label"]');
        expect(label).toBeInTheDocument();
        expect(label?.tagName).toBe('SPAN');
        expect(label).toHaveTextContent('Region Change:');
        expect(
            container.querySelector('[data-slot="note-content"] [data-slot="note-label"]'),
        ).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends custom classNames after the module classes (root + parts)', () => {
        const { container } = render(
            <Note className="custom-note">
                <NoteContent className="custom-content">Body</NoteContent>
                <NoteAction className="custom-action">
                    <button type="button">Go</button>
                </NoteAction>
            </Note>,
        );
        expect(getRoot(container)?.className.endsWith('custom-note')).toBe(true);
        expect(
            container.querySelector('[data-slot="note-content"]')?.className,
        ).toContain('custom-content');
        expect(
            container.querySelector('[data-slot="note-action"]')?.className,
        ).toContain('custom-action');
    });

    // ── Ref forwarding ──

    it('forwards refs on Note, NoteContent, NoteAction and NoteLabel', () => {
        const root = createRef<HTMLDivElement>();
        const content = createRef<HTMLDivElement>();
        const action = createRef<HTMLDivElement>();
        const label = createRef<HTMLSpanElement>();
        render(
            <Note ref={root}>
                <NoteContent ref={content}>
                    <NoteLabel ref={label}>Label:</NoteLabel>Body
                </NoteContent>
                <NoteAction ref={action}>
                    <button type="button">Go</button>
                </NoteAction>
            </Note>,
        );
        expect(root.current).toHaveAttribute('data-oxobz-note');
        expect(content.current).toHaveAttribute('data-slot', 'note-content');
        expect(action.current).toHaveAttribute('data-slot', 'note-action');
        expect(label.current).toHaveAttribute('data-slot', 'note-label');
    });

    // ── displayName + compound ──

    it('has the correct displayNames and compound parts', () => {
        expect(Note.displayName).toBe('Note');
        expect(Note.Content).toBe(NoteContent);
        expect(Note.Action).toBe(NoteAction);
        expect(Note.Label).toBe(NoteLabel);
        expect(NoteContent.displayName).toBe('NoteContent');
        expect(NoteAction.displayName).toBe('NoteAction');
        expect(NoteLabel.displayName).toBe('NoteLabel');
    });
});
