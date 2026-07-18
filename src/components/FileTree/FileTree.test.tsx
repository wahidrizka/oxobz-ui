import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { FileTree, Tree, Folder, File, type FileType } from './FileTree';

describe('Tree (root)', () => {
    it('renders a root div with data-oxobz-file-tree and data-version="v1"', () => {
        const { container } = render(<Tree />);
        const root = container.querySelector('[data-oxobz-file-tree]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root).toHaveAttribute('data-version', 'v1');
        expect(root?.className).toContain('tree');
    });

    it('appends a custom className after the module class', () => {
        const { container } = render(<Tree className="custom-tree" />);
        const root = container.querySelector('[data-oxobz-file-tree]');
        expect(root?.className).toContain('tree');
        expect(root?.className).toContain('custom-tree');
        expect(root?.className.endsWith('custom-tree')).toBe(true);
    });

    it('forwards ref to the root div', () => {
        const ref = createRef<HTMLDivElement>();
        render(<Tree ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current).toHaveAttribute('data-oxobz-file-tree');
    });

    it('forwards extra HTML attributes', () => {
        const { container } = render(<Tree id="my-tree" aria-label="Project files" />);
        const root = container.querySelector('[data-oxobz-file-tree]');
        expect(root).toHaveAttribute('id', 'my-tree');
        expect(root).toHaveAttribute('aria-label', 'Project files');
    });
});

describe('Folder', () => {
    it('renders the name as the row label and the title attribute', () => {
        render(
            <Tree>
                <Folder name="app" />
            </Tree>,
        );
        expect(screen.getByText('app')).toBeInTheDocument();
        expect(screen.getByTitle('app')).toBeInTheDocument();
    });

    it('is collapsed by default (children not rendered)', () => {
        render(
            <Tree>
                <Folder name="app">
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        expect(screen.queryByText('main.tsx')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /app/i })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('defaultOpen renders children on mount', () => {
        render(
            <Tree>
                <Folder name=".vercel" defaultOpen>
                    <File name="index.js" />
                </Folder>
            </Tree>,
        );
        expect(screen.getByText('index.js')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /.vercel/i })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });

    it('click toggles expansion (uncontrolled)', () => {
        render(
            <Tree>
                <Folder name="app">
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        const button = screen.getByRole('button', { name: /app/i });
        expect(screen.queryByText('main.tsx')).not.toBeInTheDocument();

        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('main.tsx')).toBeInTheDocument();

        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('main.tsx')).not.toBeInTheDocument();
    });

    it('calls onOpenChange on toggle', () => {
        const onOpenChange = vi.fn();
        render(
            <Tree>
                <Folder name="app" onOpenChange={onOpenChange}>
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        fireEvent.click(screen.getByRole('button', { name: /app/i }));
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('respects a controlled `open` prop and does not self-toggle', () => {
        const onOpenChange = vi.fn();
        const { rerender } = render(
            <Tree>
                <Folder name="app" open={false} onOpenChange={onOpenChange}>
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        const button = screen.getByRole('button', { name: /app/i });
        fireEvent.click(button);
        // Controlled: internal state does not flip without the prop changing.
        expect(screen.queryByText('main.tsx')).not.toBeInTheDocument();
        expect(onOpenChange).toHaveBeenCalledWith(true);

        rerender(
            <Tree>
                <Folder name="app" open onOpenChange={onOpenChange}>
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        expect(screen.getByText('main.tsx')).toBeInTheDocument();
    });

    it('data-state reflects open/closed', () => {
        render(
            <Tree>
                <Folder name="app" defaultOpen />
            </Tree>,
        );
        expect(screen.getByTitle('app')).toHaveAttribute('data-state', 'open');
        fireEvent.click(screen.getByRole('button', { name: /app/i }));
        expect(screen.getByTitle('app')).toHaveAttribute('data-state', 'closed');
    });

    it('swaps the folder icon between closed and open states', () => {
        render(
            <Tree>
                <Folder name="app">
                    <File name="main.tsx" />
                </Folder>
            </Tree>,
        );
        const button = screen.getByRole('button', { name: /app/i });
        expect(button.querySelector('svg')).toBeInTheDocument();
        const closedPath = button.querySelector('svg path')?.getAttribute('d');

        fireEvent.click(button);
        const openPath = button.querySelector('svg path')?.getAttribute('d');
        expect(openPath).not.toBe(closedPath);
    });

    it('renders one data-tree-indent guide per ancestor level', () => {
        render(
            <Tree>
                <Folder name=".vercel" defaultOpen>
                    <Folder name="output" defaultOpen>
                        <File name="index.js" />
                    </Folder>
                </Folder>
            </Tree>,
        );
        const rootButton = screen.getByRole('button', { name: /^\.vercel$/i });
        expect(rootButton.querySelectorAll('[data-tree-indent]')).toHaveLength(0);

        const nestedButton = screen.getByRole('button', { name: /output/i });
        expect(nestedButton.querySelectorAll('[data-tree-indent]')).toHaveLength(1);

        // File rows render their indent guides as siblings of the <a> — both
        // children of the <li> — not nested inside the anchor (verified from
        // file-tree-open.html's .vc-config.json / index.js rows).
        const fileLink = screen.getByText('index.js').closest('a');
        expect(fileLink?.querySelectorAll('[data-tree-indent]')).toHaveLength(0);
        const fileRow = fileLink?.closest('li');
        expect(fileRow?.querySelectorAll('[data-tree-indent]')).toHaveLength(2);
    });

    it('appends a custom className after the module class', () => {
        render(
            <Tree>
                <Folder name="app" className="custom-folder" />
            </Tree>,
        );
        const li = screen.getByTitle('app');
        expect(li.className).toContain('folderItem');
        expect(li.className).toContain('custom-folder');
    });

    it('forwards ref to the li', () => {
        const ref = createRef<HTMLLIElement>();
        render(
            <Tree>
                <Folder ref={ref} name="app" />
            </Tree>,
        );
        expect(ref.current).toBeInstanceOf(HTMLLIElement);
        expect(ref.current).toHaveAttribute('data-oxobz-file-tree-folder');
    });
});

describe('File', () => {
    it('renders the name as the row label and the title attribute', () => {
        render(
            <Tree>
                <File name="index.js" />
            </Tree>,
        );
        expect(screen.getByText('index.js')).toBeInTheDocument();
        expect(screen.getByTitle('index.js')).toBeInTheDocument();
    });

    it('renders an anchor with href when provided', () => {
        render(
            <Tree>
                <File name=".vc-config.json" href="/" />
            </Tree>,
        );
        const link = screen.getByText('.vc-config.json').closest('a');
        expect(link).toHaveAttribute('href', '/');
    });

    it('renders an anchor without an href attribute when omitted', () => {
        render(
            <Tree>
                <File name="index.js" />
            </Tree>,
        );
        const link = screen.getByText('index.js').closest('a');
        expect(link).not.toHaveAttribute('href');
        expect(link?.tagName).toBe('A');
    });

    // Every value documented in file-tree-expanded.html's Show-code JSX
    // (`main.tsx` / `dashboard.tsx` examples nested under the `app` folder,
    // captured with that folder actually open this time).
    const fileTypeInfo: ReadonlyArray<readonly [FileType, string]> = [
        ['edge-function', 'main.tsx'],
        ['lambda', 'dashboard.tsx'],
        ['middleware', 'dashboard.tsx'],
    ];

    it.each(fileTypeInfo)('forwards type="%s" as data-type', (type, name) => {
        render(
            <Tree>
                <File name={name} type={type} />
            </Tree>,
        );
        const link = screen.getByText(name).closest('a');
        expect(link).toHaveAttribute('data-type', type);
    });

    // Per-type icon swap, verified path-for-path against
    // file-tree-expanded.html's rendered rows (see FileTree.tsx's
    // FILE_TYPE_ICONS doc comment for the full match evidence). Replaces
    // the earlier "still renders the generic file icon" assertion now that
    // a snapshot with the `app` folder actually expanded exists.
    it('renders FunctionEdgeColor (two-tone, purple accent) for type="edge-function"', () => {
        render(
            <Tree>
                <File name="main.tsx" type="edge-function" />
            </Tree>,
        );
        const svg = screen.getByText('main.tsx').closest('a')?.querySelector('svg');
        const paths = svg?.querySelectorAll('path') ?? [];
        expect(paths).toHaveLength(2);
        expect(paths[1]).toHaveAttribute('fill', 'var(--ds-purple-700)');
    });

    it('renders FunctionSquare (single-color, rounded-square frame) for type="lambda"', () => {
        render(
            <Tree>
                <File name="dashboard.tsx" type="lambda" />
            </Tree>,
        );
        const svg = screen.getByText('dashboard.tsx').closest('a')?.querySelector('svg');
        const paths = svg?.querySelectorAll('path') ?? [];
        expect(paths).toHaveLength(1);
        expect(paths[0]).toHaveAttribute('fill', 'currentColor');
        // Coordinate unique to FunctionSquare's frame/glyph path among this
        // file's icon set — not present in FunctionEdgeColor's or
        // FunctionMiddleware's path data.
        expect(paths[0]?.getAttribute('d')).toContain('10.2462');
    });

    it('renders FunctionMiddleware (clipPath-wrapped glyph) for type="middleware"', () => {
        render(
            <Tree>
                <File name="dashboard.tsx" type="middleware" />
            </Tree>,
        );
        const svg = screen.getByText('dashboard.tsx').closest('a')?.querySelector('svg');
        expect(svg?.querySelector('clipPath')).toBeInTheDocument();
    });

    it('renders without a data-type attribute when type is omitted (default)', () => {
        render(
            <Tree>
                <File name="index.js" />
            </Tree>,
        );
        const link = screen.getByText('index.js').closest('a');
        expect(link).not.toHaveAttribute('data-type');
    });

    it('renders the generic single-path FileIcon (no clipPath) when type is omitted', () => {
        render(
            <Tree>
                <File name="index.js" />
            </Tree>,
        );
        const svg = screen.getByText('index.js').closest('a')?.querySelector('svg');
        expect(svg?.querySelectorAll('path')).toHaveLength(1);
        expect(svg?.querySelector('clipPath')).not.toBeInTheDocument();
    });

    it('appends a custom className after the module class', () => {
        render(
            <Tree>
                <File name="index.js" className="custom-file" />
            </Tree>,
        );
        const link = screen.getByText('index.js').closest('a');
        expect(link?.className).toContain('fileLink');
        expect(link?.className).toContain('custom-file');
    });

    it('forwards ref to the anchor', () => {
        const ref = createRef<HTMLAnchorElement>();
        render(
            <Tree>
                <File ref={ref} name="index.js" />
            </Tree>,
        );
        expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
});

describe('Compound FileTree namespace', () => {
    it('exposes Folder and File as members', () => {
        expect(FileTree.Folder).toBe(Folder);
        expect(FileTree.File).toBe(File);
    });

    it('renders the same output as Tree', () => {
        render(
            <FileTree>
                <FileTree.Folder name=".vercel" defaultOpen>
                    <FileTree.File name="index.js" />
                </FileTree.Folder>
            </FileTree>,
        );
        expect(screen.getByText('index.js')).toBeInTheDocument();
    });
});

describe('Full tree shape (file-tree.html Default example)', () => {
    it('renders the nested structure from the snapshot', () => {
        render(
            <Tree>
                <Folder name=".vercel" defaultOpen>
                    <Folder name="output" defaultOpen>
                        <Folder name="functions" defaultOpen>
                            <Folder name="edge.func" defaultOpen>
                                <File name=".vc-config.json" href="/" />
                                <File name="index.js" />
                            </Folder>
                        </Folder>
                    </Folder>
                </Folder>
                <Folder name="app">
                    <File name="main.tsx" type="edge-function" />
                    <File name="dashboard.tsx" type="lambda" />
                </Folder>
            </Tree>,
        );

        expect(screen.getByText('.vercel')).toBeInTheDocument();
        expect(screen.getByText('output')).toBeInTheDocument();
        expect(screen.getByText('functions')).toBeInTheDocument();
        expect(screen.getByText('edge.func')).toBeInTheDocument();
        expect(screen.getByText('.vc-config.json')).toBeInTheDocument();
        expect(screen.getByText('index.js')).toBeInTheDocument();
        expect(screen.getByText('app')).toBeInTheDocument();
        // app is collapsed by default — its children are not in the DOM.
        expect(screen.queryByText('main.tsx')).not.toBeInTheDocument();
        expect(screen.queryByText('dashboard.tsx')).not.toBeInTheDocument();
    });
});

describe('displayName', () => {
    it('has the correct displayName for Tree, Folder and File', () => {
        expect(Tree.displayName).toBe('Tree');
        expect(Folder.displayName).toBe('Folder');
        expect(File.displayName).toBe('File');
    });
});
