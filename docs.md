# GLightbox Integration Documentation

This document describes the modular **GLightbox** integration for Astro Markdown images. Images open in a lightbox gallery when clicked, and optionally show a bottom caption from the image alt text.

## Overview

The integration is split into three rehype plugins and runtime scripts/styles:
1. **Image URL** (`src/plugins/imageUrl.ts`): Rewrites short image `src` using `imageBase`, `imageDir` Frontmatter or `fileDir`.
2. **GLightbox** (`src/plugins/glightbox.ts`): Wraps standalone `<img>` into `<a class="glightbox">` with `href`, `data-gallery` and optional `data-title`.
3. **Image Alts** (`src/plugins/imageAlts.ts`): Adds `<figure>` with bottom `<figcaption>` built from image `alt` when enabled.
4. **Astro Configuration**: Registers the plugins in `astro.config.*` via the integration.
5. **Layout Update**: Include GLightbox JS from CDN; integration auto-injects CSS and client init script.

---

## 1. Rehype Plugins

- `src/plugins/imageUrl.ts`: 重写短链接图片地址，支持 `imageBase`、`imageDir`、`fileDir`。
- `src/plugins/glightbox.ts`: 将 `<img>` 包裹为 `<a class="glightbox">`，设置 `href`、`data-gallery`、`data-title`。
- `src/plugins/imageAlts.ts`: 为图片生成 `<figure>` 与底部 `<figcaption>`。

---

## 2. Astro Configuration

**File:** `astro.config.ts`

We import the custom plugin and add it to the `rehypePlugins` array in the `markdown` configuration object.

```typescript
import { defineConfig } from "astro/config";
// ... other imports
// Rehype plugin to wrap Markdown images with GLightbox-ready anchors
import rehypeGlightboxImages from "./src/rehype-glightbox-images";

// https://astro.build/config
export default defineConfig({
  // ... other config
  // Configure Markdown → HTML pipeline and syntax highlighting
  markdown: {
    remarkPlugins: [
      // ... remark plugins
    ],
    // Enable GLightbox support for images rendered from Markdown
    rehypePlugins: [imageUrl, glightbox, imageAlts],
    shikiConfig: {
      // ... shiki config
    },
  },
  // ...
});
```

---

## 3. Layout Integration

**File:** `src/layouts/Layout.astro`

In the main layout, we add the necessary CSS and JS from a CDN. We also include an inline script to initialize GLightbox. This script is robust against Astro's View Transitions (`astro:after-swap` event) and ensures that the anchor `href` always matches the currently active image source (handling responsive images).

```html
<!-- Inside <head> -->

<!-- GLightbox styles: required for the lightbox UI -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css" />

<!-- ... -->

<!-- Inside <body>, before closing tag -->

<!-- GLightbox script: exposes global GLightbox() initializer -->
<script src="https://cdn.jsdelivr.net/gh/mcstudios/glightbox/dist/js/glightbox.min.js"></script>
<!-- Initialize GLightbox for images produced by Markdown -->
<script is:inline data-astro-rerun>
    (() => {
    const init = () => {
        // Ensure each anchor points to the actual rendered image source
        const anchors = document.querySelectorAll('a.glightbox');
        if (!anchors.length) return;
        anchors.forEach(a => {
        const img = a.querySelector('img');
        if (!img) return;
        // Prefer responsive image's currentSrc; fallback to src
        const finalSrc = img.currentSrc || img.src;
        if (finalSrc && a.getAttribute('href') !== finalSrc) a.setAttribute('href', finalSrc);
        // Forward alt text as the slide title if not already set
        const alt = img.getAttribute('alt');
        if (alt && !a.dataset.title) a.dataset.title = alt;
        });
        // Recreate the lightbox after client-side navigation
        if (window.__glightboxInstance && window.__glightboxInstance.destroy) window.__glightboxInstance.destroy();
        if (typeof GLightbox === "function") {
        window.__glightboxInstance = GLightbox({
            selector: 'a.glightbox',
            touchNavigation: true,
            loop: true,
            autoplayVideos: false,
        });
        }
    };
    // Re-init after Astro view transitions and on initial load
    document.addEventListener("astro:after-swap", init);
    if (document.readyState === "complete" || document.readyState === "interactive") init();
    else document.addEventListener("DOMContentLoaded", init);
    })();
</script>
```

---

## 4. Global Styles

**File:** `src/styles/base.css`

We override some default GLightbox styles to better fit the site's theme, specifically removing excessive padding and aligning the title.

```css
/* ===== GLightbox https://github.com/biati-digital/glightbox ===== */
  .glightbox-clean .gdesc-inner {
    padding: 0 !important;
  }
  .glightbox-clean .gslide-title {
    margin-bottom: 0 !important;
    padding: 0 12px !important;
  }
```
