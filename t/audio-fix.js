/* audio-fix.js — sab invite templates ke liye shared nasheed fix.
   Masla: tap ke baad form/data ka message aane par audio ka src dobara set/load hota tha,
   jis se chalta hua play() cancel ho jata tha. Yeh script:
   1) same src dobara set / load hone par audio reset nahi hone deta
   2) agar tap ke baad audio kisi wajah se reload ho jaye, to ready hote hi dobara chala deta hai */
(function () {
  var bgm = document.getElementById('bgm') || document.querySelector('audio');
  if (!bgm || bgm.__acFixed) return;
  bgm.__acFixed = true;

  var srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  var origLoad = bgm.load;
  var lastLoaded = '';

  // 1a) same src dobara set karne par kuch nahi karo
  try {
    Object.defineProperty(bgm, 'src', {
      configurable: true,
      get: function () { return srcDesc.get.call(this); },
      set: function (v) {
        var next = new URL(v, location.href).href;
        if (next === srcDesc.get.call(this)) return;
        srcDesc.set.call(this, v);
      }
    });
  } catch (e) {}

  // 1b) same src par load() dobara chalne se rokho
  bgm.load = function () {
    var cur = srcDesc.get.call(this);
    if (cur && cur === lastLoaded && !this.error) return;
    lastLoaded = cur;
    return origLoad.call(this);
  };

  // 2) tap ke baad reload ho jaye to dobara chala do
  function tapped() {
    var intro = document.getElementById('intro');
    return !intro || intro.classList.contains('playing') || intro.classList.contains('fade');
  }
  var fade = 0;
  bgm.addEventListener('canplay', function () {
    if (!tapped() || !bgm.paused || bgm.muted || document.hidden) return;
    bgm.volume = 0;
    var p = bgm.play();
    if (p && p.then) p.then(function () {
      var v = 0; clearInterval(fade);
      fade = setInterval(function () { v = Math.min(0.7, v + 0.035); bgm.volume = v; if (v >= 0.7) clearInterval(fade); }, 100);
    }).catch(function () {});
  });
})();
