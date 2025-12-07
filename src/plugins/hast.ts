import type { Element } from "hast";

export const isElement = (n: unknown, name?: string): n is Element =>
  !!n && (n as any).type === "element" && (!name || (n as any).tagName === name);

export const isAnchor = (n: unknown): n is Element => isElement(n, "a");

export const isFigure = (n: unknown): n is Element => isElement(n, "figure");

