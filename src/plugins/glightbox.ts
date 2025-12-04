import type { Plugin } from "unified";
import type { Root, Element } from "hast";

export interface GlightboxOptions {
  glightbox?: boolean;
  gallery?: string;
}

const glightbox: Plugin<[GlightboxOptions?], Root> = (opts = {}) => {
  const enabled = opts.glightbox ?? true;
  const gallery = opts.gallery ?? "markdown";
  return (tree: Root) => {
    if (!enabled) return;
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);
    const isAnchor = (n: unknown): n is Element => isElement(n, "a");
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

