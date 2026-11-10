import { useEffect } from 'react';

/*
 * Page scroll lock, taken as is from the production bundle (chunk
 * 2h38obwtw-sfa.js). It is reference counted, so several surfaces on one page
 * do not undo each other. While locked it writes inline styles on <html>:
 * `overflow: clip`, `border-right: <scrollbar width>px solid transparent` and
 * `scrollbar-width: none` (which drops the reserved scrollbar gutter, so the
 * page gets the full viewport width), and `overflow: clip` on <body>. The
 * inline values that were there before are restored on unlock.
 *
 * Production runs it for the Calendar's mobile drawer and for the command
 * menu. For the command menu this was measured on the live page on
 * 10 Nov 2026: with the search dialog open, <html> carries exactly
 * `overflow: clip; border-right: 0px solid transparent; scrollbar-width: none;`
 * and <body> carries `overflow: clip`. A Radix context menu, by contrast,
 * leaves <html> untouched and the gutter stays reserved.
 */
let scrollLockCount = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedHtmlBorderRight = '';
let savedHtmlScrollbarWidth = '';

export function useScrollLock(active: boolean): void {
    useEffect(() => {
        if (!active) return;
        if (scrollLockCount === 0) {
            const html = document.documentElement;
            const body = document.body;
            savedBodyOverflow = body.style.overflow;
            savedHtmlOverflow = html.style.overflow;
            savedHtmlBorderRight = html.style.borderRight;
            savedHtmlScrollbarWidth = html.style.getPropertyValue('scrollbar-width');
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            body.style.overflow = 'clip';
            html.style.overflow = 'clip';
            html.style.borderRight = `${scrollbarWidth}px solid transparent`;
            html.style.setProperty('scrollbar-width', 'none');
        }
        scrollLockCount += 1;

        return () => {
            scrollLockCount -= 1;
            if (scrollLockCount === 0) {
                const html = document.documentElement;
                const body = document.body;
                body.style.overflow = savedBodyOverflow;
                html.style.overflow = savedHtmlOverflow;
                html.style.borderRight = savedHtmlBorderRight;
                html.style.setProperty('scrollbar-width', savedHtmlScrollbarWidth);
            }
        };
    }, [active]);
}

