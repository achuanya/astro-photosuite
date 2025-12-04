import type { AstroIntegration } from "astro";
import glightboxPlugin from "./plugins/glightbox";
import imageAltsPlugin from "./plugins/imageAlts";
import imageUrlPlugin from "./plugins/imageUrl";
import buildInitClient from "./init";
import type { PhotosuiteOptions } from "./types";

export default function astroPhotosuite(options: PhotosuiteOptions = {}): AstroIntegration {
  const selector = options.selector ?? "a.glightbox";
  const gallery = options.gallery ?? "markdown";
  const glightbox = options.glightbox ?? true;
  const imageAlts = options.imageAlts ?? true;
  const imageBase = options.imageBase;
  const imageDir = options.imageDir ?? "imageDir";
  const fileDir = options.fileDir ?? false;
  const initClient = buildInitClient({ selector, gallery, glightbox });

  return {
    name: "astro-photosuite",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript }) => {
        const existing = config.markdown?.rehypePlugins ?? [];
        updateConfig({
          markdown: {
            rehypePlugins: [
              ...existing,
              [imageUrlPlugin, { imageBase, imageDir, fileDir }],
              [glightboxPlugin, { glightbox, gallery }],
              [imageAltsPlugin, { imageAlts }]
            ]
          }
        });
        injectScript("head-inline", initClient);
        if (glightbox) injectScript("page-ssr", 'import "astro-photosuite/dist/glightbox.css";');
        if (imageAlts) injectScript("page-ssr", 'import "astro-photosuite/dist/image-alts.css";');
      }
    }
  };
}