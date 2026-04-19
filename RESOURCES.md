# 资源获取指南

> 记录项目所需各类资源的获取途径、推荐链接和使用注意事项。
> 所有资源优先选择 **CC0 / 免费商用** 协议，确保可用于客户交付物。

---

## 一、3D 模型

### 推荐资源站

| 站点 | 特点 | 链接 |
|---|---|---|
| **Sketchfab** | 最大社区模型库，支持直接导出 GLB/GLTF，大量免费可下载 | https://sketchfab.com |
| **GrabCAD** | 工程师上传的真实 CAD 模型，质量高，需转换为 GLB | https://grabcad.com |
| **Poly.pizza** | 轻量低面数模型，全部 CC0，适合场景装饰物 | https://poly.pizza |
| **Polyhaven Models** | CC0，数量少但质量高 | https://polyhaven.com/models |
| **Fab.com** | Epic 旗下，含大量工业/机械资产（部分免费） | https://fab.com |

### 本项目推荐模型（离心泵）

| 模型名 | 来源 | URL | 说明 |
|---|---|---|---|
| Centrifugal Pump + Motor + Piping | Sketchfab | https://sketchfab.com/3d-models/centrifugal-pump-bomba-centrifuga-a49b7e1567714040826fc6a24c4e8a7d | **首选**，含电机+管道+仪表，完整工业装配体 |
| Animated Centrifugal Pump | Sketchfab | https://sketchfab.com/3d-models/animated-centrifugal-pump-f7bb5a8cb46c4ffeaaeee6b527bb0b4e | 含旋转动画，可复用叶轮动画逻辑 |
| Horizontal End Suction Pump | Sketchfab | https://sketchfab.com/3d-models/centrifugal-pump-horizontal-end-suction-dee0b9325925453eb20acfcbeb1add91 | 卧式单级离心泵，化工风格 |

**下载步骤（Sketchfab）：**
1. 打开模型页面 → 点击 **Download** 按钮
2. 选择格式：**GLTF** 或 **GLB**（若无，选 OBJ/FBX 后用 Blender 转换）
3. 解压后将 `.glb` 文件放入项目 `public/models/pump.glb`

**GrabCAD 转 GLB 流程：**
1. 下载 STEP/STP 文件
2. 用 **Blender**（免费）：File → Import → STEP → 调整材质 → Export as GLB
3. 推荐 Blender 插件：`STEPper` 或原生 STEP 导入（Blender 3.6+）

---

## 二、HDRI 环境贴图

### 资源站

| 站点 | 特点 | 链接 |
|---|---|---|
| **Polyhaven** | 最佳，全部 CC0，高质量，1K/2K/4K 可选 | https://polyhaven.com/hdris |
| **HDRI Hub** | 质量高，部分免费 | https://www.hdri-hub.com/free-hdri |
| **iHDRI** | 室外/自然类居多，部分免费 | https://www.ihdri.com |

### 适合工业机械场景的 HDRI 类型

| 类型 | 视觉效果 | Polyhaven 推荐搜索词 |
|---|---|---|
| **铸造/锻造车间** | 暖橙色炉火反射，最具工业感 | `foundry` `forge` |
| **工厂车间** | 日光灯管反射，中性工业感 | `factory` `workshop` `hanger` |
| **摄影棚** | 干净高光，偏产品展示风 | `studio` `photostudio` |
| **停车场/机库** | 顶部格栅灯反射，适合重型设备 | `parking` `garage` |

**本项目已用：** `industrial_workshop_foundry_1k.hdr` ← 铸造车间，**最佳选择，无需更换**

> ⚠️ 避免使用：户外天空、自然风景、市场/街道类 HDRI  
> 原因：金属表面会反射出天空蓝色或街道场景，与工业机械语境不符

---

## 三、PBR 材质贴图

| 站点 | 特点 | 链接 |
|---|---|---|
| **Polyhaven Textures** | CC0，含 Metal、Roughness、Normal 全套贴图 | https://polyhaven.com/textures |
| **ambientCG** | CC0，质量高，分类清晰 | https://ambientcg.com |
| **freepbr.com** | 部分免费，偏工业/建筑材质 | https://freepbr.com |

**本项目推荐贴图（可选，当前用程序化材质已够）：**
- 不锈钢：搜索 `brushed metal` / `stainless steel`
- 铸铁：搜索 `cast iron` / `rusted metal`
- 橡胶：搜索 `rubber` / `black rubber`

下载后放入 `public/textures/` 目录，在材质中通过 `TextureLoader` 加载。

---

## 四、GIS 数据（Demo 3 备用）

| 数据类型 | 站点 | 链接 | 说明 |
|---|---|---|---|
| 全球矢量边界 | Natural Earth | https://naturalearthdata.com | 国家/省级边界，GeoJSON/SHP |
| 全球地图底图 | OpenStreetMap | https://www.openstreetmap.org | 免费，需遵守 ODbL 协议 |
| 卫星影像底图 | USGS Earth Explorer | https://earthexplorer.usgs.gov | 免费，注册后下载 |
| 工业设施数据 | OpenInfraMap | https://openinframap.org | 电力/管道/水务基础设施 |
| 三维地形 | Cesium ion | https://cesium.com/ion | 免费层，全球 3D Tiles |

**前端渲染 GIS 推荐库：**
- Three.js + GeoJSON → 自定义挤出多边形（适合本项目 Demo 3）
- `deck.gl` → 大数据量地图可视化
- `Mapbox GL JS` → 需 API Key，效果最佳

---

## 五、图标 / UI 素材

| 类型 | 站点 | 链接 |
|---|---|---|
| SVG 图标 | Lucide | https://lucide.dev（已集成） |
| 工业/机械图标 | Flaticon（免费层）| https://flaticon.com |
| 动画图标 | LottieFiles | https://lottiefiles.com |

---

## 六、字体

当前项目使用系统等宽字体降级栈（无网络依赖）：
```
JetBrains Mono → Fira Code → Cascadia Code → Consolas → ui-monospace
```

若需在部署版本中保证字体一致性，可将字体文件本地化：
- JetBrains Mono 下载：https://www.jetbrains.com/lp/mono/（免费，OFL 协议）
- 放入 `public/fonts/` 并在 `index.css` 中用 `@font-face` 声明

---

## 七、音效（可选，提升 Demo 沉浸感）

| 类型 | 站点 | 链接 |
|---|---|---|
| 工业音效 | Freesound | https://freesound.org（CC0 过滤）|
| UI 音效 | ZapSplat | https://www.zapsplat.com（免费注册）|

推荐音效：泵运行低频振动声、AI 命令确认音、告警蜂鸣声

---

## 资源存放目录规范

```
public/
├── hdri/
│   └── industrial_workshop_foundry_1k.hdr   ✅ 已就位
├── models/
│   └── pump.glb                              ← 待放入
├── textures/                                 ← 按需放入
│   ├── metal_roughness.jpg
│   └── ...
└── fonts/                                    ← 按需放入
    └── JetBrainsMono-Regular.woff2
```
