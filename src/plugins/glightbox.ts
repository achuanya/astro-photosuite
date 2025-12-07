import type { Plugin } from "unified";
import type { Root, Element } from "hast";
import { isElement, isAnchor } from "./hast";

export interface GlightboxOptions {
  glightbox?: boolean;
  gallery?: string;
}

const glightbox: Plugin<[GlightboxOptions?], Root> = (opts = {}) => {
  const enabled = opts.glightbox ?? true;
  const gallery = opts.gallery ?? "markdown";
  return (tree: Root) => {
    if (!enabled) return;
    const wrap = (node: Element, parent: Element, index: number) => {
      const src = String((node.properties as any)?.src || "");
      if (!src) return;
      const altText = String((node.properties as any)?.alt || "").trim();
      const a: Element = {
        type: "element",
        tagName: "a",
        properties: {
          href: src,
          className: ["glightbox"],
          "data-gallery": gallery,
          ...(altText ? { "data-title": altText } : {})
        },
        children: [node]
      };
      (parent.children as any[])[index] = a;
    };
    const walk = (node: any, parent: any = null) => {
      if (!node) return;
      if (isElement(node, "img") && parent && !isAnchor(parent)) {
        const index = parent.children.indexOf(node);
        wrap(node as Element, parent as Element, index);
        return;
      }
      const children = (node as any).children;
      if (Array.isArray(children)) {
        for (const child of children) walk(child, node);
      }
    };
    walk(tree);
  };
};

export default glightbox;

export interface GlightboxClientInitOptions {
  selector: string;
  gallery: string;
  glightbox: boolean;
  glightboxOptions?: Record<string, unknown>;
}

export function buildGlightboxClient(opts: GlightboxClientInitOptions): string {
  const { selector, gallery, glightbox, glightboxOptions = {} } = opts as any;
  const userOptsJson = JSON.stringify(glightboxOptions ?? {});
  return `
    (function(){
      var glightbox = ${JSON.stringify(glightbox)};
      var retry = null;
      var userOpts = ${userOptsJson};
      var selector = '${selector}';
      if (userOpts && typeof userOpts.selector === 'string' && userOpts.selector.trim()) selector = userOpts.selector;
      function ensure(){
        if (window.__glightboxInstance && window.__glightboxInstance.destroy) window.__glightboxInstance.destroy();
        if (typeof window.GLightbox === 'function') {
          var finalOpts = Object.assign({}, (userOpts || {}), { selector: selector });
          window.__glightboxInstance = window.GLightbox(finalOpts);
        }
      }
      function wait(){
        if (typeof window.GLightbox === 'function') { ensure(); return; }
        if (retry) return;
        var tries = 0;
        retry = setInterval(function(){
          if (typeof window.GLightbox === 'function') { clearInterval(retry); retry = null; ensure(); }
          else if (++tries > 100) { clearInterval(retry); retry = null; }
        }, 50);
      }
      function reinit(){
        if (glightbox) {
          var anchors = document.querySelectorAll(selector);
          if (anchors.length) {
            anchors.forEach(function(a){
              var img = a.querySelector('img');
              if (!img) return;
              var finalSrc = img.currentSrc || img.src;
              if (finalSrc && a.getAttribute('href') !== finalSrc) a.setAttribute('href', finalSrc);
              var alt = img.getAttribute('alt');
              if (alt && !a.dataset.title) a.dataset.title = alt;
              if (!a.dataset.gallery) a.dataset.gallery = '${gallery}';
            });
          }
          if (typeof window.GLightbox === 'function') ensure(); else wait();
        }
      }
      document.addEventListener('astro:after-swap', reinit);
      if (document.readyState === 'complete' || document.readyState === 'interactive') { reinit(); if (glightbox) wait(); }
      else document.addEventListener('DOMContentLoaded', function(){ reinit(); if (glightbox) wait(); });
    })();
  `;
}
