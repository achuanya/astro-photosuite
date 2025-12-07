import type { Plugin } from "unified";
import type { Root, Element } from "hast";

export interface ImageAltsOptions {
  imageAlts?: boolean;
}

const imageAlts: Plugin<[ImageAltsOptions?], Root> = (opts = {}) => {
  const enabled = opts.imageAlts ?? true;
  return (tree: Root) => {
    if (!enabled) return;
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);
    const isFigure = (n: unknown): n is Element => isElement(n, "figure");
    const getImgAlt = (node: Element): string => {
      if (isElement(node, "img")) return String((node.properties as any)?.alt || "").trim();
      const children = node.children || [];
      for (const c of children as any[]) {
        if (isElement(c, "img")) return String((c.properties as any)?.alt || "").trim();
      }
      return "";
    };
    const wrapWithFigure = (node: Element, parent: Element, index: number) => {
      const altText = getImgAlt(node);
      const figcaption: Element = {
        type: "element",
        tagName: "figcaption",
        properties: { className: ["photosuite-figcaption"] },
        children: [{ type: "text", value: altText } as any]
      };
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: { className: ["photosuite-figure"] },
        children: altText ? [node, figcaption] : [node]
      };
      (parent.children as any[])[index] = figure;
    };
    const walk = (node: any, parent: any = null) => {
      if (!node) return;
      const children = (node as any).children;
      if (isElement(node) && parent && !isFigure(parent)) {
        if (isElement(node, "img") || isElement(node, "a")) {
          const index = parent.children.indexOf(node);
          wrapWithFigure(node as Element, parent as Element, index);
          return;
        }
      }
      if (Array.isArray(children)) {
        for (const child of children) walk(child, node);
      }
    };
    walk(tree);
  };
};

export default imageAlts;
