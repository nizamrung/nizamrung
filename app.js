(function () {
  'use strict';
  var D = document.body.dataset, T = +D.total, N = +D.page, RATIO = 1030 / 1429;
  var $ = function (s) { return document.querySelector(s); };
  var main = $('#main'), view = $('#view'), stage = $('#stage'), bar = $('.bar');
  var btnMode = $('#btnMode'), zin = $('#zIn'), zout = $('#zOut'), zlab = $('#zLab');
  var num = $('#num'), sel = $('#sel');
  var MIN = 1, MAX = 4, STEP = 0.5;

  function get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function put(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }

  var pref = get('nr-mode');
  var zoom = parseFloat(get('nr-zoom', true)) || 1;
  zoom = Math.max(MIN, Math.min(MAX, zoom));

  function canSpread() { return window.innerWidth >= 700; }
  function mode() {
    if (!canSpread()) return 1;
    if (pref === '1') return 1;
    if (pref === '2') return 2;
    return window.innerWidth >= 1000 ? 2 : 1;
  }
  function start(n) { return n === 1 ? 1 : (n % 2 === 0 ? n : n - 1); }
  function pages() {
    if (mode() === 1) return [N];
    var s = start(N);
    if (s === 1) return [1];
    var a = [s];
    if (s + 1 <= T) a.push(s + 1);
    return a;
  }
  function target(dir) {
    var t;
    if (mode() === 1) {
      t = N + dir;
    } else {
      var s = start(N);
      if (dir > 0) t = (s === 1) ? 2 : s + 2;
      else t = (s === 1) ? null : (s <= 2 ? 1 : s - 2);
    }
    return (t !== null && t >= 1 && t <= T) ? t : null;
  }
  function go(t) { if (t) location.href = 'page-' + t + '.html'; }

  function updateNav() {
    var ps = pages();
    var tp = target(-1), tn = target(1);
    [].forEach.call(document.querySelectorAll('.js-prev'), function (a) {
      if (tp) { a.href = 'page-' + tp + '.html'; a.classList.remove('off'); }
      else { a.removeAttribute('href'); a.classList.add('off'); }
    });
    [].forEach.call(document.querySelectorAll('.js-next'), function (a) {
      if (tn) { a.href = 'page-' + tn + '.html'; a.classList.remove('off'); }
      else { a.removeAttribute('href'); a.classList.add('off'); }
    });
    num.textContent = (ps.length > 1 ? ps[0] + '–' + ps[1] : ps[0]) + ' / ' + T;
    sel.value = 'page-' + ps[0] + '.html';
    if (canSpread()) {
      btnMode.classList.remove('hidden');
      btnMode.textContent = mode() === 2 ? 'ایک صفحہ' : 'دو صفحات';
    } else {
      btnMode.classList.add('hidden');
    }
  }

  function layout() {
    var two = mode() === 2;
    var avail = main.clientWidth - 20;
    var barH = bar.offsetHeight;
    var fitH = (window.innerHeight - barH - 24) * RATIO * (two ? 2 : 1);
    var base = two ? Math.min(avail, fitH) : Math.min(avail, 980);
    base = Math.max(base, 200);
    stage.style.width = Math.round(base * zoom) + 'px';
    if (zoom > 1) {
      view.style.height = (window.innerHeight - barH - 16) + 'px';
      view.classList.add('zoomed');
    } else {
      view.style.height = '';
      view.classList.remove('zoomed');
    }
    zlab.textContent = Math.round(zoom * 100) + '%';
    zin.disabled = zoom >= MAX;
    zout.disabled = zoom <= MIN;
  }

  function setZoom(z, fx, fy, ox, oy) {
    z = Math.max(MIN, Math.min(MAX, z));
    if (ox === undefined) { ox = view.clientWidth / 2; oy = view.clientHeight / 2; }
    if (fx === undefined) {
      fx = view.scrollWidth ? (view.scrollLeft + ox) / view.scrollWidth : 0.5;
      fy = view.scrollHeight ? (view.scrollTop + oy) / view.scrollHeight : 0.5;
    }
    zoom = z;
    put('nr-zoom', String(zoom), true);
    layout();
    view.scrollLeft = fx * view.scrollWidth - ox;
    view.scrollTop = fy * view.scrollHeight - oy;
  }
  function zoomAt(z, cx, cy) {
    var r = view.getBoundingClientRect();
    var ox = cx - r.left, oy = cy - r.top;
    var fx = view.scrollWidth ? (view.scrollLeft + ox) / view.scrollWidth : 0.5;
    var fy = view.scrollHeight ? (view.scrollTop + oy) / view.scrollHeight : 0.5;
    setZoom(z, fx, fy, ox, oy);
  }

  function preload() {
    [target(1), target(-1)].forEach(function (t) {
      if (!t) return;
      var ps = [t];
      if (mode() === 2 && t > 1 && t + 1 <= T) ps.push(t + 1);
      ps.forEach(function (p) { new Image().src = 'images/page-' + p + '.jpg'; });
    });
  }

  var lastMode = null;
  function render() {
    var ps = pages(), two = mode() === 2;
    lastMode = mode();
    stage.className = two ? ('two' + (ps.length === 1 ? ' solo' : '')) : '';
    stage.innerHTML = '';
    ps.forEach(function (p) {
      var im = new Image();
      im.src = 'images/page-' + p + '.jpg';
      im.alt = 'صفحہ ' + p;
      im.draggable = false;
      stage.appendChild(im);
    });
    updateNav();
    layout();
    if (zoom > 1) {
      view.scrollLeft = (view.scrollWidth - view.clientWidth) / 2;
      view.scrollTop = 0;
    }
    preload();
  }

  /* ---- buttons ---- */
  btnMode.addEventListener('click', function () {
    pref = (mode() === 2) ? '1' : '2';
    put('nr-mode', pref);
    render();
  });
  zin.addEventListener('click', function () { setZoom(zoom + STEP); });
  zout.addEventListener('click', function () { setZoom(zoom - STEP); });
  zlab.addEventListener('click', function () { setZoom(1); });

  /* ---- keyboard ---- */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === '+' || k === '=') { setZoom(zoom + STEP); e.preventDefault(); }
    else if (k === '-' || k === '_') { setZoom(zoom - STEP); e.preventDefault(); }
    else if (k === '0') { setZoom(1); }
    else if (zoom === 1) {
      if (k === 'ArrowLeft') go(target(1));
      else if (k === 'ArrowRight') go(target(-1));
      else if (k === 'Home') go(1);
      else if (k === 'End') go(T);
    }
  });

  /* ---- mouse: wheel zoom (Ctrl + wheel / trackpad pinch), double-click, drag to pan ---- */
  view.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomAt(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  }, { passive: false });

  view.addEventListener('dblclick', function (e) {
    e.preventDefault();
    if (zoom > 1) setZoom(1); else zoomAt(2.5, e.clientX, e.clientY);
  });

  var drag = null;
  view.addEventListener('mousedown', function (e) {
    if (zoom <= 1 || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop };
    view.classList.add('drag');
    e.preventDefault();
  });
  window.addEventListener('mousemove', function (e) {
    if (!drag) return;
    view.scrollLeft = drag.l - (e.clientX - drag.x);
    view.scrollTop = drag.t - (e.clientY - drag.y);
  });
  window.addEventListener('mouseup', function () {
    drag = null;
    view.classList.remove('drag');
  });

  /* ---- touch: pinch zoom, double-tap zoom, swipe to change page ---- */
  var pinch = null, sx = 0, sy = 0, lastTap = 0, multi = false;
  function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2 && view.contains(e.target)) {
      multi = true;
      pinch = { d: dist(e.touches), z: zoom };
    } else if (e.touches.length === 1) {
      multi = false;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (pinch && e.touches.length === 2) {
      e.preventDefault();
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(pinch.z * dist(e.touches) / pinch.d, cx, cy);
    }
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    if (pinch) { if (e.touches.length < 2) pinch = null; return; }
    if (multi || e.changedTouches.length !== 1) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && view.contains(e.target)) {
      var now = Date.now();
      if (now - lastTap < 300) {
        if (zoom > 1) setZoom(1); else zoomAt(2.5, t.clientX, t.clientY);
        lastTap = 0;
      } else { lastTap = now; }
      return;
    }
    if (zoom === 1 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? target(1) : target(-1));   /* اردو: بائیں سوائپ = اگلا صفحہ */
    }
  }, { passive: true });

  /* ---- resize ---- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (mode() !== lastMode) render(); else { updateNav(); layout(); }
    }, 120);
  });

  render();
})();
