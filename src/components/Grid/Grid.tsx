import {
    forwardRef,
    Children,
    isValidElement,
    type CSSProperties,
    type ReactNode,
    type HTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './Grid.module.css';

// ---- Types ----

/** Responsive value: single value or per-breakpoint. Public API uses { sm, md, lg }. */
type ResponsiveValue<T> = T | { sm?: T; smd?: T; md?: T; lg?: T };

type ResolvedResponsive<T> = { sm?: T; smd?: T; md?: T; lg?: T };

/** Height mode for the grid */
type GridHeight = 'fit-content' | 'preserve-aspect-ratio';

/** Which guide lines to hide */
type HideGuides = 'row' | 'column' | 'both';

export interface GridSystemProps extends HTMLAttributes<HTMLDivElement> {
    /** Content to render inside the grid system */
    children?: ReactNode;
    /** Enable debug mode (shows yellow guide overlay) */
    debug?: boolean;
    /** Render guides with a dashed border style */
    dashedGuides?: boolean;
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
    /** Number of columns (responsive: { sm, md, lg }) */
    columns?: ResponsiveValue<number>;
    /** Number of rows (responsive: { sm, md, lg }) */
    rows?: ResponsiveValue<number>;
    /** Height mode */
    height?: GridHeight;
    /** Hide specific guide lines */
    hideGuides?: HideGuides;
}

export interface GridCellProps extends HTMLAttributes<HTMLDivElement> {
    /** Content */
    children?: ReactNode;
    /** Column placement (e.g. 'auto', '1', '1/3') */
    column?: ResponsiveValue<string | number>;
    /** Row placement (e.g. 'auto', '1', '1/3') */
    row?: ResponsiveValue<string | number>;
    /** Whether the cell occludes (clips) the guides it overlaps */
    solid?: boolean;
}

// ---- Breakpoints ----

/** Internal breakpoints, ordered smallest → largest, mirroring the CSS media/container queries. */
const GUIDE_BREAKPOINTS = ['xs', 'sm', 'smd', 'md', 'lg'] as const;
type Breakpoint = (typeof GUIDE_BREAKPOINTS)[number];

const GUIDE_BREAKPOINT_CLASS: Record<Breakpoint, string> = {
    xs: styles.xsGuide,
    sm: styles.smGuide,
    smd: styles.smdGuide,
    md: styles.mdGuide,
    lg: styles.lgGuide,
};

// ---- Helpers ----

function resolveResponsive<T>(value: ResponsiveValue<T> | undefined): ResolvedResponsive<T> {
    if (value === undefined) return {};
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value as ResolvedResponsive<T>;
    }
    return { sm: value as T };
}

/**
 * Resolve a responsive value at a specific breakpoint, mirroring the CSS custom-property
 * fallback chains (e.g. `--md-* , var(--smd-*, var(--sm-*))`).
 */
function resolveAtBreakpoint<T>(resolved: ResolvedResponsive<T>, bp: Breakpoint): T | undefined {
    switch (bp) {
        case 'xs':
            return resolved.sm;
        case 'sm':
            return resolved.sm;
        case 'smd':
            return resolved.smd ?? resolved.md ?? resolved.sm;
        case 'md':
            return resolved.md ?? resolved.smd ?? resolved.sm;
        case 'lg':
            return resolved.lg ?? resolved.md ?? resolved.smd ?? resolved.sm;
    }
}

/** Format a placement value for `--*-grid-column` / `--*-grid-row`. */
function formatPlacement(value: string | number): string {
    const s = String(value).trim();
    if (s === 'auto') return 'auto';
    if (s.includes('/')) return s; // e.g. "1/3", "1/-1"
    return `${s} / span 1`; // single track
}

/** Derive the `--*-cell-columns` / `--*-cell-rows` span count from a placement value. */
function deriveSpanCount(value: string | number): number | string {
    const s = String(value).trim();
    if (s === 'auto') return 'auto';
    if (s.includes('/')) {
        const [aStr, bStr] = s.split('/');
        const a = Number.parseInt(aStr.trim(), 10);
        const b = Number.parseInt(bStr.trim(), 10);
        if (Number.isNaN(a) || Number.isNaN(b)) return 'auto';
        return b - a; // "1/3" → 2, "1/-1" → -2
    }
    return 1;
}

/**
 * Parse a placement value into the inclusive grid-track range [start, end] it covers,
 * resolving negative line numbers against the total track count.
 * Returns null when the value cannot be resolved (e.g. "auto").
 */
function parseCoveredTracks(
    value: string | number | undefined,
    total: number,
): [number, number] | null {
    if (value === undefined) return null;
    const s = String(value).trim();
    if (s === '' || s === 'auto') return null;

    const resolveLine = (n: number): number => (n < 0 ? total + 2 + n : n);

    if (s.includes('/')) {
        const [aStr, bStr] = s.split('/');
        const aRaw = Number.parseInt(aStr.trim(), 10);
        const bRaw = Number.parseInt(bStr.trim(), 10);
        if (Number.isNaN(aRaw) || Number.isNaN(bRaw)) return null;
        const start = resolveLine(aRaw);
        const end = resolveLine(bRaw);
        return [start, end - 1]; // grid line `end` covers tracks up to end - 1
    }

    const line = Number.parseInt(s, 10);
    if (Number.isNaN(line)) return null;
    const resolved = resolveLine(line);
    return [resolved, resolved];
}

function buildGridVars(
    columns: ResponsiveValue<number> | undefined,
    rows: ResponsiveValue<number> | undefined,
    height: GridHeight | undefined,
): CSSProperties {
    const cols = resolveResponsive(columns);
    const rs = resolveResponsive(rows);
    const vars: Record<string, string | number> = {};

    // Non-responsive: use --grid-columns / --grid-rows directly.
    if (typeof columns === 'number') {
        vars['--grid-columns'] = columns;
    } else if (typeof columns === 'object' && columns !== null) {
        if (cols.sm !== undefined) vars['--sm-grid-columns'] = cols.sm;
        if (cols.smd !== undefined) vars['--smd-grid-columns'] = cols.smd;
        if (cols.md !== undefined) vars['--md-grid-columns'] = cols.md;
        if (cols.lg !== undefined) vars['--lg-grid-columns'] = cols.lg;
    }

    if (typeof rows === 'number') {
        vars['--grid-rows'] = rows;
    } else if (typeof rows === 'object' && rows !== null) {
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

/** Emit `--*-grid-{axis}` placement vars for one axis (or `auto` when unset). */
function emitPlacementVars(
    value: ResponsiveValue<string | number> | undefined,
    axis: 'grid-row' | 'grid-column',
    vars: Record<string, string | number>,
): void {
    if (value === undefined) {
        vars[`--sm-${axis}`] = 'auto';
        return;
    }
    const resolved = resolveResponsive(value);
    for (const bp of ['sm', 'smd', 'md', 'lg'] as const) {
        const v = resolved[bp];
        if (v !== undefined) vars[`--${bp}-${axis}`] = formatPlacement(v);
    }
}

/** Emit `--*-cell-{axis}` span-count vars for one axis (or `auto` when unset). */
function emitSpanCountVars(
    value: ResponsiveValue<string | number> | undefined,
    axis: 'cell-rows' | 'cell-columns',
    vars: Record<string, string | number>,
): void {
    if (value === undefined) {
        vars[`--sm-${axis}`] = 'auto';
        return;
    }
    const resolved = resolveResponsive(value);
    for (const bp of ['sm', 'smd', 'md', 'lg'] as const) {
        const v = resolved[bp];
        if (v !== undefined) vars[`--${bp}-${axis}`] = deriveSpanCount(v);
    }
}

function buildCellVars(
    column: ResponsiveValue<string | number> | undefined,
    row: ResponsiveValue<string | number> | undefined,
): CSSProperties {
    const vars: Record<string, string | number> = {};
    // Order mirrors Geist: grid-row → grid-column → cell-rows → cell-columns.
    emitPlacementVars(row, 'grid-row', vars);
    emitPlacementVars(column, 'grid-column', vars);
    emitSpanCountVars(row, 'cell-rows', vars);
    emitSpanCountVars(column, 'cell-columns', vars);
    return vars as CSSProperties;
}

// ---- Guides ----

interface SolidCellSpec {
    column?: ResponsiveValue<string | number>;
    row?: ResponsiveValue<string | number>;
}

interface SolidRegion {
    /** first covered column track */
    c1: number;
    /** last covered column track */
    c2: number;
    /** first covered row track */
    r1: number;
    /** last covered row track */
    r2: number;
}

/** Resolve each solid cell into its covered track region at a given breakpoint. */
function computeSolidRegions(
    solidCells: SolidCellSpec[],
    bp: Breakpoint,
    columns: number,
    rows: number,
): SolidRegion[] {
    const regions: SolidRegion[] = [];
    for (const cell of solidCells) {
        const colValue = resolveAtBreakpoint(resolveResponsive(cell.column), bp);
        const rowValue = resolveAtBreakpoint(resolveResponsive(cell.row), bp);
        const colTracks = parseCoveredTracks(colValue, columns);
        const rowTracks = parseCoveredTracks(rowValue, rows);
        if (colTracks && rowTracks) {
            regions.push({ c1: colTracks[0], c2: colTracks[1], r1: rowTracks[0], r2: rowTracks[1] });
        }
    }
    return regions;
}

/**
 * Generate one set of guide cells for a grid of `columns` × `rows`.
 * Interior borders of `solid` regions are removed so the cell occludes the guides behind it.
 */
function generateGuideSet(
    columns: number,
    rows: number,
    hideGuides: HideGuides | undefined,
    solids: SolidRegion[],
    bpClass?: string,
): ReactNode[] {
    const guides: ReactNode[] = [];

    for (let y = 1; y <= rows; y++) {
        for (let x = 1; x <= columns; x++) {
            const guideStyle: CSSProperties & Record<string, string | number> = {
                '--x': x,
                '--y': y,
            };

            // Edges of the grid are drawn by the system border, not the guide.
            let removeRight = x === columns;
            let removeBottom = y === rows;

            if (hideGuides === 'row' || hideGuides === 'both') removeBottom = true;
            if (hideGuides === 'column' || hideGuides === 'both') removeRight = true;

            // Clip interior guides overlapped by solid cells.
            for (const s of solids) {
                if (x >= s.c1 && x <= s.c2 - 1 && y >= s.r1 && y <= s.r2) removeRight = true;
                if (y >= s.r1 && y <= s.r2 - 1 && x >= s.c1 && x <= s.c2) removeBottom = true;
            }

            if (removeRight) guideStyle.borderRight = 'none';
            if (removeBottom) guideStyle.borderBottom = 'none';

            guides.push(
                <div
                    key={`${x}-${y}`}
                    aria-hidden="true"
                    className={bpClass ? cn(styles.guide, bpClass) : styles.guide}
                    style={guideStyle}
                />,
            );
        }
    }

    return guides;
}

/** Collect the placement specs of all `solid` GridCell children. */
function collectSolidCells(children: ReactNode): SolidCellSpec[] {
    const solids: SolidCellSpec[] = [];
    Children.forEach(children, (child) => {
        if (!isValidElement<GridCellProps>(child)) return;
        if (child.type !== GridCell) return;
        const { solid, column, row } = child.props;
        if (solid && column !== undefined && row !== undefined) {
            solids.push({ column, row });
        }
    });
    return solids;
}

// ---- Components ----

/**
 * Grid.System — Container for the grid system.
 */
export const GridSystem = forwardRef<HTMLDivElement, GridSystemProps>(
    (
        {
            children,
            className,
            debug = false,
            dashedGuides = false,
            guideWidth,
            unstable_useContainer = false,
            maxWidth,
            minWidth,
            style,
            ...props
        },
        ref,
    ) => {
        const systemStyle: CSSProperties & Record<string, string | number> = { ...style };
        if (guideWidth !== undefined) systemStyle['--guide-width'] = `${guideWidth}px`;
        if (maxWidth !== undefined) systemStyle['--max-width'] = `${maxWidth}px`;
        if (minWidth !== undefined) systemStyle['--min-width'] = `${minWidth}px`;

        const systemClasses = cn(
            styles.gridSystem,
            debug && styles.systemDebug,
            dashedGuides && styles.systemDashed,
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
                {unstable_useContainer && <div className={styles.gridSystemLazyContent} />}
                {debug && <div className={styles.systemDebugOverlay} />}
            </div>
        );

        if (unstable_useContainer) {
            return <div className={styles.unstable_gridSystemWrapper}>{content}</div>;
        }

        return content;
    },
);

GridSystem.displayName = 'Grid.System';

/**
 * Grid.Cell — A cell within the grid.
 */
export const GridCell = forwardRef<HTMLDivElement, GridCellProps>(
    ({ children, className, column, row, solid: _solid, style, ...props }, ref) => {
        const cellVars = buildCellVars(column, row);

        return (
            <div
                ref={ref}
                className={cn(styles.block, className)}
                style={{ ...cellVars, ...style }}
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

/**
 * Grid — The grid section.
 */
const GridRoot = forwardRef<HTMLElement, GridProps>(
    ({ children, className, columns, rows, height = 'fit-content', hideGuides, style, ...props }, ref) => {
        const gridVars = buildGridVars(columns, rows, height);

        const columnsIsResponsive = typeof columns === 'object' && columns !== null;
        const rowsIsResponsive = typeof rows === 'object' && rows !== null;
        const isResponsive = columnsIsResponsive || rowsIsResponsive;

        const solidCells = collectSolidCells(children);

        let guides: ReactNode = null;
        if (isResponsive) {
            const colResolved = resolveResponsive(columns);
            const rowResolved = resolveResponsive(rows);
            guides = GUIDE_BREAKPOINTS.map((bp) => {
                const colCount = resolveAtBreakpoint(colResolved, bp);
                const rowCount = resolveAtBreakpoint(rowResolved, bp);
                if (!colCount || !rowCount || colCount <= 0 || rowCount <= 0) return null;
                const solids = computeSolidRegions(solidCells, bp, colCount, rowCount);
                return (
                    <div
                        key={bp}
                        aria-hidden="true"
                        className={styles.guides}
                        data-grid-guides="true"
                    >
                        {generateGuideSet(colCount, rowCount, hideGuides, solids, GUIDE_BREAKPOINT_CLASS[bp])}
                    </div>
                );
            });
        } else {
            const colCount = typeof columns === 'number' ? columns : 0;
            const rowCount = typeof rows === 'number' ? rows : 0;
            if (colCount > 0 && rowCount > 0) {
                const solids = computeSolidRegions(solidCells, 'sm', colCount, rowCount);
                guides = (
                    <div aria-hidden="true" className={styles.guides} data-grid-guides="true">
                        {generateGuideSet(colCount, rowCount, hideGuides, solids)}
                    </div>
                );
            }
        }

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
                {guides}
            </section>
        );
    },
);

GridRoot.displayName = 'Grid';

// ---- Compound component ----

type GridComponent = typeof GridRoot & {
    System: typeof GridSystem;
    Cell: typeof GridCell;
};

export const Grid = GridRoot as GridComponent;
Grid.System = GridSystem;
Grid.Cell = GridCell;
