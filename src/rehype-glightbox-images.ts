import type { Plugin } from "unified";
import type { Root, Element } from "hast";

export interface RehypeGlightboxOptions {
  lightbox?: boolean;
  imgDescriptions?: boolean;
  figcaption?: boolean;
  gallery?: string;
}

const rehypeGlightboxImages: Plugin<[RehypeGlightboxOptions?], Root> = (opts = {}) => {
  const lightbox = opts.lightbox ?? true;
  const imgDescriptionsEnabled = (opts as any).imgDescriptions ?? opts.figcaption ?? true;
  const gallery = opts.gallery ?? "markdown";
  return (tree: Root) => {
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);
    const isAnchor = (n: unknown): n is Element => isElement(n, "a");
    const wrapImage = (node: Element, parent: Element, index: number) => {
      const src = String((node.properties as any)?.src || "");
      if (!src) return;
      const alt = String((node.properties as any)?.alt || "");
      let replacement: Element | null = null;
      if (lightbox) {
        const a: Element = {
          type: "element",
          tagName: "a",
          properties: {
            href: src,
            className: ["glightbox"],
            "data-gallery": gallery,
            ...(alt ? { "data-title": alt } : {})
          },
          children: [node]
        };
        if (imgDescriptionsEnabled) {
          const figcaption: Element = {
            type: "element",
            tagName: "figcaption",
            properties: { className: ["aps-figcaption"] },
            children: alt ? [{ type: "text", value: alt }] : []
          };
          const figure: Element = {
            type: "element",
            tagName: "figure",
            properties: { className: ["aps-figure"] },
            children: [a, figcaption]
          };
          replacement = figure;
        } else {
          replacement = a;
        }
      } else if (imgDescriptionsEnabled) {
        const figcaption: Element = {
          type: "element",
          tagName: "figcaption",
          properties: { className: ["aps-figcaption"] },
          children: alt ? [{ type: "text", value: alt }] : []
        };
        const figure: Element = {
          type: "element",
          tagName: "figure",
          properties: { className: ["aps-figure"] },
          children: [node, figcaption]
        };
        replacement = figure;
      }
      if (replacement) (parent.children as any[])[index] = replacement;
    };
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
