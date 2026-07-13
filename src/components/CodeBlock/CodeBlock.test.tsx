import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createRef } from 'react';
import { CodeBlock, type SwitcherOption } from './CodeBlock';

const MULTILINE_CODE = 'const a = 1;\nconst b = 2;\nconst c = 3;';

const SWITCHER_OPTIONS: SwitcherOption[] = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
];

/* navigator.clipboard does not exist in jsdom — define a mock once */
const writeTextMock = vi.fn(() => Promise.resolve());

beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
    });
});

beforeEach(() => {
    writeTextMock.mockClear();
});

/** Root wrapper has data-oxobz-code-block="" (the inner <code> has "true") */
const getRoot = (container: HTMLElement) =>
    container.querySelector('div[data-oxobz-code-block=""]');

/** Every rendered code line carries data-oxobz-code-block-line="true" */
const getLines = (container: HTMLElement) =>
    container.querySelectorAll('[data-oxobz-code-block-line="true"]');

describe('CodeBlock', () => {
    // ── Basic rendering ──

    it('renders the code string inside a <pre>', () => {
        const { container } = render(<CodeBlock>{'hello world'}</CodeBlock>);
        const pre = container.querySelector('pre');
        expect(pre).toBeInTheDocument();
        expect(pre?.textContent).toContain('hello world');
    });

    it('root wrapper has data-oxobz-code-block="" and wrapper/relative classes', () => {
        const { container } = render(<CodeBlock>{'x'}</CodeBlock>);
        const root = getRoot(container);
        expect(root).toBeInTheDocument();
        expect(root?.className).toContain('relative');
        expect(root?.className).toContain('wrapper');
    });

    it('renders <code> with code class and data-oxobz-code-block="true"', () => {
        const { container } = render(<CodeBlock>{'x'}</CodeBlock>);
        const code = container.querySelector('code');
        expect(code?.className).toContain('code');
        expect(code).toHaveAttribute('data-oxobz-code-block', 'true');
    });

    it('each line div has class "line" and the line data attribute', () => {
        const { container } = render(<CodeBlock>{MULTILINE_CODE}</CodeBlock>);
        const lines = getLines(container);
        expect(lines).toHaveLength(3);
        lines.forEach((line) => {
            expect(line.className).toBe('line');
        });
    });

    it('strips a single trailing newline before tokenizing (no empty extra line)', () => {
        const { container } = render(<CodeBlock>{'line1\nline2\n'}</CodeBlock>);
        expect(getLines(container)).toHaveLength(2);
    });

    // ── language prop ──

    it('defaults to jsx language on the <pre> class', () => {
        const { container } = render(<CodeBlock>{'const a = 1;'}</CodeBlock>);
        const pre = container.querySelector('pre');
        expect(pre?.className).toContain('prism-code');
        expect(pre?.className).toContain('language-jsx');
        expect(pre?.className).toContain('pre');
    });

    it('applies the given language to the <pre> class', () => {
        const { container } = render(
            <CodeBlock language="tsx">{'const a = 1;'}</CodeBlock>,
        );
        expect(container.querySelector('pre')?.className).toContain('language-tsx');
    });

    it('tokenizes code — keyword tokens get the prism token class', () => {
        const { container } = render(<CodeBlock>{'const a = 1;'}</CodeBlock>);
        const keyword = container.querySelector('.token.keyword');
        expect(keyword).toBeInTheDocument();
        expect(keyword?.textContent).toBe('const');
    });

    it('supports extra prismjs languages registered via prism-setup (bash)', () => {
        const { container } = render(
            <CodeBlock language="bash">{'echo "hello world"'}</CodeBlock>,
        );
        expect(container.querySelector('pre')?.className).toContain('language-bash');
        // If bash were not registered, everything would tokenize as plain text
        expect(container.querySelector('.token.string')).toBeInTheDocument();
    });

    // ── filename header ──

    it('renders header with filename text and hasFileName class on root', () => {
        const { container } = render(
            <CodeBlock filename="Table.jsx">{'x'}</CodeBlock>,
        );
        expect(getRoot(container)?.className).toContain('hasFileName');
        expect(container.querySelector('.header')).toBeInTheDocument();
        const filenameSpan = screen.getByText('Table.jsx');
        expect(filenameSpan.className).toContain('filenameP');
    });

    it('does not render header without filename', () => {
        const { container } = render(<CodeBlock>{'x'}</CodeBlock>);
        expect(container.querySelector('.header')).toBeNull();
        expect(getRoot(container)?.className).not.toContain('hasFileName');
    });

    it('renders filenameIcon inside an aria-hidden iconWrapper', () => {
        const { container } = render(
            <CodeBlock
                filename="index.ts"
                filenameIcon={<svg data-testid="file-icon" />}
            >
                {'x'}
            </CodeBlock>,
        );
        const icon = screen.getByTestId('file-icon');
        const iconWrapper = icon.parentElement;
        expect(iconWrapper?.className).toContain('iconWrapper');
        expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('.header')).toContainElement(icon);
    });

    it('does not render iconWrapper when filenameIcon is absent', () => {
        const { container } = render(
            <CodeBlock filename="index.ts">{'x'}</CodeBlock>,
        );
        expect(container.querySelector('.iconWrapper')).toBeNull();
    });

    // ── Line numbers ──

    it('renders a line-number button per line by default', () => {
        const { container } = render(<CodeBlock>{MULTILINE_CODE}</CodeBlock>);
        const lineNumbers = container.querySelectorAll('.lineNumber');
        expect(lineNumbers).toHaveLength(3);
        expect(Array.from(lineNumbers).map((b) => b.textContent)).toEqual([
            '1',
            '2',
            '3',
        ]);
        expect(getRoot(container)?.className).not.toContain('hideLineNumbers');
    });

    it('line-number buttons are aria-hidden, unfocusable, type button', () => {
        const { container } = render(<CodeBlock>{'x'}</CodeBlock>);
        const button = container.querySelector('.lineNumber');
        expect(button).toHaveAttribute('aria-hidden', 'true');
        expect(button).toHaveAttribute('tabindex', '-1');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute(
            'aria-label',
            'Add line anchor to the URL',
        );
    });

    it('showLineNumbers={false} adds hideLineNumbers class (buttons stay in DOM, hidden via CSS)', () => {
        const { container } = render(
            <CodeBlock showLineNumbers={false}>{MULTILINE_CODE}</CodeBlock>,
        );
        expect(getRoot(container)?.className).toContain('hideLineNumbers');
        expect(container.querySelectorAll('.lineNumber')).toHaveLength(3);
    });

    // ── Highlighted / added / removed lines ──

    it('marks highlightedLinesNumbers with data-highlighted="true"', () => {
        const { container } = render(
            <CodeBlock highlightedLinesNumbers={[2]}>{MULTILINE_CODE}</CodeBlock>,
        );
        const lines = getLines(container);
        expect(lines[0]).not.toHaveAttribute('data-highlighted');
        expect(lines[1]).toHaveAttribute('data-highlighted', 'true');
        expect(lines[2]).not.toHaveAttribute('data-highlighted');
    });

    it('marks addedLinesNumbers with data-added="true"', () => {
        const { container } = render(
            <CodeBlock addedLinesNumbers={[1, 3]}>{MULTILINE_CODE}</CodeBlock>,
        );
        const lines = getLines(container);
        expect(lines[0]).toHaveAttribute('data-added', 'true');
        expect(lines[1]).not.toHaveAttribute('data-added');
        expect(lines[2]).toHaveAttribute('data-added', 'true');
    });

    it('marks removedLinesNumbers with data-removed="true"', () => {
        const { container } = render(
            <CodeBlock removedLinesNumbers={[2]}>{MULTILINE_CODE}</CodeBlock>,
        );
        const lines = getLines(container);
        expect(lines[0]).not.toHaveAttribute('data-removed');
        expect(lines[1]).toHaveAttribute('data-removed', 'true');
        expect(lines[2]).not.toHaveAttribute('data-removed');
    });

    // ── Copy button ──

    it('renders a floating copy button when there is no filename', () => {
        render(<CodeBlock>{'x'}</CodeBlock>);
        const button = screen.getByRole('button', { name: 'Copy code' });
        expect(button.className).toContain('copyButton');
        expect(button.className).toContain('copyFloatingButton');
    });

    it('renders a non-floating copy button inside the header when filename is set', () => {
        const { container } = render(
            <CodeBlock filename="app.tsx">{'x'}</CodeBlock>,
        );
        const button = screen.getByRole('button', { name: 'Copy code' });
        expect(button.className).toContain('copyButton');
        expect(button.className).not.toContain('copyFloatingButton');
        expect(container.querySelector('.header')).toContainElement(button);
    });

    it('clicking copy writes the code to the clipboard', async () => {
        render(<CodeBlock filename="a.ts">{MULTILINE_CODE}</CodeBlock>);
        // async act flushes the clipboard promise so the copied-state update
        // does not fire outside act()
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
        });
        expect(writeTextMock).toHaveBeenCalledTimes(1);
        expect(writeTextMock).toHaveBeenCalledWith(MULTILINE_CODE);
    });

    it('copies the raw children string including trailing newline', async () => {
        render(<CodeBlock>{'line1\nline2\n'}</CodeBlock>);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
        });
        expect(writeTextMock).toHaveBeenCalledWith('line1\nline2\n');
    });

    it('applies copyButtonCopied class after a successful copy', async () => {
        render(<CodeBlock>{'x'}</CodeBlock>);
        const button = screen.getByRole('button', { name: 'Copy code' });
        await act(async () => {
            fireEvent.click(button);
        });
        expect(button.className).toContain('copyButtonCopied');
    });

    // ── Switcher ──

    it('renders switcher with the selected option label visible', () => {
        const { container } = render(
            <CodeBlock
                filename="index.js"
                switcherOptions={SWITCHER_OPTIONS}
                switcherValue="js"
                onSwitcherChange={() => { }}
            >
                {'x'}
            </CodeBlock>,
        );
        const visible = container.querySelector('.visible');
        expect(visible).toHaveAttribute('aria-hidden', 'true');
        expect(visible?.textContent).toContain('JavaScript');
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('js');
        expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('falls back to the raw value as label when value is not in options', () => {
        const { container } = render(
            <CodeBlock
                filename="index.go"
                switcherOptions={SWITCHER_OPTIONS}
                switcherValue="go"
                onSwitcherChange={() => { }}
            >
                {'x'}
            </CodeBlock>,
        );
        expect(container.querySelector('.visible')?.textContent).toContain('go');
    });

    it('calls onSwitcherChange with the picked option value', () => {
        const onSwitcherChange = vi.fn();
        render(
            <CodeBlock
                filename="index.js"
                switcherOptions={SWITCHER_OPTIONS}
                switcherValue="js"
                onSwitcherChange={onSwitcherChange}
            >
                {'x'}
            </CodeBlock>,
        );
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'ts' },
        });
        expect(onSwitcherChange).toHaveBeenCalledTimes(1);
        expect(onSwitcherChange).toHaveBeenCalledWith('ts');
    });

    it('does not render switcher when switcherValue is missing', () => {
        render(
            <CodeBlock filename="index.js" switcherOptions={SWITCHER_OPTIONS}>
                {'x'}
            </CodeBlock>,
        );
        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('does not render switcher without filename (switcher lives in the header)', () => {
        render(
            <CodeBlock
                switcherOptions={SWITCHER_OPTIONS}
                switcherValue="js"
                onSwitcherChange={() => { }}
            >
                {'x'}
            </CodeBlock>,
        );
        expect(screen.queryByRole('combobox')).toBeNull();
    });

    // ── className / prop forwarding / ref ──

    it('merges custom className onto the root wrapper', () => {
        const { container } = render(
            <CodeBlock className="my-custom-class">{'x'}</CodeBlock>,
        );
        const root = getRoot(container);
        expect(root?.className).toContain('my-custom-class');
        expect(root?.className).toContain('wrapper');
    });

    it('forwards extra HTML attributes to the root wrapper', () => {
        render(
            <CodeBlock aria-label="Example code" data-testid="code-block">
                {'x'}
            </CodeBlock>,
        );
        const root = screen.getByTestId('code-block');
        expect(root).toHaveAttribute('aria-label', 'Example code');
        expect(root).toHaveAttribute('data-oxobz-code-block', '');
    });

    it('forwards ref to the root wrapper div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CodeBlock ref={ref}>{'x'}</CodeBlock>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-code-block', '');
    });

    it('has displayName "CodeBlock"', () => {
        expect(CodeBlock.displayName).toBe('CodeBlock');
    });
});
