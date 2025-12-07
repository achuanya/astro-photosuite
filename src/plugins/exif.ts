export default function buildExifClient(): string {
  return `
    (function(){
      function ensure(){
        var nodes = document.querySelectorAll('.photosuite-figure, a.glightbox');
        nodes.forEach(function(p){
          var has = p.querySelector('.photosuite-exif');
          if (has) return;
          var img = p.querySelector('img');
          if (!img) return;
          if (p.tagName && p.tagName.toLowerCase() === 'a' && !p.classList.contains('photosuite-exif-parent')) {
            p.classList.add('photosuite-exif-parent');
          }
          var bar = document.createElement('div');
          bar.className = 'photosuite-exif';
          p.appendChild(bar);
        });
      }
      document.addEventListener('astro:after-swap', ensure);
      if (document.readyState === 'complete' || document.readyState === 'interactive') ensure();
      else document.addEventListener('DOMContentLoaded', ensure);
    })();
  `;
}