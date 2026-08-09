# @oxobz/ui

React design system components, styled after [Geist](https://vercel.com/geist).
66 components, CSS Modules, no runtime CSS-in-JS.

> **Pre-1.0.** The public API still changes between minor versions while
> components are verified against the Geist reference. Pin an exact version if
> that matters to you.

## Install

```bash
npm install @oxobz/ui
```

`react` and `react-dom` (>= 18) are peer dependencies — the rest, including
[`@oxobz/icons`](https://www.npmjs.com/package/@oxobz/icons), installs
automatically.

## Usage

Import the stylesheet **once**, at the root of your app. Without it the
components render unstyled — all values live in CSS custom properties.

```tsx
import '@oxobz/ui/styles';
import { Button, Badge, Note, NoteContent } from '@oxobz/ui';

function App() {
  return (
    <>
      <Button variant="secondary">Deploy</Button>
      <Badge variant="green">Ready</Badge>
      <Note variant="warning">
        <NoteContent>Double-check the region.</NoteContent>
      </Note>
    </>
  );
}
```

## Theming

Light is the default (`:root`); dark is a class on a wrapping element.
`ThemeProvider` handles the switch and persistence:

```tsx
import { ThemeProvider } from '@oxobz/ui';

<ThemeProvider>{children}</ThemeProvider>;
```

To do it yourself, put `.dark-theme` on `<html>` or any ancestor.

## Fonts

The stylesheet self-hosts **Geist Sans** and **Geist Mono** as `woff2` and
declares them via `@font-face` — no network request to a font CDN, nothing to
configure. Both are licensed under the SIL Open Font License; the full text
ships in `dist/tokens/fonts/GEIST-FONT-LICENSE.txt`.

## Server Components

Interactive components carry the `"use client"` directive, so they work in the
Next.js App Router without `transpilePackages`. Purely presentational ones stay
server-renderable.

## License

MIT — see [LICENSE](./LICENSE). The bundled fonts are OFL, as noted above.
