/* Touchable water. Raw WebGL, no library. Ripples displace a real photograph.
   The render loop only runs while a ripple is alive and the scene is on screen.
   The texture is a data URI (water-texture.js) because WebGL cannot read images from file://. */
(function () {
  "use strict";
  var host = document.querySelector("[data-water]");
  if (!host || !window.PSW_WATER_TEXTURE) return;
  var MAX = 10;
  var canvas = document.createElement("canvas");
  canvas.className = "water-canvas";
  canvas.setAttribute("aria-hidden", "true");
  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  var vs = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
  var fs = [
    "precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec4 r[" + MAX + "];uniform vec2 s;uniform vec2 o;",
    "void main(){vec2 uv=v;vec2 off=vec2(0.);float h=0.;",
    "for(int i=0;i<" + MAX + ";i++){vec4 q=r[i];if(q.w>0.001){",
    "vec2 d=(uv-q.xy)*vec2(s.x/s.y,1.);float l=length(d)+.0001;float f=q.z*.16;",
    "float e=(l-f)/(.05+q.z*.035);float ring=exp(-e*e);float a=q.w*ring*exp(-q.z*.8);",
    "float w=sin((l-f)*58.);off+=(d/l)*w*a*.028;h+=w*a;}}",
    "vec2 c=(uv+off)*o+(1.-o)*.5;c.y=1.-c.y;vec3 col=texture2D(t,c).rgb;",
    "col*=1.+h*.8;col+=vec3(.5,.3,.12)*max(h,0.)*.16;gl_FragColor=vec4(col,1.);}"
  ].join("");
  function sh(type, src) { var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var ap = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(ap);
  gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, "r"), uS = gl.getUniformLocation(pr, "s"), uO = gl.getUniformLocation(pr, "o");

  var ripples = [], data = new Float32Array(MAX * 4), running = false, inView = false, ready = false, last = 0, lastAdd = 0, imgW = 3, imgH = 2;
  var small = window.matchMedia("(max-width: 767px)").matches;
  var cap = small ? 1 : 1.5;

  function size() {
    var w = host.clientWidth, h = host.clientHeight, d = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uS, w, h);
    var ca = w / h, ia = imgW / imgH; /* object-fit: cover */
    gl.uniform2f(uO, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
    draw();
  }
  function draw() {
    if (!ready) return;
    data.fill(0);
    for (var i = 0; i < ripples.length; i++) {
      var q = ripples[i];
      data[i * 4] = q.x; data[i * 4 + 1] = q.y; data[i * 4 + 2] = q.age; data[i * 4 + 3] = q.amp;
    }
    gl.uniform4fv(uR, data);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(t) {
    var dt = Math.min((t - last) / 1000, .05); last = t;
    for (var i = ripples.length - 1; i >= 0; i--) {
      ripples[i].age += dt;
      if (ripples[i].age > 6) ripples.splice(i, 1);
    }
    draw();
    window.PSW_FRAMES = (window.PSW_FRAMES || 0) + 1;
    if (ripples.length && inView && !document.hidden) { requestAnimationFrame(frame); } else { running = false; }
  }
  function kick() {
    if (running || !inView || document.hidden || !ready) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function add(x, y, amp) {
    if (ripples.length >= MAX) ripples.shift();
    ripples.push({ x: x, y: y, age: 0, amp: amp });
    kick();
  }
  function at(cx, cy, amp) {
    var now = performance.now();
    if (now - lastAdd < 170) return;
    lastAdd = now;
    var r = host.getBoundingClientRect();
    add((cx - r.left) / r.width, 1 - (cy - r.top) / r.height, amp);
  }
  /* all listeners passive: touching the water never holds up the page scrolling */
  var opt = { passive: true };
  host.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") at(e.clientX, e.clientY, .55); }, opt);
  host.addEventListener("pointerdown", function (e) { lastAdd = 0; at(e.clientX, e.clientY, 1); }, opt);
  host.addEventListener("touchmove", function (e) { var c = e.touches[0]; if (c) at(c.clientX, c.clientY, .7); }, opt);

  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", function () { if (motion.matches) { ripples.length = 0; canvas.remove(); host.classList.remove("is-live"); } });
  document.addEventListener("visibilitychange", kick);
  window.addEventListener("resize", size, opt);
  canvas.addEventListener("webglcontextlost", function () { canvas.remove(); host.classList.remove("is-live"); });

  var im = new Image();
  im.onload = function () {
    imgW = im.naturalWidth; imgH = im.naturalHeight;
    var tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    ready = true;
    host.insertBefore(canvas, host.querySelector(".scene-scrim"));
    host.classList.add("is-live");
    size();
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView && !host.dataset.greeted && en[0].intersectionRatio > .4) {
        host.dataset.greeted = "1";
        add(.5, .34, .8); /* one slow ring, so people can see the water answers */
      }
      kick();
    }, { threshold: [0, .45] }).observe(host);
  };
  im.src = window.PSW_WATER_TEXTURE;
})();
