import type { Plugin } from "unified";
import type { Root, Element } from "hast";

export interface RehypeGlightboxOptions {
  lightbox?: boolean;
  imageAlts?: boolean;
  gallery?: string;
  imageBase?: string;
  imageDir?: string;
  fileDir?: boolean;
}

const rehypeGlightboxImages: Plugin<[RehypeGlightboxOptions?], Root> = (opts = {}) => {
  const lightbox = opts.lightbox ?? true;
  const imageAltsEnabled = opts.imageAlts ?? true;
  const gallery = opts.gallery ?? "markdown";
  const base = opts.imageBase;
  const key = opts.imageDir ?? "imageDir";
  const fileDir = opts.fileDir ?? false;
  const join2 = (a: string, b: string) => {
    const aa = a.endsWith("/") ? a.slice(0, -1) : a;
    const bb = b.startsWith("/") ? b.slice(1) : b;
    return aa + "/" + bb;
  };
  const join = (...parts: string[]) => parts.reduce((acc, cur) => acc ? join2(acc, cur) : cur, "");
  const isShort = (s: string) => {
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return false;
    if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return false;
    return true;
  };
  return (tree: Root, file?: any) => {
    const isElement = (n: unknown, name?: string): n is Element =>
      !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);
    const isAnchor = (n: unknown): n is Element => isElement(n, "a");
    const wrapImage = (node: Element, parent: Element, index: number) => {
      let src = String((node.properties as any)?.src || "");
      const fm = (file as any)?.data?.astro?.frontmatter || {};
      const dirFm = fm ? String(fm[key] || "") : "";
      const fname = basenameNoExt(((file as any)?.path || (file as any)?.history?.[0] || "") as string);
      const dir = fileDir ? fname : dirFm;
      if (base && isShort(src)) src = dir ? join(base, dir, src) : join(base, src);
      (node.properties as any).src = src;
      if (!src) return;
      const altText = String((node.properties as any)?.alt || "").trim();
      let replacement: Element | null = null;
      if (lightbox) {
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
        if (imageAltsEnabled && altText) {
          const figcaption: Element = {
            type: "element",
            tagName: "figcaption",
            properties: { className: ["photosuite-figcaption"] },
            children: [{ type: "text", value: altText }]
          };
          const figure: Element = {
            type: "element",
            tagName: "figure",
            properties: { className: ["photosuite-figure"] },
            children: [a, figcaption]
          };
          replacement = figure;
        } else {
          replacement = a;
        }
      } else if (imageAltsEnabled) {
        if (altText) {
          const figcaption: Element = {
            type: "element",
            tagName: "figcaption",
            properties: { className: ["photosuite-figcaption"] },
            children: [{ type: "text", value: altText }]
          };
          const figure: Element = {
            type: "element",
            tagName: "figure",
            properties: { className: ["photosuite-figure"] },
            children: [node, figcaption]
          };
          replacement = figure;
        }
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
  const basenameNoExt = (p: string) => {
    if (!p) return "";
    const s = p.split(/[\\/]/).pop() || "";
    const i = s.lastIndexOf(".");
    return i > 0 ? s.slice(0, i) : s;
  };
