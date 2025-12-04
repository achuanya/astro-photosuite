# GLightbox Integration Documentation

This document details the integration of **GLightbox** into the Astro project. This feature allows images in Markdown posts to be opened in a responsive lightbox gallery when clicked.

## Overview

The integration consists of four main parts:
1.  **Rehype Plugin**: A custom plugin (`rehype-glightbox-images.ts`) that automatically wraps standard Markdown images (`<img>`) inside anchor tags (`<a>`) with the specific classes and attributes required by GLightbox.
2.  **Astro Configuration**: Registering the rehype plugin in `astro.config.ts` so it processes Markdown content.
3.  **Layout Update**: Including the GLightbox CSS and JS libraries in the main `Layout.astro`, along with an initialization script that handles Astro's View Transitions.
4.  **Global Styles**: Custom CSS in `base.css` to tweak the lightbox appearance.

---

## 1. Rehype Plugin

**File:** `src/rehype-glightbox-images.ts`

This plugin traverses the HTML Abstract Syntax Tree (HAST) generated from Markdown. It finds `<img>` elements that are not already inside links and wraps them in an anchor tag with `class="glightbox"` and `data-gallery="markdown"`. It also forwards the image's `alt` text to the `data-title` attribute for the lightbox caption.

```typescript
// This rehype plugin prepares Markdown-rendered images for GLightbox.
// It finds standalone <img> elements and wraps them in
// <a class="glightbox"> anchors pointing to the image source so that
// clicks open the lightbox. It also carries the image alt text into
// GLightbox's slide title via data attributes.
// author：游钓四方（https://blog.lhasa.icu）

import type { Plugin } from "unified";
import type { Root, Element } from "hast";

/**
 * Rehype plugin: walk the HAST and wrap non-anchored images into
 * GLightbox-ready anchors belonging to the "markdown" gallery.
 */
const rehypeGlightboxImages: Plugin<[], Root> = () => {
  return (tree: Root) => {
    // Narrow an unknown node to a specific HAST element (optionally by tag name)
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);

    // Convenience guard for <a> elements
    const isAnchor = (n: unknown): n is Element => isElement(n, "a");

    // Replace an <img> with an <a class="glightbox"> that contains the image,
    // sets href to the image source, and forwards alt as the slide title.
    const wrapImage = (node: Element, parent: Element, index: number) => {
      const src = String((node.properties as any)?.src || "");
      if (!src) return;
      const alt = String((node.properties as any)?.alt || "");
      const a: Element = {
        type: "element",
        tagName: "a",
        properties: {
          href: src,
          className: ["glightbox"],
          "data-gallery": "markdown",
          ...(alt ? { "data-title": alt } : {}),
        },
        children: [node],
      };
      (parent.children as any[])[index] = a;
    };

    // Depth-first traversal: when an <img> is found and its parent is not <a>,
    // wrap it for GLightbox and stop descending into that subtree.
    const walk = (node: any, parent: any = null) => {
      if (!node) return;
      if (isElement(node, "img") && parent && !isAnchor(parent)) {
        const index = parent.children.indexOf(node);
        wrapImage(node as Element, parent as Element, index);
        return;
      }
      const children = node.children;
      if (Array.isArray(children)) {
        for (const child of children) walk(child, node);
      }
    };

    walk(tree);
  };
};

export default rehypeGlightboxImages;
```

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
    rehypePlugins: [rehypeGlightboxImages],
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
