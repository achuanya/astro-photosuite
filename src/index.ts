import type { AstroIntegration } from "astro";
import rehypeGlightboxImages from "./rehype-glightbox-images";

export interface PhotosuiteOptions {
  selector?: string;
  gallery?: string;
  cssHref?: string;
  jsSrc?: string;
  lightbox?: boolean;
  figcaption?: boolean;
}

export default function astroPhotosuite(options: PhotosuiteOptions = {}): AstroIntegration {
  const selector = options.selector ?? "a.glightbox";
  const gallery = options.gallery ?? "markdown";
  const cssHref = options.cssHref ?? "https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css";
  const jsSrc = options.jsSrc ?? "https://cdn.jsdelivr.net/gh/mcstudios/glightbox/dist/js/glightbox.min.js";
  const lightbox = options.lightbox ?? true;
  const figcaption = options.figcaption ?? true;

  const initClient = `
    (function(){
      var cssHref = ${JSON.stringify(cssHref)};
      var jsSrc = ${JSON.stringify(jsSrc)};
      var lightbox = ${JSON.stringify(lightbox)};
      var figcaption = ${JSON.stringify(figcaption)};
      function ensure(tagName, attrs){
        var el = document.querySelector(tagName + '[data-astro-photosuite]');
        if (!el) {
          el = document.createElement(tagName);
          if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]);
          el.setAttribute('data-astro-photosuite','');
          document.head.appendChild(el);
        }
      }
      if (lightbox) {
        ensure('link', { rel: 'stylesheet', href: cssHref });
        ensure('script', { src: jsSrc });
      }
      function reinit(){
        if (lightbox) {
          var anchors = document.querySelectorAll('${selector}');
          if (anchors.length) {
            anchors.forEach(function(a){
              var img = a.querySelector('img');
              if (!img) return;
              var finalSrc = img.currentSrc || img.src;
              if (finalSrc && a.getAttribute('href') !== finalSrc) a.setAttribute('href', finalSrc);
              var alt = img.getAttribute('alt');
              if (alt && !a.dataset.title) a.dataset.title = alt;
              if (!a.dataset.gallery) a.dataset.gallery = '${gallery}';
              if (figcaption) {
                var p = a.parentElement;
                var figure = p && p.tagName.toLowerCase() === 'figure' ? p : null;
                if (!figure) {
                  figure = document.createElement('figure');
                  figure.className = 'aps-figure';
                  if (p) p.replaceChild(figure, a);
                  figure.appendChild(a);
                }
                var fc = figure.querySelector('figcaption');
                if (!fc) {
                  fc = document.createElement('figcaption');
                  fc.className = 'aps-figcaption';
                  figure.appendChild(fc);
                }
                if (alt) fc.textContent = alt;
              }
            });
          }
          if (window.__glightboxInstance && window.__glightboxInstance.destroy) window.__glightboxInstance.destroy();
          if (typeof window.GLightbox === 'function') {
            window.__glightboxInstance = window.GLightbox({ selector: '${selector}', touchNavigation: true, loop: true, autoplayVideos: false, zoomable: false, preload: true });
          }
        } else if (figcaption) {
          var imgs = document.querySelectorAll('img');
          if (imgs.length) {
            imgs.forEach(function(img){
              var alt = img.getAttribute('alt');
              var p = img.parentElement;
              var isAnchor = p && p.tagName.toLowerCase() === 'a';
              var target = isAnchor ? p : img;
              var parent = target.parentElement;
              var figure = parent && parent.tagName && parent.tagName.toLowerCase() === 'figure' ? parent : null;
              if (!figure) {
                figure = document.createElement('figure');
                figure.className = 'aps-figure';
                if (parent) parent.replaceChild(figure, target);
                figure.appendChild(target);
              }
              var fc = figure.querySelector('figcaption');
              if (!fc) {
                fc = document.createElement('figcaption');
                fc.className = 'aps-figcaption';
                figure.appendChild(fc);
              }
              if (alt) fc.textContent = alt;
            });
          }
        }
      }
      document.addEventListener('astro:after-swap', reinit);
      if (document.readyState === 'complete' || document.readyState === 'interactive') reinit();
      else document.addEventListener('DOMContentLoaded', reinit);
    })();
  `;

  return {
    name: "astro-photosuite",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript }) => {
        const existing = config.markdown?.rehypePlugins ?? [];
        updateConfig({
          markdown: {
            rehypePlugins: [...existing, [rehypeGlightboxImages, { lightbox, figcaption, gallery }]]
          }
        });
        injectScript("head-inline", initClient);
        injectScript("page-ssr", 'import "astro-photosuite/styles.css";');
      }
    }
  };
}
