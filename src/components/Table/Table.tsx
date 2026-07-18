import {
    forwardRef,
    type ColHTMLAttributes,
    type HTMLAttributes,
    type TableHTMLAttributes,
    type TdHTMLAttributes,
    type ThHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Table.module.css';

/* ------------------------------------------------------------------ */
/*  Shared                                                             */
/* ------------------------------------------------------------------ */

/** data-version attribute matching Geist production output. */
interface Versioned {
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  TableRoot                                                          */
/* ------------------------------------------------------------------ */

export interface TableRootProps extends HTMLAttributes<HTMLDivElement>, Versioned {}

/**
 * TableRoot — the horizontal-scroll wrapper around {@link Table}
 * (table.html, `data-slot="table-root"`: `relative w-full overflow-x-auto`).
 * Always the outermost element; every documented example starts with it.
 */
const TableRoot = forwardRef<HTMLDivElement, TableRootProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.root, className)}
            data-oxobz-table-root=""
            data-version={dataVersion}
        >
            {children}
        </div>
    ),
);
TableRoot.displayName = 'TableRoot';

/* ------------------------------------------------------------------ */
/*  Table                                                               */
/* ------------------------------------------------------------------ */

export interface TableProps extends TableHTMLAttributes<HTMLTableElement>, Versioned {}

/**
 * Table — the `<table>` element itself (table.html, `data-slot="table"`:
 * `text-sm text-gray-900 w-full caption-bottom`). Direct children follow the
 * Show-code order: optional {@link TableColgroup}, {@link TableHeader},
 * {@link TableBody}, optional {@link TableFooter}.
 */
const Table = forwardRef<HTMLTableElement, TableProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <table
            {...rest}
            ref={ref}
            className={cn(styles.table, className)}
            data-oxobz-table=""
            data-version={dataVersion}
        >
            {children}
        </table>
    ),
);
Table.displayName = 'Table';

/* ------------------------------------------------------------------ */
/*  TableColgroup / TableCol                                           */
/* ------------------------------------------------------------------ */

export interface TableColgroupProps extends HTMLAttributes<HTMLTableColElement>, Versioned {}

/**
 * TableColgroup — `<colgroup>` (table.html "Full Featured Table" /
 * "Virtualized Table", `data-slot="table-colgroup"`). Holds one
 * {@link TableCol} per column, used to pin explicit column widths.
 */
const TableColgroup = forwardRef<HTMLTableColElement, TableColgroupProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <colgroup
            {...rest}
            ref={ref}
            className={cn(styles.colgroup, className)}
            data-oxobz-table-colgroup=""
            data-version={dataVersion}
        >
            {children}
        </colgroup>
    ),
);
TableColgroup.displayName = 'TableColgroup';

export interface TableColProps extends ColHTMLAttributes<HTMLTableColElement>, Versioned {}

/**
 * TableCol — `<col>` (table.html, `data-slot="table-col"`). Carries no
 * default styling of its own; column width comes from the consumer's
 * `className` (production usage: `<TableCol className="w-[44%]" />`).
 */
const TableCol = forwardRef<HTMLTableColElement, TableColProps>(
    ({ className, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <col
            {...rest}
            ref={ref}
            className={cn(className)}
            data-oxobz-table-col=""
            data-version={dataVersion}
        />
    ),
);
TableCol.displayName = 'TableCol';

/* ------------------------------------------------------------------ */
/*  TableHeader                                                        */
/* ------------------------------------------------------------------ */

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement>, Versioned {}

/**
 * TableHeader — `<thead>` (table.html, `data-slot="table-header"`:
 * `[&_tr]:border-gray-400 [&_tr]:border-b` — every descendant row gets a
 * 1px bottom hairline).
 */
const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <thead
            {...rest}
            ref={ref}
            className={cn(styles.header, className)}
            data-oxobz-table-header=""
            data-version={dataVersion}
        >
            {children}
        </thead>
    ),
);
TableHeader.displayName = 'TableHeader';

/* ------------------------------------------------------------------ */
/*  TableRow                                                            */
/* ------------------------------------------------------------------ */

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement>, Versioned {}

/**
 * TableRow — `<tr>` (table.html, `data-slot="table-row"`: `transition-colors`
 * — color/background/border transition, 150ms `cubic-bezier(.4,0,.2,1)`,
 * so hover/striped background changes animate instead of snapping).
 */
const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <tr
            {...rest}
            ref={ref}
            className={cn(styles.row, className)}
            data-oxobz-table-row=""
            data-version={dataVersion}
        >
            {children}
        </tr>
    ),
);
TableRow.displayName = 'TableRow';

/* ------------------------------------------------------------------ */
/*  TableHead                                                           */
/* ------------------------------------------------------------------ */

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement>, Versioned {}

/**
 * TableHead — `<th>` (table.html, `data-slot="table-head"`: fixed
 * `--ds-size-medium` (40px) row height, `text-gray-900`, left-aligned,
 * last column right-aligned, and padding/translate adjustments when it
 * holds a `role="checkbox"` control).
 */
const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <th
            {...rest}
            ref={ref}
            className={cn(styles.head, className)}
            data-oxobz-table-head=""
            data-version={dataVersion}
        >
            {children}
        </th>
    ),
);
TableHead.displayName = 'TableHead';

/* ------------------------------------------------------------------ */
/*  TableBody                                                           */
/* ------------------------------------------------------------------ */

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement>, Versioned {
    /**
     * Tint odd rows with `--ds-background-200` (table.html "Striped Table":
     * `<TableBody striped>`).
     */
    striped?: boolean;

    /**
     * Draw a 1px bottom hairline between rows, omitted on the last row
     * (table.html "Bordered Table": `<TableBody bordered>`).
     */
    bordered?: boolean;

    /**
     * Tint the hovered row with `--ds-gray-100` (table.html
     * "Interactive Table": `<TableBody interactive>`).
     */
    interactive?: boolean;

    /**
     * Marks the body as backed by a large/virtualized dataset (table.html
     * "Virtualized Table": `<TableBody interactive striped virtualize>`,
     * 5,000 rows revealed progressively via {@link ShowMore}). Geist's own
     * production render measures a live, scroll-driven window of rows
     * padded by dynamic-height spacer `<tr>`s — that windowing algorithm is
     * pure runtime behavior with no corresponding CSS in any reference
     * chunk, so it cannot be derived from the static snapshot (see the
     * component's module-level doc comment). This prop is exposed for API
     * parity and sets `data-virtualized` for consumers who wire up their
     * own windowing; it does not itself truncate `children`.
     */
    virtualize?: boolean;
}

/**
 * TableBody — `<tbody>` (table.html, `data-slot="table-body"`). Renders an
 * extra `aria-hidden` spacer `<tbody>` immediately before the real one
 * (`h-3 block`, i.e. a 12px gap) — present verbatim in every documented
 * example, including "Basic Table" — to separate the header hairline from
 * the first row.
 */
const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
    (
        {
            striped = false,
            bordered = false,
            interactive = false,
            virtualize = false,
            className,
            children,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => (
        <>
            <tbody aria-hidden="true" className={styles.spacer} />
            <tbody
                {...rest}
                ref={ref}
                className={cn(
                    styles.body,
                    striped && styles.striped,
                    bordered && styles.bordered,
                    interactive && styles.interactive,
                    className,
                )}
                data-oxobz-table-body=""
                data-version={dataVersion}
                data-virtualized={virtualize ? '' : undefined}
            >
                {children}
            </tbody>
        </>
    ),
);
TableBody.displayName = 'TableBody';

/* ------------------------------------------------------------------ */
/*  TableCell                                                           */
/* ------------------------------------------------------------------ */

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement>, Versioned {}

/**
 * TableCell — `<td>` (table.html, `data-slot="table-cell"`). Loses all
 * padding when it wraps a `data-cell-link="true"` element (full-cell link
 * pattern), and shares the checkbox/last-column adjustments with
 * {@link TableHead}.
 */
const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <td
            {...rest}
            ref={ref}
            className={cn(styles.cell, className)}
            data-oxobz-table-cell=""
            data-version={dataVersion}
        >
            {children}
        </td>
    ),
);
TableCell.displayName = 'TableCell';

/* ------------------------------------------------------------------ */
/*  TableFooter                                                         */
/* ------------------------------------------------------------------ */

export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement>, Versioned {}

/**
 * TableFooter — `<tfoot>` (table.html "Full Featured Table" /
 * "Virtualized Table", `data-slot="table-footer"`: top hairline + medium
 * font-weight, e.g. a Subtotal row).
 */
const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
    ({ className, children, 'data-version': dataVersion = 'v1', ...rest }, ref) => (
        <tfoot
            {...rest}
            ref={ref}
            className={cn(styles.footer, className)}
            data-oxobz-table-footer=""
            data-version={dataVersion}
        >
            {children}
        </tfoot>
    ),
);
TableFooter.displayName = 'TableFooter';

/* ------------------------------------------------------------------ */
/*  Exports                                                             */
/* ------------------------------------------------------------------ */

export {
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
};
