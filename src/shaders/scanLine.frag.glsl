uniform float uTime;
uniform float uActive;
uniform vec3  uColor;
uniform float uLineWidth;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  // 扫描线 Y 位置：随时间从 0 → 1 循环移动
  float scanY = mod(uTime * uSpeed, 1.0);

  // 当前片元与扫描线中心的距离
  float dist = abs(vUv.y - scanY);

  // 主扫描线（细实线）
  float line = smoothstep(uLineWidth, 0.0, dist);

  // 光晕：更宽的渐隐区域（配合 Bloom 产生辉光拖尾）
  float glow = smoothstep(uLineWidth * 8.0, 0.0, dist) * 0.3;

  // 网格扫描底色（极淡，仅在 uActive 时可见）
  float grid = step(0.98, fract(vUv.x * 30.0)) * 0.05
             + step(0.98, fract(vUv.y * 30.0)) * 0.05;

  float alpha = (line + glow + grid) * uActive;

  gl_FragColor = vec4(uColor, alpha);
}
