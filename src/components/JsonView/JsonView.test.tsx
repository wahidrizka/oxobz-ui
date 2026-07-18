import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { JsonView, makeJsonViewHighlightPattern, type JsonValue } from './JsonView';

const sampleData: JsonValue = {
    deployment: { id: 'dpl_1', state: 'ready' },
    request: {
        method: 'GET',
        path: '/api/search',
        status: 200,
        durationMs: 42,
    },
    cached: false,
    error: null,
};

function getRoot(container: HTMLElement) {
    return container.querySelector('[data-oxobz-json-view]');
}

describe('JsonView', () => {
    // ── Rendering ──

    it('renders a root span with data-oxobz-json-view and data-version="v1"', () => {
        const { container } = render(<JsonView data={sampleData} />);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('SPAN');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('wrapper');
    });

    it('allows a custom data-version', () => {
        const { container } = render(<JsonView data-version="v2" data={sampleData} />);
        expect(getRoot(container)).toHaveAttribute('data-version', 'v2');
    });

    it('renders a role="tree" with aria-label="JSON"', () => {
        const { container } = render(<JsonView data={sampleData} />);
        const tree = container.querySelector('[role="tree"]');
        expect(tree).toBeInTheDocument();
        expect(tree).toHaveAttribute('aria-label', 'JSON');
    });

    it('renders the root treeitem as a JSON object with aria-level 1', () => {
        const { container } = render(<JsonView data={sampleData} />);
        const root = container.querySelector('[role="treeitem"]');
        expect(root).toHaveAttribute('aria-label', 'JSON object');
        expect(root).toHaveAttribute('aria-level', '1');
        expect(root).toHaveAttribute('data-json-tree-label', 'JSON object');
    });

    // ── defaultExpandDepth ──

    it('defaultExpandDepth={1} expands the root but collapses its children by default', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={1} />);
        const root = container.querySelector('[role="treeitem"]');
        expect(root).toHaveAttribute('aria-expanded', 'true');

        const deployment = container.querySelector('[data-json-tree-label="deployment: object"]');
        expect(deployment).toHaveAttribute('aria-expanded', 'false');
        expect(deployment?.textContent).toContain('…');
    });

    it('defaultExpandDepth={0} starts the root collapsed', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={0} />);
        const root = container.querySelector('[role="treeitem"]');
        expect(root).toHaveAttribute('aria-expanded', 'false');
        expect(root?.textContent).toContain('…');
        // Nothing else should be rendered while the root is collapsed.
        expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(1);
    });

    it('reveals nested primitive leaves when expanded', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        const method = container.querySelector('[data-json-tree-label="method: GET"]');
        expect(method).toBeInTheDocument();
        expect(method).not.toHaveAttribute('aria-expanded');
    });

    // ── Trailing commas / punctuation ──

    it('adds a trailing comma to every sibling except the last', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        const cached = container.querySelector('[data-json-tree-label="cached: false"]');
        const error = container.querySelector('[data-json-tree-label="error: null"]');
        expect(cached?.textContent?.endsWith(',')).toBe(true);
        expect(error?.textContent?.endsWith(',')).toBe(false);
    });

    // ── Value formatting / colors ──

    it('quotes strings visually but not in aria-label', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        const method = container.querySelector('[data-json-tree-label="method: GET"]');
        expect(method).toHaveAttribute('aria-label', 'method: GET');
        expect(method?.querySelector('span[class*="valueString"]')?.textContent).toBe('"GET"');
    });

    it('renders numbers, booleans, and null with their respective classes', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        expect(
            container.querySelector('[data-json-tree-label="status: 200"] span[class*="valueNumber"]'),
        ).toHaveTextContent('200');
        expect(
            container.querySelector('[data-json-tree-label="cached: false"] span[class*="valueBoolean"]'),
        ).toHaveTextContent('false');
        expect(
            container.querySelector('[data-json-tree-label="error: null"] span[class*="valueNull"]'),
        ).toHaveTextContent('null');
    });

    // ── Arrays ──

    it('renders array items with index-based paths and bracket punctuation', () => {
        const { container } = render(
            <JsonView data={{ flags: ['a', 'b'] }} defaultExpandDepth={2} />,
        );
        const flags = container.querySelector('[data-json-tree-label="flags: array"]');
        expect(flags).toHaveAttribute('aria-expanded', 'true');
        const first = container.querySelector('[data-json-tree-label="0: a"]');
        expect(first).toBeInTheDocument();
        expect(first?.querySelector('span[class*="valueString"]')?.textContent).toBe('"a"');
    });

    // ── Toggle interaction ──

    it('expands a collapsed node on click of its toggle', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={1} />);
        const toggle = container.querySelector('[data-json-tree-label="deployment: object"] [data-json-node-toggle]');
        expect(toggle).toBeInTheDocument();
        fireEvent.click(toggle as Element);
        const deployment = container.querySelector('[data-json-tree-label="deployment: object"]');
        expect(deployment).toHaveAttribute('aria-expanded', 'true');
        expect(container.querySelector('[data-json-tree-label="id: dpl_1"]')).toBeInTheDocument();
    });

    it('collapses an expanded node on click of its toggle', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        const toggle = container.querySelector('[data-json-tree-label="deployment: object"] [data-json-node-toggle]');
        fireEvent.click(toggle as Element);
        const deployment = container.querySelector('[data-json-tree-label="deployment: object"]');
        expect(deployment).toHaveAttribute('aria-expanded', 'false');
        expect(container.querySelector('[data-json-tree-label="id: dpl_1"]')).not.toBeInTheDocument();
    });

    // ── Keyboard navigation ──

    it('moves the roving tabindex to the next visible node on ArrowDown', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={1} />);
        const tree = container.querySelector('[role="tree"]') as HTMLElement;
        const root = container.querySelector('[role="treeitem"]') as HTMLElement;
        expect(root).toHaveAttribute('tabindex', '0');

        fireEvent.keyDown(tree, { key: 'ArrowDown' });
        const deployment = container.querySelector('[data-json-tree-label="deployment: object"]');
        expect(deployment).toHaveAttribute('tabindex', '0');
        expect(root).toHaveAttribute('tabindex', '-1');
    });

    it('toggles the focused node on Enter', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={1} />);
        const tree = container.querySelector('[role="tree"]') as HTMLElement;
        fireEvent.keyDown(tree, { key: 'Enter' });
        const root = container.querySelector('[role="treeitem"]');
        expect(root).toHaveAttribute('aria-expanded', 'false');
    });

    it('jumps to the last visible node on End', () => {
        const { container } = render(<JsonView data={sampleData} defaultExpandDepth={2} />);
        const tree = container.querySelector('[role="tree"]') as HTMLElement;
        fireEvent.keyDown(tree, { key: 'End' });
        const errorNode = container.querySelector('[data-json-tree-label="error: null"]');
        expect(errorNode).toHaveAttribute('tabindex', '0');
    });

    // ── highlightPattern / makeJsonViewHighlightPattern ──

    it('highlights matching substrings in keys and string values', () => {
        const pattern = makeJsonViewHighlightPattern(['request', 'failed']);
        const { container } = render(
            <JsonView
                data={{ requestId: 'req_1', message: 'Deployment request failed' }}
                defaultExpandDepth={1}
                highlightPattern={pattern}
            />,
        );
        const marks = container.querySelectorAll('mark[class*="mark"]');
        expect(marks.length).toBeGreaterThanOrEqual(2);
        expect(Array.from(marks).some((m) => m.textContent === 'request')).toBe(true);
        expect(Array.from(marks).some((m) => m.textContent === 'failed')).toBe(true);
    });

    it('makeJsonViewHighlightPattern never matches when given no usable terms', () => {
        const pattern = makeJsonViewHighlightPattern(['', '   ']);
        expect('anything'.match(pattern)).toBeNull();
    });

    it('renders no marks when highlightPattern is null', () => {
        const { container } = render(<JsonView data={sampleData} highlightPattern={null} />);
        expect(container.querySelectorAll('mark')).toHaveLength(0);
    });

    // ── Custom className ──

    it('appends a custom className after the module class', () => {
        const { container } = render(<JsonView className="custom-json" data={sampleData} />);
        const root = getRoot(container);
        expect(root?.className).toContain('wrapper');
        expect(root?.className).toContain('custom-json');
        expect(root?.className.endsWith('custom-json')).toBe(true);
    });

    // ── Ref forwarding ──

    it('forwards ref to the root span', () => {
        const ref = createRef<HTMLSpanElement>();
        render(<JsonView data={sampleData} ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        expect(ref.current).toHaveAttribute('data-oxobz-json-view');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes (id, aria-hidden, style)', () => {
        const { container } = render(
            <JsonView aria-hidden="true" data={sampleData} id="json-1" style={{ marginTop: '4px' }} />,
        );
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'json-1');
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveStyle({ marginTop: '4px' });
    });

    // ── displayName ──

    it('has the correct displayName', () => {
        expect(JsonView.displayName).toBe('JsonView');
    });
});
