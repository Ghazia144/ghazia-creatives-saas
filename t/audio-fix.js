/* ===== MOBILE DEMO BUTTON =====
   Desktop par har design apna "Make This Invite Yours" button khud banata hai (phone-frame wale wrapper mein).
   Mobile par wo wrapper chalta hi nahi, isliye button nahi tha. Yahan mobile ke liye wohi button neeche beech mein lagta hai.
   Sirf tab jab demo seedha khula ho: asli invite ya form ka preview (iframe) mein ye kabhi nahi aata. */
(function () {
  try {
    if (window.self !== window.top) return;                               // iframe = asli invite / preview
    if (/[?&](full|nomockup)\b/.test(location.search)) return;
    var isDesktop = innerWidth > 820 && matchMedia('(pointer:fine)').matches;
    if (isDesktop) return;                                                // desktop ka button design khud banata hai
    var m = location.pathname.match(/\/t\/([^\/]+)\//);
    if (!m) return;
    function add() {
      if (document.getElementById('mobileDemoCta')) return;
      var a = document.createElement('a');
      a.id = 'mobileDemoCta';
      a.href = '/order.html?design=' + encodeURIComponent(m[1]);
      a.textContent = 'Make This Invite Yours';
      a.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));' +
        'z-index:2147483000;background:#C9A15A;color:#2B1218;font:600 12px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
        'letter-spacing:.08em;text-transform:uppercase;text-decoration:none;white-space:nowrap;padding:13px 22px;border-radius:30px;' +
        'border:1px solid rgba(255,255,255,.35);box-shadow:0 4px 20px rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent;';
      document.body.appendChild(a);
    }
    if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  } catch (e) {}
})();

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