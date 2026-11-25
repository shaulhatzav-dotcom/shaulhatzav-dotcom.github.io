/* The home page hero picture in 3D (25/11/2026; the user: "שהתמונה שלמעלה תהיה תלת מימד").
   A "3D photo": the picture moves a little by its depth map (img/bg/<name>-d.png, make_hero_depth.py), so near things
   (Shaul and his friends, the box) shift more than the wall behind them. Plain WebGL, no library, about 3 KB.
   It drifts slowly by itself and follows the mouse. If WebGL or the images fail, the normal CSS background stays.
   Respects "reduce motion": then the picture stays still. Stops while the hero is off screen or the tab is hidden. */
(() => {
  const hero = document.querySelector('.hero[data-depth]');
  if (!hero) return;
  const cv = document.createElement('canvas');
  const gl = cv.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const VS = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
  const FS = `precision mediump float; varying vec2 v; uniform sampler2D img, dep; uniform vec2 off; uniform vec4 box;
    void main(){ vec2 uv = v * box.xy + box.zw;
      float d = texture2D(dep, uv).r; vec2 q = uv + off * (d - .35);
      d = texture2D(dep, q).r; q = uv + off * (d - .35);
      gl_FragColor = texture2D(img, clamp(q, .001, .999)); }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uOff = U('off'), uBox = U('box');
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const texture = (img, unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); };

  Promise.all([load(hero.dataset.src), load(hero.dataset.depth)]).then(([img, dep]) => {
    texture(img, 0); texture(dep, 1); gl.uniform1i(U('img'), 0); gl.uniform1i(U('dep'), 1);
    const IA = img.width / img.height;
    cv.className = 'hero3d'; cv.setAttribute('aria-hidden', 'true'); hero.prepend(cv); hero.classList.add('is3d');
    // the same framing as the CSS background: cover, 70% across on a computer, 62% across and top on a phone
    const fit = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); gl.viewport(0, 0, cv.width, cv.height);
      const phone = matchMedia('(max-width: 760px)').matches, px = phone ? .62 : .7, py = phone ? 0 : .5, Z = 1.1;   // a small zoom hides the edges
      let fx = 1, fy = 1; if (r.width / r.height > IA) fy = (r.height / r.width) * IA; else fx = (r.width / r.height) / IA;
      fx /= Z; fy /= Z; gl.uniform4f(uBox, fx, fy, (1 - fx) * px, (1 - fy) * Math.max(py, .025));
    };
    let mx = 0, my = 0, ox = 0, oy = 0, run = false, seen = true;
    const draw = () => { gl.uniform2f(uOff, ox, oy); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    const tick = now => {
      if (!run) return;
      const t = now / 1000, A = .045;
      ox += ((Math.sin(t * .55) * .8 + mx) * A - ox) * .07; oy += ((Math.sin(t * .37) * .6 + my) * A * .7 - oy) * .07;
      draw(); requestAnimationFrame(tick);
    };
    const update = () => { const go = seen && !document.hidden && !reduce.matches;
      if (go && !run) { run = true; requestAnimationFrame(tick); } else if (!go) { run = false; if (reduce.matches) { ox = oy = 0; draw(); } } };
    hero.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * -1.6; my = ((e.clientY - r.top) / r.height - .5) * -1.6; });
    hero.addEventListener('pointerleave', () => { mx = my = 0; });
    new ResizeObserver(() => { fit(); draw(); }).observe(cv);
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; update(); }).observe(hero);
    document.addEventListener('visibilitychange', update); reduce.addEventListener('change', update);
    fit(); draw(); update();
  }).catch(() => {});
})();
