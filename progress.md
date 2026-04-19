# Industrial AI Twin — 推进日志

> **原则：向后看精确，向前看模糊。**
> 已完成的精确记录（时间 + 结果 + 遇到的问题）；当前阶段保持一周粒度的任务列表；往后只写一句话方向，不预设细节。

---

## 已完成

### 2026-04-17 · Day 1–2：项目骨架搭建

**完成内容：**
- Vite + React 18 + TypeScript + R3F + Zustand + Tailwind + GSAP + Socket.io 全栈项目初始化
- 全局类型系统（`types/index.ts`）+ Zustand Store 设计完毕
- Core 核心逻辑层：`CommandProcessor`（AI 指令解析）、`CameraDirector`（相机飞行）、`ExplodedLogic`（爆炸图）、`ModelProcessor`（Mesh 遍历）
- 所有 Canvas 组件骨架：`Scene` / `Machine` / `MachineBody` / `Pipes` / `StatusLights` / `Environment` / `InspectionBot` / 后处理 / 扫描线 Shader
- UI 组件骨架：`AITerminal`（打字机输出）/ `DataPanel`（ECharts）/ `StatusBar` / `LoadingScreen`
- Hooks：`useWebSocket` / `useExplosion` / `useAICommand`
- Express + Socket.io 后端 + MockData 随机游走生成器
- `pnpm install` 前后端成功 · TypeScript 零错误 · `pnpm build` 通过

**遗留问题：**
- HDRI 文件需手动下载（polyhaven.com → industrial_workshop_foundry_1k.hdr → 放入 `public/hdri/`）
- 尚未在浏览器中验证实际渲染效果

---

### 2026-04-17 · Day 3–4：模型与视觉调优

**完成内容：**
- 放弃程序化建模，切到 Sketchfab GLB 离心泵模型（`public/models/pump.glb` 5.5MB）
- `GLBMachine` 组件：自动 BoundingBox 归一化 + 底部对齐地面 + 水平居中
- HDRI 本地加载：`industrial_workshop_foundry_1k.hdr`，`environmentIntensity=0.6`
- 材质批量处理：清零 emissive、clamp metalness≤0.75/roughness≥0.35、蓝色底座自动改灰
- 定向光 0.8 + shadow bias → 产生清晰阴影无锯齿
- 爆炸图：递归下钻 Sketchfab 包装层，取 58 个 Material mesh 作爆炸单元，距离 3.5 单位
- 状态告警：按 X 轴找出电机/泵体代表 Mesh，温度/压力超阈值时对单个 Mesh 做 emissive 呼吸
- 清理掉程序化的 `MachineBody.tsx` / `Pipes.tsx`
- 修复：HTTP 环境下的 Google Fonts 网络错误（移除外链）、isLoaded 初始值、SceneErrorBoundary

**遗留/已知局限：**
- GLB 是扁平 Material 结构，爆炸只能按 mesh 粒度而非按"电机/泵体/管路"逻辑分组（需要客户给 CAD 才能按真实装配结构爆炸）
- INSPECT/CLIP 按钮暂未实现功能

---

### 2026-04-17 ~ 04-18 · Day 5–6：交互闭环 + 高级功能

**完成内容：**
- WebSocket 实时传感器数据 → DataPanel ECharts 折线图（温度/压力/转速/震动/流量）
- 点击 Mesh → Zone 选中 → 相机贝塞尔飞行 → DataPanel 自动展开对应数据
- AITerminal 完整接入 CommandProcessor：explode / collapse / inspect / clip / fly to / highlight / show data
- 巡检机器人动画路径 + 逐站异常诊断 + 巡检完成 AI 提醒（英文消息 + alert pulse）
- 截面切割 clippingPlanes + StatusBar 高度滑块
- 扫描线 Shader 特效（AI 指令触发时播放）
- Zone 分区系统（motor/pump/pipe/valve/base 按坐标自动分类）
- Hover 描边 + 选中高亮（PostProcessing Outline + 脉冲）
- DataPanel / AITerminal 手动关闭与重开按钮
- fly to pump / fly to impeller 区分视角 + 重复触发修复
- 所有 AI 消息统一英文（面向海外客户演示）

**遗留/已知局限：**
- impeller 在 zone 层面仍映射到 pump（相同 mesh 集合，仅相机视角不同）
- 爆炸图仍是 mesh 粒度，非装配结构分组

---

## 已完成：Week 2 Day 7–8

**目标：监控仪表盘 + 3D 标注 + 专业交互**

- [x] 3D 浮动标注（ZoneAnnotations）：hover/selected/inspecting 三态标签，巡检中显示当前扫描站点（橙色 SCANNING 样式）
- [x] 实时告警 Toast 通知系统：传感器越阈弹出右上角通知卡片，支持自动消失 + 手动关闭 + Focus 聚焦
- [x] 设备综合健康分：StatusBar 显示 0–100 Health Score，实时计算
- [x] Reset View 复位：AI 命令 `reset` + StatusBar RESET 按钮 + 键盘 `R`
- [x] 全局键盘快捷键：E 爆炸 / I 巡检 / C 截面 / Esc 取消 / R 复位
- [x] Zone 下拉选择器：并入 StatusBar 右侧按钮行，联动相机飞行 + DataPanel + 描边高亮

---

## 当前阶段：Week 3（进行中）

**目标：交付准备 + Demo 完善**

- [ ] 数据导出：支持传感器历史数据 CSV 下载
- [ ] 多语言支持：中/英文切换（面向国际客户演示）
- [ ] 部署上线：Vercel/Netlify 静态部署 + 后端云服务
- [ ] Demo 录屏脚本：覆盖主要功能演示流程
- [ ] Upwork Portfolio 文案：项目描述 + 技术栈 + 截图

**完成判断标准：** 可公开访问的线上 Demo 链接，配套 Portfolio 展示材料齐全。

---

## 后续方向（不展开，推进到时再细化）

- 接到真实需求后再规划（PLC 数据对接 / 客户 CAD 模型 / 告警规则配置化等）

---

## 问题日志

| 日期 | 问题 | 解决方案 | 状态 |
|---|---|---|---|
| 2026-04-17 | HDRI 文件无法自动下载 | 手动从 Polyhaven 下载 | 待处理 |

---

## 参考资源

| 资源 | 用途 | 链接 |
|---|---|---|
| Polyhaven | HDRI + PBR 纹理（免费 CC0）| https://polyhaven.com |
| Sketchfab | 工业 GLB 模型备选（搜 centrifugal pump CC0）| https://sketchfab.com |
| GrabCAD | 工程 CAD 模型转 GLB | https://grabcad.com |
