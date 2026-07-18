import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import {
    TableRoot,
    Table,
    TableColgroup,
    TableCol,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    TableFooter,
} from './Table';

/** A minimal 1x1 table (root/table/header/body) used across most assertions. */
function BasicTable(bodyProps: Parameters<typeof TableBody>[0] = {}) {
    return (
        <TableRoot>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Col 1</TableHead>
                        <TableHead>Col 2</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody {...bodyProps}>
                    <TableRow>
                        <TableCell>Value 1.1</TableCell>
                        <TableCell>Value 1.2</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableRoot>
    );
}

describe('Table', () => {
    // ── Rendering (structure) ──

    it('renders TableRoot > Table > TableHeader/TableBody with data-oxobz attributes', () => {
        const { container } = render(<BasicTable />);

        const root = container.querySelector('[data-oxobz-table-root]');
        expect(root).toBeInTheDocument();
        expect(root?.tagName).toBe('DIV');
        expect(root?.className).toContain('root');

        const table = container.querySelector('[data-oxobz-table]');
        expect(table).toBeInTheDocument();
        expect(table?.tagName).toBe('TABLE');
        expect(root?.contains(table)).toBe(true);

        const header = container.querySelector('[data-oxobz-table-header]');
        expect(header?.tagName).toBe('THEAD');

        const body = container.querySelector('[data-oxobz-table-body]');
        expect(body?.tagName).toBe('TBODY');

        expect(screen.getByText('Col 1')).toBeInTheDocument();
        expect(screen.getByText('Value 1.1')).toBeInTheDocument();
    });

    it('renders TableRow as <tr> with data-oxobz-table-row and the transition class', () => {
        const { container } = render(<BasicTable />);
        const rows = container.querySelectorAll('[data-oxobz-table-row]');
        expect(rows).toHaveLength(2); // header row + body row
        rows.forEach((row) => {
            expect(row.tagName).toBe('TR');
            expect(row.className).toContain('row');
        });
    });

    it('renders TableHead as <th> with data-oxobz-table-head', () => {
        const { container } = render(<BasicTable />);
        const heads = container.querySelectorAll('[data-oxobz-table-head]');
        expect(heads).toHaveLength(2);
        heads.forEach((head) => expect(head.tagName).toBe('TH'));
    });

    it('renders TableCell as <td> with data-oxobz-table-cell', () => {
        const { container } = render(<BasicTable />);
        const cells = container.querySelectorAll('[data-oxobz-table-cell]');
        expect(cells).toHaveLength(2);
        cells.forEach((cell) => expect(cell.tagName).toBe('TD'));
    });

    it('renders a hidden spacer tbody immediately before the real TableBody', () => {
        const { container } = render(<BasicTable />);
        const tbodies = container.querySelectorAll('table > tbody');
        expect(tbodies).toHaveLength(2);
        expect(tbodies[0]).toHaveAttribute('aria-hidden', 'true');
        expect(tbodies[0].className).toContain('spacer');
        expect(tbodies[1]).toHaveAttribute('data-oxobz-table-body');
    });

    // ── TableColgroup / TableCol ──

    it('renders TableColgroup > TableCol with data-oxobz attributes and native span/className', () => {
        const { container } = render(
            <TableRoot>
                <Table>
                    <TableColgroup>
                        <TableCol className="w-[44%]" />
                        <TableCol span={2} />
                    </TableColgroup>
                    <TableHeader>
                        <TableRow>
                            <TableHead>A</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableRoot>,
        );

        const colgroup = container.querySelector('[data-oxobz-table-colgroup]');
        expect(colgroup?.tagName).toBe('COLGROUP');

        const cols = container.querySelectorAll('[data-oxobz-table-col]');
        expect(cols).toHaveLength(2);
        expect(cols[0].tagName).toBe('COL');
        expect(cols[0].className).toContain('w-[44%]');
        expect(cols[1]).toHaveAttribute('span', '2');
    });

    // ── TableFooter ──

    it('renders TableFooter as <tfoot> with data-oxobz-table-footer, supporting colSpan cells', () => {
        const { container } = render(
            <TableRoot>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell>2</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={1}>Subtotal</TableCell>
                            <TableCell>$10.00</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableRoot>,
        );

        const footer = container.querySelector('[data-oxobz-table-footer]');
        expect(footer?.tagName).toBe('TFOOT');
        const subtotalCell = screen.getByText('Subtotal');
        expect(subtotalCell).toHaveAttribute('colspan', '1');
    });

    // ── TableBody variants ──

    it('applies no variant classes on TableBody by default', () => {
        const { container } = render(<BasicTable />);
        const body = container.querySelector('[data-oxobz-table-body]');
        for (const cls of ['striped', 'bordered', 'interactive']) {
            expect(body?.className).not.toContain(cls);
        }
        expect(body).not.toHaveAttribute('data-virtualized');
    });

    it('applies the striped class', () => {
        const { container } = render(<BasicTable striped />);
        expect(container.querySelector('[data-oxobz-table-body]')?.className).toContain('striped');
    });

    it('applies the bordered class', () => {
        const { container } = render(<BasicTable bordered />);
        expect(container.querySelector('[data-oxobz-table-body]')?.className).toContain('bordered');
    });

    it('applies the interactive class', () => {
        const { container } = render(<BasicTable interactive />);
        expect(container.querySelector('[data-oxobz-table-body]')?.className).toContain(
            'interactive',
        );
    });

    it('combines striped, bordered and interactive', () => {
        const { container } = render(<BasicTable striped bordered interactive />);
        const body = container.querySelector('[data-oxobz-table-body]');
        for (const cls of ['striped', 'bordered', 'interactive']) {
            expect(body?.className).toContain(cls);
        }
    });

    it('sets data-virtualized when virtualize is passed, without truncating children', () => {
        const { container } = render(<BasicTable virtualize />);
        const body = container.querySelector('[data-oxobz-table-body]');
        expect(body).toHaveAttribute('data-virtualized', '');
        expect(screen.getByText('Value 1.1')).toBeInTheDocument();
    });

    // ── Custom className ──

    it('appends a custom className after the module class on every primitive', () => {
        const { container } = render(
            <TableRoot className="custom-root">
                <Table className="custom-table">
                    <TableHeader className="custom-header">
                        <TableRow className="custom-row">
                            <TableHead className="custom-head">H</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="custom-body">
                        <TableRow className="custom-row">
                            <TableCell className="custom-cell">C</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter className="custom-footer">
                        <TableRow>
                            <TableCell>F</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableRoot>,
        );

        expect(
            container.querySelector('[data-oxobz-table-root]')?.className.endsWith('custom-root'),
        ).toBe(true);
        expect(
            container.querySelector('[data-oxobz-table]')?.className.endsWith('custom-table'),
        ).toBe(true);
        expect(
            container.querySelector('[data-oxobz-table-header]')?.className.endsWith(
                'custom-header',
            ),
        ).toBe(true);
        expect(
            container.querySelector('[data-oxobz-table-body]')?.className.endsWith('custom-body'),
        ).toBe(true);
        expect(
            container.querySelector('[data-oxobz-table-footer]')?.className.endsWith(
                'custom-footer',
            ),
        ).toBe(true);
    });

    // ── data-version ──

    it('defaults data-version to "v1" on every primitive', () => {
        const { container } = render(<BasicTable />);
        for (const selector of [
            '[data-oxobz-table-root]',
            '[data-oxobz-table]',
            '[data-oxobz-table-header]',
            '[data-oxobz-table-row]',
            '[data-oxobz-table-head]',
            '[data-oxobz-table-body]',
            '[data-oxobz-table-cell]',
        ]) {
            expect(container.querySelector(selector)).toHaveAttribute('data-version', 'v1');
        }
    });

    it('allows a custom data-version on TableRoot', () => {
        const { container } = render(
            <TableRoot data-version="v2">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableRoot>,
        );
        expect(container.querySelector('[data-oxobz-table-root]')).toHaveAttribute(
            'data-version',
            'v2',
        );
    });

    // ── Ref forwarding ──

    it('forwards refs from every primitive to its native element', () => {
        const rootRef = createRef<HTMLDivElement>();
        const tableRef = createRef<HTMLTableElement>();
        const headerRef = createRef<HTMLTableSectionElement>();
        const rowRef = createRef<HTMLTableRowElement>();
        const headRef = createRef<HTMLTableCellElement>();
        const bodyRef = createRef<HTMLTableSectionElement>();
        const cellRef = createRef<HTMLTableCellElement>();
        const footerRef = createRef<HTMLTableSectionElement>();
        const colgroupRef = createRef<HTMLTableColElement>();
        const colRef = createRef<HTMLTableColElement>();

        render(
            <TableRoot ref={rootRef}>
                <Table ref={tableRef}>
                    <TableColgroup ref={colgroupRef}>
                        <TableCol ref={colRef} />
                    </TableColgroup>
                    <TableHeader ref={headerRef}>
                        <TableRow ref={rowRef}>
                            <TableHead ref={headRef}>H</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody ref={bodyRef}>
                        <TableRow>
                            <TableCell ref={cellRef}>C</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter ref={footerRef}>
                        <TableRow>
                            <TableCell>F</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableRoot>,
        );

        expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
        expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
        expect(headerRef.current?.tagName).toBe('THEAD');
        expect(rowRef.current?.tagName).toBe('TR');
        expect(headRef.current?.tagName).toBe('TH');
        expect(bodyRef.current).toHaveAttribute('data-oxobz-table-body');
        expect(cellRef.current?.tagName).toBe('TD');
        expect(footerRef.current?.tagName).toBe('TFOOT');
        expect(colgroupRef.current?.tagName).toBe('COLGROUP');
        expect(colRef.current?.tagName).toBe('COL');
    });

    // ── Prop forwarding ──

    it('forwards extra HTML attributes on Table (id, aria-label)', () => {
        const { container } = render(
            <TableRoot>
                <Table aria-label="products" id="products-table">
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableRoot>,
        );
        const table = container.querySelector('[data-oxobz-table]');
        expect(table).toHaveAttribute('id', 'products-table');
        expect(table).toHaveAttribute('aria-label', 'products');
    });

    // ── displayName ──

    it('has the correct displayName on every primitive', () => {
        expect(TableRoot.displayName).toBe('TableRoot');
        expect(Table.displayName).toBe('Table');
        expect(TableColgroup.displayName).toBe('TableColgroup');
        expect(TableCol.displayName).toBe('TableCol');
        expect(TableHeader.displayName).toBe('TableHeader');
        expect(TableRow.displayName).toBe('TableRow');
        expect(TableHead.displayName).toBe('TableHead');
        expect(TableBody.displayName).toBe('TableBody');
        expect(TableCell.displayName).toBe('TableCell');
        expect(TableFooter.displayName).toBe('TableFooter');
    });
});
