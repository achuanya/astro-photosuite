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
- `glightbox`: Enable/disable GLightbox behavior entirely. Default: `true`.
- `glightboxOptions`: Pass-through options for `GLightbox({...})`. Only `selector` is set by default; all other options are exactly as you provide.
- `imageAlts`: Enable/disable automatic bottom image descriptions (rendered via `<figcaption>`). Default: `true`.
- `exif`: Enable/disable top overlay bar (`photosuite-exif`) injection. Default: `true`.
- `imageBase`: Base URL for image short links. Default: undefined.
- `imageDir`: Frontmatter key for per-article directory segment. Default: `imageDir`.
- `fileDir`: Use the Markdown file name (without extension) as directory segment. Default: `false`.

## What it does

- Adds a rehype plugin that wraps standalone `<img>` elements in Markdown with `<a class="glightbox" href="...">` when lightbox is enabled.
- Optionally wraps images with `<figure>` and a bottom `<figcaption>` overlay when `imageAlts` is enabled.
- Re-initializes GLightbox after Astro view transitions. GLightbox assets (CSS/JS) are no longer auto-loaded by this plugin — include them yourself in your layout.
- Ships small CSS for bottom image descriptions that is auto-injected at runtime.
- Ships independent CSS for top EXIF overlay that is auto-injected when `exif` is enabled.

### Examples

Disable glightbox but keep descriptions:

```
export default defineConfig({
  integrations: [photosuite({ glightbox: false, imageAlts: true, exif: true })]
})
```

Disable descriptions but keep glightbox:

```
export default defineConfig({
  integrations: [photosuite({ glightbox: true, imageAlts: false, exif: true })]
})
```
Image short links:

```
// astro.config.*
export default defineConfig({
  integrations: [photosuite({ imageBase: 'https://cos.lhasa.icu/dist/images/', imageDir: 'imageDir' })]
})
```

In a Markdown post frontmatter:

```
---
imageDir: 2025-11-25-introducing-astro-lhasa-1-0
---

![Astro Lhasa 1.0 截图](astro-lhasa-v1-thumbnail.svg)
```

This renders from `https://cos.lhasa.icu/dist/images/2025-11-25-introducing-astro-lhasa-1-0/astro-lhasa-v1-thumbnail.svg`.

If no `imageDir` is provided in frontmatter, it renders from `https://cos.lhasa.icu/dist/images/astro-lhasa-v1-thumbnail.svg`.

Use file name as directory:

```
export default defineConfig({
  integrations: [photosuite({ imageBase: 'https://cos.lhasa.icu/dist/images/', fileDir: true })]
})
```
If the post file is `2025-11-25-introducing-astro-lhasa-1-0.md`, short links will render from `https://cos.lhasa.icu/dist/images/2025-11-25-introducing-astro-lhasa-1-0/<image-name>`.

### Customize GLightbox via `glightboxOptions`

You can configure any GLightbox option exposed by the library. We do not force default behaviors except `selector`. If you provide `selector` inside `glightboxOptions`, it overrides `selector`.

```
// astro.config.*
export default defineConfig({
  integrations: [photosuite({
    selector: 'a.glightbox',
    glightbox: true,
    glightboxOptions: {
      loop: false,
      touchNavigation: false,
      openEffect: 'zoom',
      closeEffect: 'fade',
      slideEffect: 'fade',
      moreText: '更多',
      selector: '.gallery a.glightbox'
    }
  })]
})
```

Note: only JSON-serializable options are supported inlined. Callback functions should be set directly in page scripts if needed.
