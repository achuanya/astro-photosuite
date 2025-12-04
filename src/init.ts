export interface InitOptions {
  selector: string;
  gallery: string;
  glightbox: boolean;
}

export default function buildInitClient(opts: InitOptions): string {
  const { selector, gallery, glightbox } = opts;
  return `
    (function(){
      var glightbox = ${JSON.stringify(glightbox)};
      var retry = null;
      function ensure(){
        if (window.__glightboxInstance && window.__glightboxInstance.destroy) window.__glightboxInstance.destroy();
        if (typeof window.GLightbox === 'function') {
          window.__glightboxInstance = window.GLightbox({ selector: '${selector}', touchNavigation: true, loop: true, autoplayVideos: false, zoomable: false, preload: true });
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

