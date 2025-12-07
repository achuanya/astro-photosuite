import type { Plugin } from "unified";
import type { Root, Element } from "hast";
import { isElement } from "./hast";

export interface ImageUrlOptions {
  imageBase?: string;
  imageDir?: string;
  fileDir?: boolean;
}

const imageUrl: Plugin<[ImageUrlOptions?], Root> = (opts = {}) => {
  const base = opts.imageBase;
  const key = opts.imageDir ?? "imageDir";
  const useFileDir = opts.fileDir ?? false;
  const join2 = (a: string, b: string) => {
    const aa = a.endsWith("/") ? a.slice(0, -1) : a;
    const bb = b.startsWith("/") ? b.slice(1) : b;
    return aa + "/" + bb;
  };
  const join = (...parts: string[]) => parts.reduce((acc, cur) => (acc ? join2(acc, cur) : cur), "");
  const isShort = (s: string) => {
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return false;
    if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return false;
    return true;
  };
  const basenameNoExt = (p: string) => {
    if (!p) return "";
    const s = p.split(/[\\/]/).pop() || "";
    const i = s.lastIndexOf(".");
    return i > 0 ? s.slice(0, i) : s;
  };
  return (tree: Root, file?: any) => {
    const rewrite = (node: Element) => {
      let src = String((node.properties as any)?.src || "");
      const fm = (file as any)?.data?.astro?.frontmatter || {};
      const dirFm = fm ? String(fm[key] || "") : "";
      const fname = basenameNoExt(((file as any)?.path || (file as any)?.history?.[0] || "") as string);
      const dir = useFileDir ? fname : dirFm;
      if (base && isShort(src)) src = dir ? join(base, dir, src) : join(base, src);
      (node.properties as any).src = src;
    };
    const walk = (node: any) => {
      if (!node) return;
      if (isElement(node, "img")) rewrite(node as Element);
      const children = (node as any).children;
      if (Array.isArray(children)) {
        for (const child of children) walk(child);
      }
    };
    walk(tree);
  };
};

export default imageUrl;
