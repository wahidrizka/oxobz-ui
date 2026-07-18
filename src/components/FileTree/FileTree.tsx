import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useState,
    type AnchorHTMLAttributes,
    type ComponentType,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import {
    File as FileIcon,
    FolderClosed,
    FolderOpen,
    FunctionEdgeColor,
    FunctionMiddleware,
    FunctionSquare,
    type IconProps,
} from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './FileTree.module.css';

/* ------------------------------------------------------------------ */
/*  Depth context — drives the `data-tree-indent` guide spans          */
/* ------------------------------------------------------------------ */

/**
 * Nesting depth of the current row. The root `Tree` provides 0; each
 * `Folder` increments it by 1 for its own children so nested rows render
 * one `data-tree-indent` guide span per ancestor level (file-tree.html:
 * `.vc-config.json` sits 4 folders deep and renders 4 indent spans).
 */
const TreeDepthContext = createContext<number>(0);

/** Renders `depth` indent-guide spans (`data-tree-indent`, styled in FileTree.module.css). */
function IndentGuides({ depth }: { depth: number }): ReactNode {
    if (depth <= 0) return null;
    return Array.from({ length: depth }, (_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- depth is stable per row
        <span key={i} data-tree-indent="" />
    ));
}

/* ------------------------------------------------------------------ */
/*  Tree (root)                                                        */
/* ------------------------------------------------------------------ */

export interface TreeProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * Tree — the root container of a file tree. Directly nests `Folder` and
 * `File` rows (file-tree.html Show-code: `<Tree><Folder>…</Folder></Tree>`).
 */
const Tree = forwardRef<HTMLDivElement, TreeProps>(
    ({ className, children, ...rest }, ref) => (
        <div
            {...rest}
            ref={ref}
            className={cn(styles.tree, className)}
            data-oxobz-file-tree=""
            data-version="v1"
        >
            <TreeDepthContext.Provider value={0}>
                {children}
            </TreeDepthContext.Provider>
        </div>
    ),
);
Tree.displayName = 'Tree';

/* ------------------------------------------------------------------ */
/*  Folder                                                             */
/* ------------------------------------------------------------------ */

export interface FolderProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
    /** Folder name, rendered as the row label and the `title` attribute. */
    name: string;
    /** Uncontrolled initial expanded state. Default `false`. */
    defaultOpen?: boolean;
    /** Controlled expanded state. When provided, the Folder is fully controlled. */
    open?: boolean;
    /** Called whenever the expanded state changes (click on the row). */
    onOpenChange?: (open: boolean) => void;
    /** Nested `Folder` / `File` rows. */
    children?: ReactNode;
}

/**
 * Folder — an expandable directory row. Clicking the row toggles its
 * children; the folder icon swaps between `FolderClosed` and `FolderOpen`
 * to mirror the two distinct icon paths captured in file-tree.html (the
 * `app` folder, collapsed, uses the closed-folder path; every `defaultOpen`
 * folder above it uses the open-folder path).
 *
 * Supports both uncontrolled (`defaultOpen`) and controlled (`open` +
 * `onOpenChange`) usage, following the same pattern as `Collapse`.
 */
const Folder = forwardRef<HTMLLIElement, FolderProps>(
    (
        {
            name,
            defaultOpen = false,
            open: controlledOpen,
            onOpenChange,
            className,
            children,
            ...rest
        },
        ref,
    ) => {
        const depth = useContext(TreeDepthContext);
        const [internalOpen, setInternalOpen] = useState(defaultOpen);
        const isControlled = controlledOpen !== undefined;
        const isOpen = isControlled ? controlledOpen : internalOpen;
        const hasChildren = children != null;

        const handleToggle = useCallback(() => {
            const next = !isOpen;
            if (!isControlled) setInternalOpen(next);
            onOpenChange?.(next);
        }, [isOpen, isControlled, onOpenChange]);

        return (
            <li
                {...rest}
                ref={ref}
                className={cn(styles.folderItem, className)}
                title={name}
                data-oxobz-file-tree-folder=""
                data-state={isOpen ? 'open' : 'closed'}
            >
                <button
                    type="button"
                    className={styles.folderButton}
                    aria-expanded={isOpen}
                    onClick={handleToggle}
                >
                    <IndentGuides depth={depth} />
                    <span className={styles.icon}>
                        {isOpen ? <FolderOpen size={16} /> : <FolderClosed size={16} />}
                    </span>
                    <span className={styles.label}>{name}</span>
                </button>
                {hasChildren && isOpen && (
                    <ul className={styles.childList}>
                        <TreeDepthContext.Provider value={depth + 1}>
                            {children}
                        </TreeDepthContext.Provider>
                    </ul>
                )}
            </li>
        );
    },
);
Folder.displayName = 'Folder';

/* ------------------------------------------------------------------ */
/*  File                                                               */
/* ------------------------------------------------------------------ */

/**
 * Function-runtime badge shown on a deployed file. Verified path-for-path
 * against file-tree-expanded.html — the `app` folder was captured actually
 * open this time — via its Show-code JSX:
 * `<File name="main.tsx" type="edge-function" />`,
 * `<File name="dashboard.tsx" type="lambda" />`,
 * `<File name="dashboard.tsx" type="middleware" />` (lines 19-21), matched
 * 1:1 in that order against the three rendered rows under `app`. Each swaps
 * the row's icon to a distinct `@oxobz/icons` component — see
 * FILE_TYPE_ICONS below for the per-type mapping and match evidence.
 */
export type FileType = 'edge-function' | 'lambda' | 'middleware';

export interface FileProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
    /** File name, rendered as the row label and the `title` attribute. */
    name: string;
    /** Optional link target. When omitted, the row renders as a plain (non-navigating) row, matching `index.js` in the snapshot. */
    href?: string;
    /** Function runtime this file deploys as — swaps the row's icon. See FILE_TYPE_ICONS. */
    type?: FileType;
}

/**
 * `type` -> icon, verified path-for-path against file-tree-expanded.html
 * (arc-vs-cubic-bezier notation, 2-decimal rounding, collinear-point
 * removal, and path start-point rotation only — same shapes/colors; all
 * expected artifacts of the production build's SVGO pass over the same
 * source icon, the same kind of diff already seen confirming `main.tsx`):
 *  - "edge-function" -> FunctionEdgeColor. Two-tone: base glyph path in
 *    currentColor, accent path in var(--ds-purple-700) — matches
 *    `main.tsx`'s two <path> elements exactly, accent color included.
 *  - "lambda"        -> FunctionSquare. Single-color (currentColor only)
 *    rounded-square frame + brace glyph — matches the first
 *    `dashboard.tsx` row.
 *  - "middleware"    -> FunctionMiddleware. Same rounded-square frame as
 *    FunctionSquare, "m"-shaped glyph, wrapped in a <clipPath> — matches
 *    the second `dashboard.tsx` row.
 *
 * `Lambda` / `LambdaRectangle` / `LambdaRectangleFill` (a literal Greek
 * lambda glyph) and `Middleware` (a circular sync-arrows glyph) were the
 * naively name-matched candidates but do NOT match either rendered icon —
 * ruled out by comparing `d=` path data coordinate-by-coordinate, not by
 * name association.
 */
const FILE_TYPE_ICONS: Record<FileType, ComponentType<IconProps>> = {
    'edge-function': FunctionEdgeColor,
    lambda: FunctionSquare,
    middleware: FunctionMiddleware,
};

/**
 * File — a leaf row. Renders an `<a>` (matching file-tree.html exactly,
 * including the no-`href` case for `index.js`, where the anchor has no
 * `href` attribute at all rather than falling back to a `<span>`/`<button>`).
 *
 * `IndentGuides` render as a sibling *before* the `<a>` (both children of the
 * `<li>`), not nested inside it — confirmed from file-tree-open.html's
 * `.vc-config.json` / `index.js` rows, where the 4 `data-tree-indent` spans
 * sit directly under `<li>` ahead of the anchor. This differs from `Folder`,
 * whose indent spans *are* nested inside its `<button>` — an asymmetry the
 * production markup itself exhibits, not a copy-paste error here. Getting
 * this right matters visually: because `.fileLink` carries the full-bleed
 * hover background (`margin-left:-8px` + `width:calc(100% + 8px)`), nesting
 * the guides inside it (as a prior revision did) would extend the hover
 * highlight underneath the indent lines; keeping them as flex siblings lets
 * the anchor shrink to start right after the last guide, so hovering a
 * nested file only highlights from its icon onward, matching production.
 *
 * The icon swaps per `type` via FILE_TYPE_ICONS, falling back to the
 * generic `FileIcon` when `type` is omitted — matching `index.js` /
 * `.vc-config.json` in the snapshot. Both cases share the same wrapper
 * span/classes (`.icon.fileIcon`); only the inner `<svg>` differs.
 */
const File = forwardRef<HTMLAnchorElement, FileProps>(
    ({ name, href, type, className, ...rest }, ref) => {
        const depth = useContext(TreeDepthContext);
        const TypeIcon = type ? FILE_TYPE_ICONS[type] : undefined;

        return (
            <li className={styles.item} title={name} data-oxobz-file-tree-file="">
                <IndentGuides depth={depth} />
                <a
                    {...rest}
                    ref={ref}
                    href={href}
                    className={cn(styles.fileLink, className)}
                    data-type={type}
                >
                    <span className={cn(styles.icon, styles.fileIcon)}>
                        {TypeIcon ? <TypeIcon size={14} /> : <FileIcon size={14} />}
                    </span>
                    <span className={styles.label}>{name}</span>
                </a>
            </li>
        );
    },
);
File.displayName = 'File';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

/**
 * `FileTree` — compound alias of `Tree` for import-site discoverability
 * (`FileTree`, `FileTree.Folder`, `FileTree.File`). The flat names `Tree`,
 * `Folder`, `File` are exported directly too, matching the Geist Show-code
 * import (`import { Tree, Folder, File } from '@vercel/geistcn/components'`)
 * 1:1.
 */
const FileTree = Object.assign(Tree, { Folder, File });

export { FileTree, Tree, Folder, File };
