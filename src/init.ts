export interface InitOptions {
  selector: string;
  gallery: string;
  glightbox: boolean;
  glightboxOptions?: Record<string, unknown>;
}

export default function buildInitClient(opts: InitOptions): string {
  const { selector, gallery, glightbox, glightboxOptions = {} } = opts;
  const userOptsJson = JSON.stringify(glightboxOptions ?? {});
  return `
    (function(){
      var glightbox = ${JSON.stringify(glightbox)};
      var retry = null;
      var userOpts = ${userOptsJson};
      var selector = '${selector}';
      if (userOpts && typeof userOpts.selector === 'string' && userOpts.selector.trim()) selector = userOpts.selector;
      function ensure(){
        if (window.__glightboxInstance && window.__glightboxInstance.destroy) window.__glightboxInstance.destroy();
        if (typeof window.GLightbox === 'function') {
          var finalOpts = Object.assign({}, (userOpts || {}), { selector: selector });
          window.__glightboxInstance = window.GLightbox(finalOpts);
        }
      }
      function wait(){
        if (typeof window.GLightbox === 'function') { ensure(); return; }
        if (retry) return;
        var tries = 0;
        retry = setInterval(function(){
          if (typeof window.GLightbox === 'function') { clearInterval(retry); retry = null; ensure(); }
          else if (++tries > 100) { clearInterval(retry); retry = null; }
        }, 50);
      }
      function reinit(){
        if (glightbox) {
          var anchors = document.querySelectorAll(selector);
          if (anchors.length) {
            anchors.forEach(function(a){
              var img = a.querySelector('img');
              if (!img) return;
              var finalSrc = img.currentSrc || img.src;
              if (finalSrc && a.getAttribute('href') !== finalSrc) a.setAttribute('href', finalSrc);
              var alt = img.getAttribute('alt');
              if (alt && !a.dataset.title) a.dataset.title = alt;
              if (!a.dataset.gallery) a.dataset.gallery = '${gallery}';
            });
          }
          if (typeof window.GLightbox === 'function') ensure(); else wait();
        }
      }
      document.addEventListener('astro:after-swap', reinit);
      if (document.readyState === 'complete' || document.readyState === 'interactive') { reinit(); if (glightbox) wait(); }
      else document.addEventListener('DOMContentLoaded', function(){ reinit(); if (glightbox) wait(); });
    })();
  `;
}
