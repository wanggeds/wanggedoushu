// ===== Canvas 星空背景 =====
(function() {
  'use strict';
  if (!document.getElementById('bgCanvas')) {
    var c = document.createElement('canvas');
    c.id = 'bgCanvas';
    c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;pointer-events:none;';
    document.body.insertBefore(c, document.body.firstChild);
  }
  var canvas = document.getElementById('bgCanvas');
  var ctx = canvas.getContext('2d');
  var W, H, stars = [], meteors = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    var n = Math.min(300, Math.round((W * H) / 4000));
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.5 + 0.5,
        base: Math.random() * 0.7 + 0.3,
        speed: 0.002 + Math.random() * 0.015,
        phase: Math.random() * 6.28,
        color: Math.random() > 0.9 ? ['#aaddff','#ffddaa','#ffaaaa'][Math.floor(Math.random()*3)] : '#fff'
      });
    }
  }

  function addMeteor() {
    if (Math.random() > 0.005) return;
    meteors.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.3,
      vx: 3 + Math.random() * 5,
      vy: 2 + Math.random() * 4,
      len: 60 + Math.random() * 80,
      life: 1
    });
  }

  function draw(t) {
    ctx.fillStyle = '#050514';
    ctx.fillRect(0, 0, W, H);

    // 星星
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.base + (1 - s.base) * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.28);
      ctx.fill();
    }

    // 流星
    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.015;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      ctx.globalAlpha = m.life * 0.8;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * m.len / m.vx, m.y - m.vy * m.len / m.vy);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    addMeteor();
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
