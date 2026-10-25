// <water-surface> — animated contour-line water, WebGL2. Attributes: water, light, line, scale, density, weight, speed, turbulence
(function () {
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT, uScale, uBands, uWidth, uSpeed, uWarp;
uniform vec3 uBg, uBg2, uLine; uniform vec4 uRip[10];
float glow = 0.0;
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)), dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i = 0; i < 2; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
void main(){
  float m = min(uRes.x, uRes.y);
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / m;
  vec2 p = uv * uScale;
  float t = uT * uSpeed;
  float ta = t * 6.2831;
  float ph = ta * 0.5;
  float k0 = 0.5 + 0.5 * sin(ph);
  float k1 = 0.5 + 0.5 * sin(ph + 2.0944);
  float k2 = 0.5 + 0.5 * sin(ph + 4.1888);
  float ks = k0 + k1 + k2;
  vec2 A = vec2(0.0, 0.0), B = vec2(31.7, 12.4), C = vec2(-19.3, 47.1);
  float wx = (k0 * fbm(p + A) + k1 * fbm(p + B) + k2 * fbm(p + C)) / ks;
  float wy = (k0 * fbm(p + A + vec2(5.2, 1.3)) + k1 * fbm(p + B + vec2(5.2, 1.3)) + k2 * fbm(p + C + vec2(5.2, 1.3))) / ks;
  vec2 q = p + uWarp * vec2(wx, wy);
  float v = (k0 * fbm(q + A + vec2(2.1, 8.6)) + k1 * fbm(q + B + vec2(2.1, 8.6)) + k2 * fbm(q + C + vec2(2.1, 8.6))) / ks;
  for(int i = 0; i < 10; i++){
    vec4 r = uRip[i];
    if(r.w < 0.5) continue;
    float age = uT - r.z;
    if(age > 9.0) continue;
    vec2 c = (r.xy - 0.5 * uRes) / m;
    vec2 dv = uv - c;
    dv.y *= 2.7;
    float d = length(dv);
    float env = exp(-5.5 * d) * exp(-age * 0.32) * smoothstep(0.0, 0.35, age);
    v += 0.14 * env * sin(d * 30.0 - age * 1.0);
    glow += 0.35 * env * mix(1.0, 0.35, smoothstep(0.0, 5.5, age));
  }
  float f = v * uBands;
  float g = fract(f);
  float grad = length(vec2(dFdx(f), dFdy(f)));
  float dist = min(g, 1.0 - g) / max(grad, 1e-6);
  float line = 1.0 - smoothstep(uWidth - 1.1, uWidth + 1.1, dist);
  line *= mix(1.0, 0.30, smoothstep(0.35, 2.2, grad));
  vec3 lc = mix(uLine, min(uLine + 0.14, vec3(1.0)), clamp(glow, 0.0, 1.0));
  vec3 bgc = mix(uBg2, uBg, clamp(0.5 + v * 1.2, 0.0, 1.0));
  o = vec4(mix(bgc, lc, line * (1.0 - 0.22 * clamp(glow, 0.0, 1.0))), 1.0);
}`;

  const hex = (h) => {
    const s = String(h).replace('#', '');
    const n = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
    const i = parseInt(n, 16);
    return [((i >> 16) & 255) / 255, ((i >> 8) & 255) / 255, (i & 255) / 255];
  };

  class WaterSurface extends HTMLElement {
    connectedCallback() {
      if (this._up) return;
      this._up = true;
      const num = (a, d) => this.hasAttribute(a) ? parseFloat(this.getAttribute(a)) : d;
      const str = (a, d) => this.getAttribute(a) || d;
      const cfg = {
        water: str('water', '#85f8f5'), light: str('light', '#d6fbf3'), line: str('line', '#ffffff'),
        scale: num('scale', 7.2), density: num('density', 30), weight: num('weight', 1.8),
        turbulence: num('turbulence', 0), speed: num('speed', 0.1)
      };
      this.style.display = 'block';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.background = cfg.water;
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block';
      this.appendChild(canvas);
      /* alpha:true, NOT false. With an opaque drawing buffer any frame the GPU has not
         drawn — the first one, and every one after the context is lost — is painted
         BLACK, and on a phone that reads as the background blinking. The shader writes
         alpha 1 on every pixel, so nothing about the picture changes; what changes is
         that an undrawn frame is see-through, and what shows through is this element's
         own water colour, set above. */
      const gl = canvas.getContext('webgl2', { antialias: false, alpha: true });
      if (!gl) return;   /* no WebGL at all: the element keeps its water colour and that is the background */

      /* A phone drops WebGL contexts under memory pressure, and a dropped context leaves
         a dead canvas sitting over the colour. Take the canvas away and the water colour
         is the background again — still and correct, rather than black and blinking. */
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        cancelAnimationFrame(this._raf);
        canvas.style.visibility = 'hidden';
      });
      canvas.addEventListener('webglcontextrestored', () => {
        /* Every GL object died with the context, so the only honest recovery is to build
           it again from scratch. */
        canvas.remove();
        this._up = false;
        this.connectedCallback();
      });

      const mk = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog); gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U = n => gl.getUniformLocation(prog, n);
      const u = { res: U('uRes'), t: U('uT'), scale: U('uScale'), bands: U('uBands'), width: U('uWidth'), warp: U('uWarp'), bg: U('uBg'), bg2: U('uBg2'), line: U('uLine'), rip: U('uRip') };
      const bg = hex(cfg.water), bg2 = hex(cfg.light), ln = hex(cfg.line);
      gl.uniform3f(u.bg, bg[0], bg[1], bg[2]);
      gl.uniform3f(u.bg2, bg2[0], bg2[1], bg2[2]);
      gl.uniform3f(u.line, ln[0], ln[1], ln[2]);
      gl.uniform1f(u.scale, cfg.scale);
      gl.uniform1f(u.bands, cfg.density);
      gl.uniform1f(u.width, cfg.weight);
      gl.uniform1f(U('uSpeed'), cfg.speed * 0.018);
      gl.uniform1f(u.warp, cfg.turbulence);

      let dpr = 1;
      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.res, w, h);
      };
      resize();
      const ro = new ResizeObserver(resize); ro.observe(this);
      window.addEventListener('resize', resize);

      const rip = new Float32Array(40);
      let ripI = 0, now = 0, last = 0;
      const t0 = performance.now();
      const addRipple = (e) => {
        const r = canvas.getBoundingClientRect();
        const i = (ripI++ % 10) * 4;
        rip[i] = (e.clientX - r.left) * dpr;
        rip[i + 1] = (r.height - (e.clientY - r.top)) * dpr;
        rip[i + 2] = now; rip[i + 3] = 1;
      };
      this.ripple = (clientX, clientY) => addRipple({ clientX, clientY });

      const frame = () => {
        now = (performance.now() - t0) / 1000;
        gl.uniform1f(u.t, now);
        gl.uniform4fv(u.rip, rip);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this._raf = requestAnimationFrame(frame);
      };
      frame();
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); }
  }
  if (!customElements.get('water-surface')) customElements.define('water-surface', WaterSurface);
})();
