'use client';

import { forwardRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Command, useCommandState } from 'cmdk';
import { cn } from '../../utils/cn';
import styles from './CommandMenu.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CommandMenuItem {
    /** Visible label; also the value cmdk filters on. */
    label: string;
    /** Leading 20×20 slot. Geist uses an arrow for pages, a logo for brands. */
    icon?: ReactNode;
    /** Fired when the item is picked (click or Enter). */
    onSelect?: () => void;
    /** Extra terms the filter should match beyond `label`. */
    keywords?: string[];
}

export interface CommandMenuGroup {
    /** Heading rendered above the group. */
    heading: string;
    items: CommandMenuItem[];
}

export interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: CommandMenuGroup[];
    /** Input placeholder. Geist uses "Search...". */
    placeholder?: string;
    /** Accessible dialog title (visually hidden). */
    title?: string;
    /** Accessible dialog description (visually hidden). */
    description?: string;
    /** Rendered when the query matches nothing. Receives the current query. */
    emptyMessage?: (query: string) => ReactNode;
    className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Command palette dialog — the Ctrl/⌘+K menu.
 *
 * Built on the SAME libraries production Geist uses: `cmdk` for the command
 * root/input/list/group/item/empty (markers `cmdk-root`, `cmdk-input`, …) and
 * Radix Dialog for the modal shell (`role="dialog"`, focus guards, portal).
 *
 * Composition note — Geist does NOT use cmdk's own `Command.Dialog`: in the
 * live DOM the `<h2>`/`<p>` accessible title/description are SIBLINGS of the
 * cmdk root inside the dialog content, whereas `Command.Dialog` nests its
 * children inside the root. Radix Dialog and cmdk `Command` are therefore
 * composed by hand here, and the `cmdk-dialog` / `cmdk-overlay` marker
 * attributes are set explicitly so the DOM matches.
 *
 * Rendered DOM (verified against the live capture):
 * ```html
 * <div cmdk-overlay data-state="open" class="overlay"></div>
 * <div role="dialog" cmdk-dialog data-state="open" class="dialog"
 *      aria-labelledby aria-describedby>
 *   <h2 class="oxobz-sr-only">Command Menu</h2>
 *   <p  class="oxobz-sr-only">…</p>
 *   <div cmdk-root>
 *     <label/>
 *     <div class="inputWrapper"><div class="inputRow"><input cmdk-input/><button>Esc</button></div></div>
 *     <div cmdk-list class="list"> … groups / items / empty … </div>
 *   </div>
 * </div>
 * ```
 *
 * Behaviour that comes from the libraries (same as Geist): first item selected
 * on open, ↑/↓ moves the selection, Enter picks it, Esc and outside-click close,
 * focus is trapped and restored, body scroll is locked.
 *
 * Opening via a keyboard shortcut is the CONSUMER's job — Geist's own docs bind
 * Ctrl/⌘+K outside the component, and this component is only told `open`.
 */
const CommandMenu = forwardRef<HTMLDivElement, CommandMenuProps>(
    (
        {
            open,
            onOpenChange,
            groups,
            placeholder = 'Search...',
            title = 'Command Menu',
            description,
            emptyMessage,
            className,
        },
        ref,
    ) => {
        return (
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay cmdk-overlay="" className={styles.overlay} />
                    <Dialog.Content
                        cmdk-dialog=""
                        data-oxobz-command-menu=""
                        data-version="v1"
                        className={cn(styles.dialog, className)}
                    >
                        <Dialog.Title className="oxobz-sr-only">{title}</Dialog.Title>
                        {description ? (
                            <Dialog.Description className="oxobz-sr-only">
                                {description}
                            </Dialog.Description>
                        ) : (
                            // Radix warns when a dialog has no description; Geist always
                            // ships one, so an empty hidden node keeps parity + silence.
                            <Dialog.Description className="oxobz-sr-only" />
                        )}

                        <Command ref={ref} label={title}>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputRow}>
                                    <Command.Input className={styles.input} placeholder={placeholder} />
                                    <button
                                        type="button"
                                        className={styles.esc}
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Esc
                                    </button>
                                </div>
                            </div>

                            <Command.List className={styles.list}>
                                <Command.Empty className={styles.empty}>
                                    {emptyMessage ? <EmptyText render={emptyMessage} /> : null}
                                </Command.Empty>

                                {groups.map((group) => (
                                    <Command.Group
                                        key={group.heading}
                                        heading={group.heading}
                                        className={styles.group}
                                    >
                                        {group.items.map((item) => (
                                            <Command.Item
                                                key={item.label}
                                                value={item.label}
                                                keywords={item.keywords}
                                                className={styles.item}
                                                onSelect={item.onSelect}
                                            >
                                                {item.icon ? (
                                                    <div className={styles.itemIcon}>{item.icon}</div>
                                                ) : null}
                                                {item.label}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ))}
                            </Command.List>
                        </Command>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        );
    },
);

CommandMenu.displayName = 'CommandMenu';

/** Reads the live query out of cmdk so the empty message can quote it. */
function EmptyText({ render }: { render: (query: string) => ReactNode }) {
    // cmdk mengekspor useCommandState sebagai named export (bukan properti Command).
    const query = useCommandState((state: { search: string }) => state.search);
    return <>{render(query)}</>;
}

export { CommandMenu };
