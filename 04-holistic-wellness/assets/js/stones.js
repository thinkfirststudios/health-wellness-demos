/* The stone stack. Raw WebGL, no library: geometry and surface are generated here.
   Progress comes only from scroll position. It renders when progress changes and otherwise
   does nothing, so there is no idle loop. Scrolling itself is never touched. */
(function () {
  "use strict";
  var host = document.querySelector("[data-stones]");
  if (!host) return;
  var pin = host.querySelector(".stones-pin");
  var canvas = document.createElement("canvas");
  canvas.className = "stones-canvas";
  canvas.setAttribute("aria-hidden", "true");
  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
  if (!gl) return;
  var small = window.matchMedia("(max-width: 767px)").matches;
  var cap = small ? 1.25 : 1.75, SUB = small ? 3 : 4, OCT = small ? 3 : 4;

  /* ---- deterministic noise for the shapes ---- */
  function hash(x, y, z) { var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
  function vnoise(x, y, z) {
    var i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), a = x - i, b = y - j, c = z - k;
    a = a * a * (3 - 2 * a); b = b * b * (3 - 2 * b); c = c * c * (3 - 2 * c);
    function L(p, q, t) { return p + (q - p) * t; }
    return L(L(L(hash(i, j, k), hash(i + 1, j, k), a), L(hash(i, j + 1, k), hash(i + 1, j + 1, k), a), b),
      L(L(hash(i, j, k + 1), hash(i + 1, j, k + 1), a), L(hash(i, j + 1, k + 1), hash(i + 1, j + 1, k + 1), a), b), c);
  }
  /* ---- icosphere ---- */
  function icosphere(n) {
    var t = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    var f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    function norm(p) { var l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; }
    v = v.map(norm);
    for (var s = 0; s < n; s++) {
      var mid = {}, nf = [];
      var m = function (a, b) {
        var k = a < b ? a + "_" + b : b + "_" + a;
        if (mid[k] === undefined) { mid[k] = v.length; v.push(norm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); }
        return mid[k];
      };
      f.forEach(function (q) {
        var a = m(q[0], q[1]), b = m(q[1], q[2]), c = m(q[2], q[0]);
        nf.push([q[0], a, c], [q[1], b, a], [q[2], c, b], [a, b, c]);
      });
      f = nf;
    }
    return { v: v, f: f };
  }
  var ico = icosphere(SUB);
  var idx = new Uint16Array(ico.f.length * 3);
  ico.f.forEach(function (q, i) { idx[i * 3] = q[0]; idx[i * 3 + 1] = q[1]; idx[i * 3 + 2] = q[2]; });

  /* widest at the base, seven river stones, each with its own character */
  var SPEC = [
    { rx: 1.42, ry: .56, rz: 1.18, seed: 3.1, tone: .15, off: [.02, -.02], tilt: [.0, .02], yaw: .4 },
    { rx: 1.2, ry: .5, rz: 1.02, seed: 8.4, tone: .7, off: [-.06, .04], tilt: [.03, -.05], yaw: 1.5 },
    { rx: 1.02, ry: .42, rz: .86, seed: 14.2, tone: .35, off: [.07, -.02], tilt: [-.04, .03], yaw: 2.6 },
    { rx: .88, ry: .38, rz: .72, seed: 21.7, tone: .85, off: [-.05, .03], tilt: [.05, .04], yaw: .9 },
    { rx: .72, ry: .31, rz: .6, seed: 27.3, tone: .25, off: [.05, .02], tilt: [-.03, -.05], yaw: 2.1 },
    { rx: .56, ry: .26, rz: .46, seed: 33.9, tone: .6, off: [-.03, -.03], tilt: [.04, .02], yaw: 3.0 },
    { rx: .4, ry: .19, rz: .34, seed: 41.5, tone: .4, off: [.02, .01], tilt: [-.02, .05], yaw: 1.2 }
  ];
  function buildStone(s) {
    var n = ico.v.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), obj = new Float32Array(n * 3), i;
    for (i = 0; i < n; i++) {
      var p = ico.v[i], x = p[0], y = p[1], z = p[2];
      /* superellipsoid: flat faces and rolled edges, the way water wears a stone */
      var rho = Math.hypot(x, z) || 1e-6, ex = .72;
      var nr = Math.pow(rho, ex), ny = (y < 0 ? -1 : 1) * Math.pow(Math.abs(y), ex);
      var sx = x / rho * nr, sz = z / rho * nr, sy = ny;
      var big = vnoise(x * 1.15 + s.seed, y * 1.15, z * 1.15) - .5;
      var mid = vnoise(x * 2.7 + s.seed, y * 2.7 + 7, z * 2.7) - .5;
      var fine = vnoise(x * 8 + s.seed, y * 8, z * 8 + 3) - .5;
      var d = 1 + big * .34 + mid * .09 + fine * .018;
      var lean = (vnoise(s.seed, 1.7, x * 1.1) - .5) * .5;
      pos[i * 3] = sx * d * s.rx; pos[i * 3 + 1] = (sy * d + sx * lean * .35) * s.ry; pos[i * 3 + 2] = sz * d * s.rz;
      obj[i * 3] = x * s.rx; obj[i * 3 + 1] = y * s.ry; obj[i * 3 + 2] = z * s.rz;
    }
    ico.f.forEach(function (q) {
      var a = q[0] * 3, b = q[1] * 3, c = q[2] * 3;
      var ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      var vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      [a, b, c].forEach(function (k) { nor[k] += nx; nor[k + 1] += ny; nor[k + 2] += nz; });
    });
    var inter = new Float32Array(n * 9);
    for (i = 0; i < n; i++) {
      var l = Math.hypot(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]) || 1;
      inter.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3] / l, nor[i * 3 + 1] / l, nor[i * 3 + 2] / l, obj[i * 3], obj[i * 3 + 1], obj[i * 3 + 2]], i * 9);
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, inter, gl.STATIC_DRAW);
    return buf;
  }

  var VS = "attribute vec3 p;attribute vec3 n;attribute vec3 o;uniform mat4 M;uniform mat4 VP;varying vec3 wp;varying vec3 wn;varying vec3 op;void main(){vec4 w=M*vec4(p,1.);wp=w.xyz;wn=mat3(M[0].xyz,M[1].xyz,M[2].xyz)*n;op=o;gl_Position=VP*w;}";
  var FS = [
    "precision highp float;varying vec3 wp;varying vec3 wn;varying vec3 op;uniform vec3 eye;uniform float seed;uniform float tone;uniform float a;uniform vec2 c;uniform float ry;",
    "float h(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}",
    "float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);",
    "return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}",
    "float fb(vec3 p){float s=0.,w=.5;for(int i=0;i<" + OCT + ";i++){s+=w*vn(p);p=p*2.07+3.1;w*=.5;}return s;}",
    "void main(){vec3 q=op*3.4+seed;float e=.012;float f0=fb(q*2.6);",
    "vec3 g=vec3(fb((q+vec3(e*4.,0,0))*2.6)-f0,fb((q+vec3(0,e*4.,0))*2.6)-f0,fb((q+vec3(0,0,e*4.))*2.6)-f0)/(e*4.);",
    "vec3 N=normalize(normalize(wn)-g*.085);vec3 V=normalize(eye-wp);",
    "float band=fb(vec3(op.x*1.2,op.y*8.5,op.z*1.2)+seed);float mott=fb(q*.8);float grain=vn(q*30.);float pit=smoothstep(.62,.74,fb(q*5.2));",
    "vec3 dark=mix(vec3(.15,.115,.09),vec3(.21,.15,.105),tone);vec3 warm=mix(vec3(.46,.36,.27),vec3(.6,.42,.27),tone);",
    "vec3 alb=mix(dark,warm,smoothstep(.3,.7,mott*.6+band*.45));alb*=.72+.6*f0;alb+=(grain-.5)*.05;alb*=1.-pit*.42;",
    "vec3 Lk=normalize(vec3(.72,.42,.5));vec3 Lb=normalize(vec3(.1,.3,-.95));vec3 Lf=normalize(vec3(-.7,.5,.5));",
    "float wrap=max((dot(N,Lk)+.22)/1.22,0.);float back=max(dot(N,Lb)+.15,0.);float fill=max(dot(N,Lf),0.);float up=N.y*.5+.5;",
    "vec3 key=vec3(1.,.66,.36)*1.55*wrap*wrap;vec3 fl=vec3(.6,.42,.3)*.34*fill;vec3 am=mix(vec3(.07,.05,.04),vec3(.26,.18,.12),up);",
    "float rim=pow(1.-max(dot(N,V),0.),3.);vec3 rimc=vec3(1.,.56,.2)*rim*(.3+1.4*back);",
    "vec3 Hh=normalize(Lk+V);float sp=pow(max(dot(N,Hh),0.),18.)*.16*(.4+f0);",
    "float yl=clamp((wp.y-c.x)/(2.*ry),0.,1.);float ao=smoothstep(0.,.26,yl)*(.55+.45*smoothstep(1.,.8,yl));ao=mix(.22,1.,ao);",
    "vec3 col=alb*(key+fl+am)*ao+rimc*(alb+.12)*1.6*ao+vec3(1.,.72,.42)*sp*ao;",
    "col=col/(1.+col*.5);col=pow(col,vec3(.92));",
    "gl_FragColor=vec4(col*a,a);}"
  ].join("");
  function sh(type, src) {
    var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(x));
    return x;
  }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var A = { p: gl.getAttribLocation(pr, "p"), n: gl.getAttribLocation(pr, "n"), o: gl.getAttribLocation(pr, "o") };
  var U = {}; ["M", "VP", "eye", "seed", "tone", "a", "c", "ry"].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
  var ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* stack heights, each stone seated slightly into the one below */
  var y = 0;
  SPEC.forEach(function (s, i) {
    y += s.ry * (i ? .86 : 1);
    s.y = y;
    y += s.ry * .86;
  });
  var TOP = y;

  /* ---- small matrix helpers (column-major) ---- */
  function mul(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
  function persp(f, as, n, fa) { var t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / as; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; }
  function look(e, c) {
    var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], l = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / l; });
    var x = [z[2], 0, -z[0]]; l = Math.hypot(x[0], x[2]); x = [x[0] / l, 0, x[2] / l];
    var u = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0], u[0], z[0], 0, x[1], u[1], z[1], 0, x[2], u[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]);
  }
  function rot(ax, ay, az) {
    var a = Math.cos(ax), b = Math.sin(ax), c = Math.cos(ay), d = Math.sin(ay), e = Math.cos(az), f = Math.sin(az);
    return new Float32Array([c * e, c * f, -d, 0, b * d * e - a * f, b * d * f + a * e, b * c, 0, a * d * e + b * f, a * d * f - b * e, a * c, 0, 0, 0, 0, 1]);
  }

  var W = 1, H = 1, VP, eye, target = 0, shown = -1, running = false, inView = false, lost = false;
  function size() {
    var w = pin.clientWidth, h = pin.clientHeight, d = Math.min(window.devicePixelRatio || 1, cap);
    W = canvas.width = Math.round(w * d); H = canvas.height = Math.round(h * d);
    gl.viewport(0, 0, W, H);
    var as = w / h, dist = as < .8 ? 19 : 15.5;
    eye = [0, TOP * .5 + 1.9, dist];
    VP = mul(persp(.56, as, .1, 60), look(eye, [0, TOP * .36, 0]));
    shown = -1; draw(shown === -1 ? (target) : target);
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function draw(p) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(U.VP, false, VP);
    gl.uniform3fv(U.eye, eye);
    var n = SPEC.length, swing = (p - .5) * .5;
    for (var i = 0; i < n; i++) {
      var s = SPEC[i];
      var t = Math.min(Math.max(p * (n + .35) - i * .96, 0), 1);
      if (t <= 0) continue;
      var e = ease(t), drop = (1 - e) * 3.4;
      var m = rot(s.tilt[0] * 1.4, s.yaw + swing + (1 - e) * .5, s.tilt[1] * 1.4);
      m[12] = s.off[0]; m[13] = s.y + drop; m[14] = s.off[1];
      gl.uniformMatrix4fv(U.M, false, m);
      gl.uniform1f(U.seed, s.seed); gl.uniform1f(U.tone, s.tone);
      gl.uniform1f(U.a, Math.min(t * 7, 1));
      gl.uniform2f(U.c, s.y - s.ry, 0); gl.uniform1f(U.ry, s.ry);
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buf);
      gl.enableVertexAttribArray(A.p); gl.vertexAttribPointer(A.p, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(A.n); gl.vertexAttribPointer(A.n, 3, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(A.o); gl.vertexAttribPointer(A.o, 3, gl.FLOAT, false, 36, 24);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    }
    window.PSW_STONE_DRAWS = (window.PSW_STONE_DRAWS || 0) + 1;
  }
  function tick() {
    var d = target - shown;
    shown = Math.abs(d) < .0015 ? target : shown + d * .14; /* short catch-up: progress still belongs to the scroll */
    draw(shown);
    if (shown !== target && inView && !document.hidden) { requestAnimationFrame(tick); } else { running = false; }
  }
  function onScroll() {
    if (lost || !inView || built < SPEC.length) return;
    var r = host.getBoundingClientRect(), span = r.height - pin.clientHeight;
    target = span > 0 ? Math.min(Math.max(-r.top / (span * .92), 0), 1) : 1;
    if (!running && target !== shown) { running = true; requestAnimationFrame(tick); }
  }
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function off() { canvas.remove(); host.classList.remove("is-live"); lost = true; }
  motion.addEventListener("change", function () { if (motion.matches) off(); });
  canvas.addEventListener("webglcontextlost", off);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", size, { passive: true });
  new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (built === SPEC.length) onScroll(); }, { rootMargin: "120px" }).observe(pin);

  /* one stone per task, so setting up never holds a phone's scroll for long */
  var built = 0;
  function buildNext() {
    SPEC[built].buf = buildStone(SPEC[built]);
    built++;
    if (built < SPEC.length) { window.setTimeout(buildNext, 0); return; }
    pin.insertBefore(canvas, pin.querySelector(".stones-copy"));
    host.classList.add("is-live");
    shown = 0;
    size();
    onScroll();
  }
  buildNext();
})();
