import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { ChevronDown, ChevronRight } from '@oxobz/icons';
import { cn } from '../../utils/cn';
import styles from './JsonView.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Any value that can appear inside the `data` prop (a parsed JSON tree). */
export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export interface JsonViewProps extends HTMLAttributes<HTMLSpanElement> {
    /**
     * The JSON object or array to render. Pass the parsed value — never
     * pre-stringify it (json-view.html, "Behavior").
     */
    data: JsonValue;

    /**
     * Nodes at a depth strictly below this number start expanded; the rest
     * start collapsed (root is depth 0). Use `1` so top-level fields are
     * visible by default, or `0` to keep the surface fully collapsed
     * (json-view.html, "Default" / "Collapsed").
     *
     * Every snapshot example passes this prop explicitly, so there is no
     * production-verified implicit default — `1` is this component's own
     * fallback, matching the doc's recommended starting point.
     */
    defaultExpandDepth?: number;

    /**
     * Regex built by {@link makeJsonViewHighlightPattern} used to highlight
     * matching field names and string values. Leave `null`/`undefined` when
     * nothing is being searched (json-view.html, "Behavior").
     */
    highlightPattern?: RegExp | null;

    /** data-version attribute matching Geist production output. */
    'data-version'?: string;
}

/* ------------------------------------------------------------------ */
/*  Highlight pattern helper                                           */
/* ------------------------------------------------------------------ */

/**
 * Builds the `highlightPattern` prop from a list of search terms. Matches
 * are case-insensitive substrings (e.g. `"request"` matches inside
 * `"requestId"`), mirroring the `<mark>` spans in json-view.html.
 */
export function makeJsonViewHighlightPattern(terms: string[]): RegExp {
    const escaped = terms
        .map((term) => term.trim())
        .filter((term) => term.length > 0)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // No usable terms: a pattern that can never match (negative lookahead
    // on nothing always fails) instead of an empty group that would match
    // everywhere.
    if (escaped.length === 0) {
        return /(?!)/g;
    }

    return new RegExp(`(${escaped.join('|')})`, 'gi');
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function isContainer(value: JsonValue): value is JsonValue[] | { [key: string]: JsonValue } {
    return typeof value === 'object' && value !== null;
}

/** Ordered `[key, value]` pairs for an object or `[index, value]` for an array. */
function getEntries(value: JsonValue[] | { [key: string]: JsonValue }): Array<[string, JsonValue]> {
    if (Array.isArray(value)) {
        return value.map((item, index) => [String(index), item]);
    }
    return Object.entries(value);
}

type ValueKind = 'string' | 'number' | 'boolean' | 'null' | 'undefined';

function getValueKind(value: JsonValue | undefined): ValueKind {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    return 'boolean';
}

/** Visual text for a primitive (strings are quoted, matching the snapshot). */
function formatValueDisplay(value: JsonValue | undefined): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
}

/** Plain text for aria-label / data-json-tree-label (strings unquoted). */
function formatValuePlain(value: JsonValue | undefined): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    return String(value);
}

const valueClassByKind: Record<ValueKind, string> = {
    string: styles.valueString,
    number: styles.valueNumber,
    boolean: styles.valueBoolean,
    null: styles.valueNull,
    undefined: styles.valueNull,
};

/** Splits `text` on `pattern` matches and wraps hits in a `<mark>`. */
function renderHighlighted(text: string, pattern: RegExp | null | undefined, keyPrefix: string): ReactNode {
    if (!pattern) return text;

    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = re.exec(text)) !== null) {
        if (match[0].length === 0) {
            re.lastIndex += 1;
            continue;
        }
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
            <mark className={styles.mark} key={`${keyPrefix}-${count}`}>
                {match[0]}
            </mark>,
        );
        count += 1;
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

/** Depth-first list of node paths currently reachable given `expanded`. */
function collectVisiblePaths(
    value: JsonValue,
    path: string,
    expanded: ReadonlySet<string>,
    acc: string[],
): void {
    acc.push(path);
    if (!isContainer(value)) return;
    const entries = getEntries(value);
    if (entries.length === 0 || !expanded.has(path)) return;
    entries.forEach(([key, child]) => {
        collectVisiblePaths(child, `${path}.${key}`, expanded, acc);
    });
}

/** Resolves a `.`-joined path (e.g. `root.request.method`) back to its value. */
function getValueAtPath(data: JsonValue, path: string): JsonValue | undefined {
    const segments = path.split('.').slice(1); // drop the leading "root"
    let current: JsonValue = data;
    for (const segment of segments) {
        if (!isContainer(current)) return undefined;
        const entries = getEntries(current);
        const entry = entries.find(([key]) => key === segment);
        if (!entry) return undefined;
        current = entry[1];
    }
    return current;
}

/** Every container path in `data`, paired with the depth it lives at. */
function collectDefaultExpanded(
    value: JsonValue,
    path: string,
    depth: number,
    expandDepth: number,
    acc: Set<string>,
): void {
    if (!isContainer(value)) return;
    const entries = getEntries(value);
    if (entries.length === 0) return;
    if (depth < expandDepth) {
        acc.add(path);
    }
    entries.forEach(([key, child]) => {
        collectDefaultExpanded(child, `${path}.${key}`, depth + 1, expandDepth, acc);
    });
}

/* ------------------------------------------------------------------ */
/*  Node renderer                                                      */
/* ------------------------------------------------------------------ */

interface JsonNodeProps {
    value: JsonValue;
    path: string;
    keyName: string | undefined;
    isArrayItem: boolean;
    depth: number;
    posinset: number;
    setsize: number;
    expanded: ReadonlySet<string>;
    focusedPath: string;
    highlightPattern: RegExp | null | undefined;
    onToggle: (path: string) => void;
    registerRef: (path: string, el: HTMLSpanElement | null) => void;
    onFocusPath: (path: string) => void;
}

function JsonNode({
    value,
    path,
    keyName,
    isArrayItem,
    depth,
    posinset,
    setsize,
    expanded,
    focusedPath,
    highlightPattern,
    onToggle,
    registerRef,
    onFocusPath,
}: JsonNodeProps): ReactNode {
    const trailingComma = posinset < setsize ? ',' : '';
    const tabIndex = focusedPath === path ? 0 : -1;
    const keySpan = keyName !== undefined && !isArrayItem ? (
        <span className={styles.key}>
            {renderHighlighted(keyName, highlightPattern, `${path}-key`)}
            {': '}
        </span>
    ) : null;

    if (isContainer(value)) {
        const entries = getEntries(value);
        const hasChildren = entries.length > 0;
        const isArray = Array.isArray(value);
        const openChar = isArray ? '[' : '{';
        const closeBracket = isArray ? ']' : '}';
        const label = keyName !== undefined
            ? `${keyName}: ${isArray ? 'array' : 'object'}`
            : `JSON ${isArray ? 'array' : 'object'}`;

        if (!hasChildren) {
            // Empty object/array: not expandable, rendered inline like a leaf.
            // (Not present in the captured snapshot — reasonable inference.)
            return (
                <span
                    aria-label={label}
                    aria-level={depth + 1}
                    aria-posinset={posinset}
                    aria-setsize={setsize}
                    className={styles.treeItem}
                    data-json-tree-label={label}
                    onFocus={(event) => {
                        if (event.target === event.currentTarget) onFocusPath(path);
                    }}
                    ref={(el) => registerRef(path, el)}
                    role="treeitem"
                    tabIndex={tabIndex}
                >
                    <span className={styles.row}>
                        {keySpan}
                        {openChar}
                        {closeBracket}
                        {trailingComma}
                    </span>
                </span>
            );
        }

        const isExpanded = expanded.has(path);

        if (!isExpanded) {
            return (
                <span
                    aria-expanded={false}
                    aria-label={label}
                    aria-level={depth + 1}
                    aria-posinset={posinset}
                    aria-setsize={setsize}
                    className={styles.treeItem}
                    data-json-tree-label={label}
                    onFocus={(event) => {
                        if (event.target === event.currentTarget) onFocusPath(path);
                    }}
                    ref={(el) => registerRef(path, el)}
                    role="treeitem"
                    tabIndex={tabIndex}
                >
                    <span
                        className={cn(styles.row, styles.rowToggle)}
                        data-json-node-toggle="true"
                        onClick={() => {
                            onToggle(path);
                            onFocusPath(path);
                        }}
                    >
                        <span aria-hidden="true" className={styles.icon}>
                            <ChevronRight size={16} />
                        </span>
                        {keySpan}
                        {openChar}
                        <span className={styles.ellipsis}>{'…'}</span>
                        {closeBracket}
                        {trailingComma}
                    </span>
                </span>
            );
        }

        return (
            <span
                aria-expanded
                aria-label={label}
                aria-level={depth + 1}
                aria-posinset={posinset}
                aria-setsize={setsize}
                className={styles.treeItem}
                data-json-tree-label={label}
                onFocus={(event) => {
                    if (event.target === event.currentTarget) onFocusPath(path);
                }}
                ref={(el) => registerRef(path, el)}
                role="treeitem"
                tabIndex={tabIndex}
            >
                <span
                    className={cn(styles.row, styles.rowToggle)}
                    data-json-node-toggle="true"
                    onClick={() => {
                        onToggle(path);
                        onFocusPath(path);
                    }}
                >
                    <span aria-hidden="true" className={styles.icon}>
                        <ChevronDown size={16} />
                    </span>
                    {keySpan}
                    {openChar}
                </span>
                <span className={styles.group} role="group">
                    {entries.map(([entryKey, entryValue], index) => (
                        <JsonNode
                            depth={depth + 1}
                            expanded={expanded}
                            focusedPath={focusedPath}
                            highlightPattern={highlightPattern}
                            isArrayItem={isArray}
                            key={entryKey}
                            keyName={entryKey}
                            onFocusPath={onFocusPath}
                            onToggle={onToggle}
                            path={`${path}.${entryKey}`}
                            posinset={index + 1}
                            registerRef={registerRef}
                            setsize={entries.length}
                            value={entryValue}
                        />
                    ))}
                </span>
                <span className={styles.closingLine}>
                    {closeBracket}
                    {trailingComma}
                </span>
            </span>
        );
    }

    // Primitive leaf.
    const kind = getValueKind(value);
    const displayText = formatValueDisplay(value);
    const plainText = formatValuePlain(value);
    const label = keyName !== undefined
        ? `${keyName}: ${plainText}`
        : `JSON: ${plainText}`;

    return (
        <span
            aria-label={label}
            aria-level={depth + 1}
            aria-posinset={posinset}
            aria-setsize={setsize}
            className={styles.treeItem}
            data-json-tree-label={label}
            onFocus={(event) => {
                if (event.target === event.currentTarget) onFocusPath(path);
            }}
            ref={(el) => registerRef(path, el)}
            role="treeitem"
            tabIndex={tabIndex}
        >
            <span className={styles.row}>
                {keySpan}
                <span className={valueClassByKind[kind]}>
                    {kind === 'string'
                        ? renderHighlighted(displayText, highlightPattern, `${path}-value`)
                        : displayText}
                </span>
                {trailingComma}
            </span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ROOT_PATH = 'root';

/**
 * Render JSON objects and arrays as a collapsible tree with syntax coloring,
 * keyboard navigation, search highlighting, and selectable text.
 *
 * Rendered DOM (Geist production / geistcn structure):
 * ```html
 * <span class="wrapper" data-oxobz-json-view="" data-version="v1">
 *   <span aria-label="JSON" role="tree" class="tree">
 *     <span role="treeitem" aria-expanded aria-level="1" ...>
 *       <span class="row rowToggle" data-json-node-toggle="true">…{</span>
 *       <span role="group" class="group">…children…</span>
 *       <span class="closingLine">}</span>
 *     </span>
 *   </span>
 * </span>
 * ```
 *
 * Keyboard (json-view.html, "Accessibility"): Arrow keys move focus between
 * visible nodes, Enter/Space toggle the focused expandable node, Home/End
 * jump to the first/last visible node (roving tabindex).
 */
const JsonView = forwardRef<HTMLSpanElement, JsonViewProps>(
    (
        {
            data,
            defaultExpandDepth = 1,
            highlightPattern = null,
            className,
            'data-version': dataVersion = 'v1',
            ...rest
        },
        ref,
    ) => {
        const [expanded, setExpanded] = useState<Set<string>>(() => {
            const acc = new Set<string>();
            collectDefaultExpanded(data, ROOT_PATH, 0, defaultExpandDepth, acc);
            return acc;
        });
        const [focusedPath, setFocusedPath] = useState<string>(ROOT_PATH);
        const nodeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
        const isFirstRender = useRef(true);
        const isFirstFocusEffect = useRef(true);

        // Recompute default expand state when the data itself (or the requested
        // depth) changes — the lazy useState initializer only runs once.
        useEffect(() => {
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }
            const acc = new Set<string>();
            collectDefaultExpanded(data, ROOT_PATH, 0, defaultExpandDepth, acc);
            setExpanded(acc);
            setFocusedPath(ROOT_PATH);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [data, defaultExpandDepth]);

        // Move real DOM focus to the roving-tabindex target *after* the state
        // update has committed. Doing this synchronously inside the keydown/
        // click handler (before React re-renders) fires a nested native
        // "focus" event mid-render and drops the pending update — deferring
        // to an effect keyed on `focusedPath` sidesteps that entirely. Skips
        // the very first render so mounting never steals page focus.
        useEffect(() => {
            if (isFirstFocusEffect.current) {
                isFirstFocusEffect.current = false;
                return;
            }
            nodeRefs.current.get(focusedPath)?.focus();
        }, [focusedPath]);

        const toggleNode = useCallback((path: string) => {
            setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                return next;
            });
        }, []);

        const registerRef = useCallback((path: string, el: HTMLSpanElement | null) => {
            if (el) {
                nodeRefs.current.set(path, el);
            } else {
                nodeRefs.current.delete(path);
            }
        }, []);

        const focusPath = useCallback((path: string) => {
            setFocusedPath(path);
        }, []);

        const handleTreeKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
            const { key } = event;
            const isNavKey = key === 'ArrowUp' || key === 'ArrowDown'
                || key === 'ArrowLeft' || key === 'ArrowRight'
                || key === 'Home' || key === 'End';
            const isToggleKey = key === 'Enter' || key === ' ';
            if (!isNavKey && !isToggleKey) return;

            if (isToggleKey) {
                const node = getValueAtPath(data, focusedPath);
                if (node !== undefined && isContainer(node) && getEntries(node).length > 0) {
                    event.preventDefault();
                    toggleNode(focusedPath);
                }
                return;
            }

            const visible: string[] = [];
            collectVisiblePaths(data, ROOT_PATH, expanded, visible);
            const currentIndex = visible.indexOf(focusedPath);

            event.preventDefault();
            if (key === 'ArrowUp' || key === 'ArrowLeft') {
                focusPath(visible[Math.max(0, currentIndex - 1)] ?? ROOT_PATH);
            } else if (key === 'ArrowDown' || key === 'ArrowRight') {
                focusPath(visible[Math.min(visible.length - 1, currentIndex + 1)] ?? ROOT_PATH);
            } else if (key === 'Home') {
                focusPath(visible[0] ?? ROOT_PATH);
            } else if (key === 'End') {
                focusPath(visible[visible.length - 1] ?? ROOT_PATH);
            }
        };

        return (
            <span
                {...rest}
                className={cn(styles.wrapper, className)}
                data-oxobz-json-view=""
                data-version={dataVersion}
                ref={ref}
            >
                <span
                    aria-label="JSON"
                    className={styles.tree}
                    onKeyDown={handleTreeKeyDown}
                    role="tree"
                >
                    <JsonNode
                        depth={0}
                        expanded={expanded}
                        focusedPath={focusedPath}
                        highlightPattern={highlightPattern}
                        isArrayItem={false}
                        keyName={undefined}
                        onFocusPath={setFocusedPath}
                        onToggle={toggleNode}
                        path={ROOT_PATH}
                        posinset={1}
                        registerRef={registerRef}
                        setsize={1}
                        value={data}
                    />
                </span>
            </span>
        );
    },
);

JsonView.displayName = 'JsonView';

export { JsonView };
