// ===== Canvas 极光星云背景（第二页） =====
(function() {
  'use strict';
  var c = document.createElement('canvas');
  c.id = 'bgAurora';
  c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;display:none';
  document.body.insertBefore(c, document.body.firstChild);

  var ctx = c.getContext('2d');
  var W, H, stars = [], aurora = [], time = 0;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    initStars();
    initAurora();
  }

  function initStars() {
    stars = [];
    var n = Math.min(150, Math.round((W * H) / 8000));
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2 + 0.5,
        speed: 0.002 + Math.random() * 0.01,
        phase: Math.random() * 6.28,
        base: Math.random() * 0.5 + 0.3
      });
    }
  }

  function initAurora() {
    aurora = [];
    for (var i = 0; i < 4; i++) {
      aurora.push({
        y: 0.2 + Math.random() * 0.4,
        width: 0.3 + Math.random() * 0.4,
        speed: 0.0003 + Math.random() * 0.0005,
        phase: Math.random() * 6.28,
        colors: [
          [30, 180, 255],   // 淡蓝
          [100, 60, 200],   // 紫
          [0, 200, 180],    // 青绿
          [180, 100, 255]   // 淡紫
        ][i]
      });
    }
  }

  function draw(t) {
    time += 0.005;

    // 深色渐变背景
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#0d0d24');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 极光
    for (var a = 0; a < aurora.length; a++) {
      var au = aurora[a];
      var ay = au.y * H;
      var aw = au.width * W;
      var alpha = 0.12 + 0.08 * Math.sin(t * au.speed + au.phase);

      for (var i = 0; i < 12; i++) {
        var xOff = (i / 12 - 0.5) * aw;
        var yOff = Math.sin(t * au.speed * 3 + au.phase + i * 0.8) * 60;
        var alpha2 = alpha * (1 - Math.abs(i / 6 - 1)) * 0.6;

        ctx.beginPath();
        var cx = W / 2 + xOff;
        var cy = ay + yOff;
        var w = 60 + Math.sin(t * au.speed * 2 + au.phase + i) * 20;
        var h = 80 + Math.sin(t * au.speed + au.phase + i * 0.5) * 30;

        ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + au.colors.join(',') + ',' + alpha2 + ')';
        ctx.fill();
      }
    }

    // 底部辉光
    var glow = ctx.createRadialGradient(W / 2, H * 0.85, 0, W / 2, H * 0.85, H * 0.4);
    glow.addColorStop(0, 'rgba(30,60,120,0.15)');
    glow.addColorStop(0.5, 'rgba(20,40,80,0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // 星星
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.base + (1 - s.base) * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);

  // 暴露控制接口
  window.AuroraBG = {
    show: function() { c.style.display = 'block'; },
    hide: function() { c.style.display = 'none'; }
  };
})();
