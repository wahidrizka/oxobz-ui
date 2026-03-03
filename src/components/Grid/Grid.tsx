import {
    forwardRef,
    type CSSProperties,
    type ReactNode,
    type HTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Grid.module.css';

// ---- Types ----

/** Responsive value: single value or per-breakpoint */
type ResponsiveValue<T> = T | { sm?: T; smd?: T; md?: T; lg?: T };

/** Height mode for the grid */
type GridHeight = 'fit-content' | 'preserve-aspect-ratio';

export interface GridSystemProps extends HTMLAttributes<HTMLDivElement> {
    /** Content to render inside the grid system */
    children?: ReactNode;
    /** Enable debug mode (shows yellow guide overlay) */
    debug?: boolean;
    /** Width of guide lines in pixels */
    guideWidth?: number;
    /** Use container queries instead of media queries */
    unstable_useContainer?: boolean;
    /** Maximum width of the grid system */
    maxWidth?: number;
    /** Minimum width of the grid system */
    minWidth?: number;
}

export interface GridProps extends HTMLAttributes<HTMLElement> {
    /** Content (Grid.Cell children) */
    children?: ReactNode;
    /** Number of columns */
    columns?: ResponsiveValue<number>;
    /** Number of rows */
    rows?: ResponsiveValue<number>;
    /** Height mode */
    height?: GridHeight;
    /** Hide specific guide lines */
    hideGuides?: 'row' | 'column' | 'both';
}

export interface GridCellProps extends HTMLAttributes<HTMLDivElement> {
    /** Content */
    children?: ReactNode;
    /** Column placement (e.g. 'auto', '1', '1/3') */
    column?: ResponsiveValue<string | number>;
    /** Row placement (e.g. 'auto', '1', '1/3') */
    row?: ResponsiveValue<string | number>;
    /** Whether the cell occludes guides */
    solid?: boolean;
    /** Explicit cell rows span */
    cellRows?: ResponsiveValue<number | string>;
    /** Explicit cell columns span */
    cellColumns?: ResponsiveValue<number | string>;
}

// ---- Helpers ----

function resolveResponsive<T>(value: ResponsiveValue<T> | undefined): { sm?: T; smd?: T; md?: T; lg?: T } {
    if (value === undefined) return {};
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value as { sm?: T; smd?: T; md?: T; lg?: T };
    }
    return { sm: value as T };
}

function buildGridVars(
    columns: ResponsiveValue<number> | undefined,
    rows: ResponsiveValue<number> | undefined,
    height: GridHeight | undefined,
): CSSProperties {
    const cols = resolveResponsive(columns);
    const rs = resolveResponsive(rows);
    const vars: Record<string, string | number | undefined> = {};

    // Non-responsive: directly use --grid-columns / --grid-rows
    if (typeof columns === 'number') {
        vars['--grid-columns'] = columns;
    } else if (typeof columns === 'object') {
        if (cols.sm !== undefined) vars['--sm-grid-columns'] = cols.sm;
        if (cols.smd !== undefined) vars['--smd-grid-columns'] = cols.smd;
        if (cols.md !== undefined) vars['--md-grid-columns'] = cols.md;
        if (cols.lg !== undefined) vars['--lg-grid-columns'] = cols.lg;
    }

    if (typeof rows === 'number') {
        vars['--grid-rows'] = rows;
    } else if (typeof rows === 'object') {
        if (rs.sm !== undefined) vars['--sm-grid-rows'] = rs.sm;
        if (rs.smd !== undefined) vars['--smd-grid-rows'] = rs.smd;
        if (rs.md !== undefined) vars['--md-grid-rows'] = rs.md;
        if (rs.lg !== undefined) vars['--lg-grid-rows'] = rs.lg;
    }

    // Height
    if (height === 'fit-content') {
        vars['--sm-height'] = 'fit-content';
    } else if (height === 'preserve-aspect-ratio') {
        vars['--sm-height'] = 'calc(var(--width) / var(--grid-columns) * var(--grid-rows))';
    }

    return vars as CSSProperties;
}

function buildCellVars(
    column: ResponsiveValue<string | number> | undefined,
    row: ResponsiveValue<string | number> | undefined,
): CSSProperties {
    const vars: Record<string, string | number | undefined> = {};

    if (column === undefined && row === undefined) {
        // Auto placement
        vars['--sm-grid-row'] = 'auto';
        vars['--sm-grid-column'] = 'auto';
        vars['--sm-cell-rows'] = 'auto';
        vars['--sm-cell-columns'] = 'auto';
        return vars as CSSProperties;
    }

    const cols = resolveResponsive(column);
    const rs = resolveResponsive(row);

    // Column vars
    if (typeof column === 'string' || typeof column === 'number') {
        vars['--sm-grid-column'] = String(column);
    } else if (typeof column === 'object') {
        if (cols.sm !== undefined) vars['--sm-grid-column'] = String(cols.sm);
        if (cols.smd !== undefined) vars['--smd-grid-column'] = String(cols.smd);
        if (cols.md !== undefined) vars['--md-grid-column'] = String(cols.md);
        if (cols.lg !== undefined) vars['--lg-grid-column'] = String(cols.lg);
    }

    // Row vars
    if (typeof row === 'string' || typeof row === 'number') {
        vars['--sm-grid-row'] = String(row);
    } else if (typeof row === 'object') {
        if (rs.sm !== undefined) vars['--sm-grid-row'] = String(rs.sm);
        if (rs.smd !== undefined) vars['--smd-grid-row'] = String(rs.smd);
        if (rs.md !== undefined) vars['--md-grid-row'] = String(rs.md);
        if (rs.lg !== undefined) vars['--lg-grid-row'] = String(rs.lg);
    }

    return vars as CSSProperties;
}

// ---- Generate guides ----

function generateGuides(columns: number, rows: number, hideGuides?: 'row' | 'column' | 'both'): ReactNode[] {
    const guides: ReactNode[] = [];

    for (let y = 1; y <= rows; y++) {
        for (let x = 1; x <= columns; x++) {
            const guideStyle: CSSProperties & Record<string, string | number> = {
                '--x': x,
                '--y': y,
            };

            // Remove right border on last column
            if (x === columns) {
                guideStyle.borderRight = 'none';
            }
            // Remove bottom border on last row
            if (y === rows) {
                guideStyle.borderBottom = 'none';
            }

            // Hide row guides (horizontal lines)
            if (hideGuides === 'row' || hideGuides === 'both') {
                guideStyle.borderBottom = 'none';
            }

            // Hide column guides (vertical lines)
            if (hideGuides === 'column' || hideGuides === 'both') {
                guideStyle.borderRight = 'none';
            }

            guides.push(
                <div
                    key={`${x}-${y}`}
                    aria-hidden="true"
                    className={styles.guide}
                    style={guideStyle}
                />,
            );
        }
    }

    return guides;
}

// ---- Components ----

/**
 * Grid.System — Container for the grid system.
 */
export const GridSystem = forwardRef<HTMLDivElement, GridSystemProps>(
    ({
        children,
        className,
        debug = false,
        guideWidth,
        unstable_useContainer = false,
        maxWidth,
        minWidth,
        style,
        ...props
    }, ref) => {
        const systemStyle: CSSProperties & Record<string, string | number> = { ...style };
        if (guideWidth !== undefined) systemStyle['--guide-width'] = `${guideWidth}px`;
        if (maxWidth !== undefined) systemStyle['--max-width'] = `${maxWidth}px`;
        if (minWidth !== undefined) systemStyle['--min-width'] = `${minWidth}px`;

        const systemClasses = cn(
            styles.gridSystem,
            debug && styles.systemDebug,
            unstable_useContainer && styles.useContainer,
            className,
        );

        const content = (
            <div
                ref={ref}
                className={systemClasses}
                style={systemStyle}
                data-oxobz-grid-system=""
                {...props}
            >
                {children}
                {debug && <div className={styles.systemDebugOverlay} />}
            </div>
        );

        if (unstable_useContainer) {
            return (
                <div className={styles.unstable_gridSystemWrapper}>
                    {content}
                    <div className={styles.gridSystemLazyContent} />
                </div>
            );
        }

        return content;
    },
);

GridSystem.displayName = 'Grid.System';

/**
 * Grid — The grid section.
 */
const GridRoot = forwardRef<HTMLElement, GridProps>(
    ({ children, className, columns, rows, height = 'fit-content', hideGuides, style, ...props }, ref) => {
        const gridVars = buildGridVars(columns, rows, height);
        const resolvedCols = typeof columns === 'number' ? columns : 0;
        const resolvedRows = typeof rows === 'number' ? rows : 0;

        return (
            <section
                ref={ref}
                className={cn(styles.grid, className)}
                style={{ ...gridVars, ...style }}
                data-grid=""
                data-oxobz-grid=""
                {...props}
            >
                {children}

                {/* Non-responsive guides */}
                {resolvedCols > 0 && resolvedRows > 0 && (
                    <div
                        aria-hidden="true"
                        className={styles.guides}
                        data-grid-guides="true"
                    >
                        {generateGuides(resolvedCols, resolvedRows, hideGuides)}
                    </div>
                )}
            </section>
        );
    },
);

GridRoot.displayName = 'Grid';

/**
 * Grid.Cell — A cell within the grid.
 */
export const GridCell = forwardRef<HTMLDivElement, GridCellProps>(
    ({ children, className, column, row, solid, cellRows, cellColumns, style, ...props }, ref) => {
        const cellVars = buildCellVars(column, row);
        const extraVars: Record<string, string | number | undefined> = {};

        // cellRows
        if (cellRows !== undefined) {
            if (typeof cellRows === 'object') {
                const cr = resolveResponsive(cellRows);
                if (cr.sm !== undefined) extraVars['--sm-cell-rows'] = String(cr.sm);
                if (cr.smd !== undefined) extraVars['--smd-cell-rows'] = String(cr.smd);
                if (cr.md !== undefined) extraVars['--md-cell-rows'] = String(cr.md);
                if (cr.lg !== undefined) extraVars['--lg-cell-rows'] = String(cr.lg);
            } else {
                extraVars['--sm-cell-rows'] = String(cellRows);
            }
        }

        // cellColumns
        if (cellColumns !== undefined) {
            if (typeof cellColumns === 'object') {
                const cc = resolveResponsive(cellColumns);
                if (cc.sm !== undefined) extraVars['--sm-cell-columns'] = String(cc.sm);
                if (cc.smd !== undefined) extraVars['--smd-cell-columns'] = String(cc.smd);
                if (cc.md !== undefined) extraVars['--md-cell-columns'] = String(cc.md);
                if (cc.lg !== undefined) extraVars['--lg-cell-columns'] = String(cc.lg);
            } else {
                extraVars['--sm-cell-columns'] = String(cellColumns);
            }
        }

        return (
            <div
                ref={ref}
                className={cn(styles.block, className)}
                style={{ ...cellVars, ...extraVars as CSSProperties, ...style }}
                data-grid-cell=""
                data-oxobz-grid-cell=""
                {...props}
            >
                {children}
            </div>
        );
    },
);

GridCell.displayName = 'Grid.Cell';

// ---- Compound component ----

type GridComponent = typeof GridRoot & {
    System: typeof GridSystem;
    Cell: typeof GridCell;
};

export const Grid = GridRoot as GridComponent;
Grid.System = GridSystem;
Grid.Cell = GridCell;
