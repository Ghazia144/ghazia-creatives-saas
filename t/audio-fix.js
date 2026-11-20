/* audio-fix.js — sab invite templates ke liye shared nasheed fix.

   1) PREVIEW MODE (?preview=order ya ?preview=2): koi bhi <audio> kabhi play nahi hota
      aur nasheed ki file download bhi nahi hoti (form ka preview tez rehta hai).
      Pehle masla ye tha ke jin designs mein #intro nahi hai wahan canplay par music
      khud chal parta tha, preview mein bhi.
   2) Same src dobara set / load hone par audio reset nahi hota (tap ke baad play cancel hone ka fix).
   3) Asli invite mein: tap ke baad agar audio reload ho jaye to ready hote hi dobara chal parta hai. */
(function () {
  var pm = new URLSearchParams(location.search).get('preview');
  var IS_PREVIEW = pm === '2' || pm === 'order';

  /* ---------- PREVIEW: audio bilkul band ---------- */
  if (IS_PREVIEW) {
    var proto = HTMLMediaElement.prototype;
    var origPlay = proto.play;
    var srcDescP = Object.getOwnPropertyDescriptor(proto, 'src');

    // audio elements ka play() kuch nahi karta (video ka normal rehta hai)
    proto.play = function () {
      if (this.tagName === 'AUDIO') { try { this.pause(); } catch (e) {} return Promise.resolve(); }
      return origPlay.apply(this, arguments);
    };

    // audio ka src set karne se download shuru hota hai, preview mein usay roko
    if (srcDescP && srcDescP.set) {
      Object.defineProperty(proto, 'src', {
        configurable: true,
        enumerable: srcDescP.enumerable,
        get: srcDescP.get,
        set: function (v) {
          if (this.tagName === 'AUDIO') return;
          srcDescP.set.call(this, v);
        }
      });
    }

    var killAudio = function () {
      document.querySelectorAll('audio').forEach(function (a) {
        try { a.preload = 'none'; a.autoplay = false; a.pause(); } catch (e) {}
      });
    };
    killAudio();
    return;
  }

  /* ---------- ASLI INVITE ---------- */
  var bgm = document.getElementById('bgm') || document.querySelector('audio');
  if (!bgm || bgm.__acFixed) return;
  bgm.__acFixed = true;

  // user ne page par kab touch/click kiya (autoplay policy ke liye zaroori)
  var userTouched = false;
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function () { userTouched = true; }, { once: true, passive: true, capture: true });
  });

  var srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  var origLoad = bgm.load;
  var lastLoaded = '';

  // 2a) same src dobara set karne par kuch nahi karo
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

  // 2b) same src par load() dobara chalne se rokho
  bgm.load = function () {
    var cur = srcDesc.get.call(this);
    if (cur && cur === lastLoaded && !this.error) return;
    lastLoaded = cur;
    return origLoad.call(this);
  };

  // 3) tap ke baad reload ho jaye to dobara chala do
  function tapped() {
    var intro = document.getElementById('intro');
    if (intro) return intro.classList.contains('playing') || intro.classList.contains('fade');
    return userTouched; // jin designs mein #intro nahi, wahan sirf asli tap ke baad
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
