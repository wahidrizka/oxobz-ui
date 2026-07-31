import '@testing-library/jest-dom/vitest';

/**
 * jsdom tidak mengimplementasikan ResizeObserver. cmdk (`Command.List`) memakainya
 * untuk mengukur tinggi list, jadi tanpa polyfill ini setiap test yang merender
 * CommandMenu gagal dengan `ReferenceError: ResizeObserver is not defined`.
 * Stub no-op sudah cukup: yang diuji adalah markup dan perilaku filter, bukan
 * pengukuran tinggi (yang memang tidak ada di jsdom).
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
}

/**
 * jsdom juga tidak punya Element.scrollIntoView. cmdk memanggilnya untuk
 * menggulirkan item terpilih ke dalam pandangan setiap kali seleksi berubah.
 */
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
}
