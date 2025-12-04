# astro-photosuite

GLightbox-driven lightbox integration for Astro that automatically wraps Markdown images and optionally renders bottom image descriptions.

## Install

```
npx astro add astro-photosuite
```

Or manually:

```
npm i astro-photosuite
```

Then in `astro.config.*`:

```
import { defineConfig } from 'astro/config'
import photosuite from 'astro-photosuite'

export default defineConfig({
  integrations: [photosuite()]
})
```

## Options

- `selector`: CSS selector used to initialize GLightbox. Default: `a.glightbox`.
- `gallery`: Value for `data-gallery` when missing. Default: `markdown`.
- `lightbox`: Enable/disable GLightbox behavior entirely. Default: `true`.
- `imgDescriptions`: Enable/disable automatic bottom image descriptions (rendered via `<figcaption>`). Default: `true`.

## What it does

- Adds a rehype plugin that wraps standalone `<img>` elements in Markdown with `<a class="glightbox" href="...">` when lightbox is enabled.
- Optionally wraps images with `<figure>` and a bottom `<figcaption>` overlay when `imgDescriptions` is enabled.
- Re-initializes GLightbox after Astro view transitions. GLightbox assets (CSS/JS) are no longer auto-loaded by this plugin — include them yourself in your layout.
- Ships small CSS tweaks that are auto-injected at runtime (lightbox UI adjustments and bottom image descriptions).

### Examples

Disable lightbox but keep descriptions:

```
export default defineConfig({
  integrations: [photosuite({ lightbox: false, imgDescriptions: true })]
})
```

Disable descriptions but keep lightbox:

```
export default defineConfig({
  integrations: [photosuite({ lightbox: true, imgDescriptions: false })]
})
```
