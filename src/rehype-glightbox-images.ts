import type { Plugin } from "unified";
import type { Root, Element } from "hast";

const rehypeGlightboxImages: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);
    const isAnchor = (n: unknown): n is Element => isElement(n, "a");
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
          ...(alt ? { "data-title": alt } : {})
        },
        children: [node]
      };
      (parent.children as any[])[index] = a;
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
