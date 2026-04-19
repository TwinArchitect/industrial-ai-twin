/// <reference types="vite/client" />

// GLSL 文件模块声明（由 vite-plugin-glsl 处理）
declare module '*.vert.glsl' {
  const src: string
  export default src
}

declare module '*.frag.glsl' {
  const src: string
  export default src
}

declare module '*.glsl' {
  const src: string
  export default src
}
