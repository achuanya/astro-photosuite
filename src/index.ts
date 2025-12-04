import type { AstroIntegration } from "astro";
import rehypeGlightboxImages from "./rehype-glightbox-images";
import buildInitClient from "./client/init";
import type { PhotosuiteOptions } from "./types";

export default function astroPhotosuite(options: PhotosuiteOptions = {}): AstroIntegration {
  const selector = options.selector ?? "a.glightbox";
  const gallery = options.gallery ?? "markdown";
  const lightbox = options.lightbox ?? true;
  const imageAlts = options.imageAlts ?? true;
  const imageBase = options.imageBase;
  const imageDir = options.imageDir ?? "imageDir";
  const fileDir = options.fileDir ?? false;
  const initClient = buildInitClient({ selector, gallery, lightbox });

  return {
    name: "astro-photosuite",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript }) => {
        const existing = config.markdown?.rehypePlugins ?? [];
        updateConfig({
          markdown: {
            rehypePlugins: [...existing, [rehypeGlightboxImages, { lightbox, imageAlts, gallery, imageBase, imageDir, fileDir }]]
          }
        });
        injectScript("head-inline", initClient);
        if (lightbox) injectScript("page-ssr", 'import "astro-photosuite/dist/glightbox.css";');
        if (imageAlts) injectScript("page-ssr", 'import "astro-photosuite/dist/image-alts.css";');
      }
    }
  };
}
