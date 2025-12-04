import type { AstroIntegration } from "astro";
import rehypeGlightboxImages from "./rehype-glightbox-images";
import buildInitClient from "./client/init";
import type { PhotosuiteOptions } from "./types";

export default function astroPhotosuite(options: PhotosuiteOptions = {}): AstroIntegration {
  const selector = options.selector ?? "a.glightbox";
  const gallery = options.gallery ?? "markdown";
  const lightbox = options.lightbox ?? true;
  const imgDescriptions = (options as any).imgDescriptions ?? options.figcaption ?? true;
  const initClient = buildInitClient({ selector, gallery, lightbox, figcaption: imgDescriptions });

  return {
    name: "astro-photosuite",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript }) => {
        const existing = config.markdown?.rehypePlugins ?? [];
        updateConfig({
          markdown: {
            rehypePlugins: [...existing, [rehypeGlightboxImages, { lightbox, imgDescriptions, figcaption: imgDescriptions, gallery }]]
          }
        });
        injectScript("head-inline", initClient);
        if (lightbox) injectScript("page-ssr", 'import "astro-photosuite/dist/styles-lightbox.css";');
        if (imgDescriptions) injectScript("page-ssr", 'import "astro-photosuite/dist/styles-img-descriptions.css";');
      }
    }
  };
}
