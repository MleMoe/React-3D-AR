# React-3D-AR

一个基于 WebXR Device API 标准的 WebAR 应用开发方案，可以体验到：

- 无缝衔接的 React 开发体验，组件化编写 3D 场景
- 无标识物跟踪的 AR 体验，虚实物体的正确遮挡效果，环境光照渲染

<!-- markdownlint-disable -->
<div align=center>
<img src="https://github.com/MleMoe/React-3D-AR/blob/main/public/images/occlussion.jpeg" height=300/>
<img src="https://github.com/MleMoe/React-3D-AR/blob/main/public/images/occlussion-2.jpeg" height=300/>
<img src="https://github.com/MleMoe/React-3D-AR/blob/main/public/images/shadow.jpeg" height=300/>
</div>
<!-- markdownlint-restore -->

## 工具 🔧

- React，主要使用 [React-Reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler)、JSX 和 Hooks
- Three.js，基础 3D 图形库
- [WebXR Device API](https://immersive-web.github.io/webxr/)，W3C WebXR 标准
- vite，构建和开发
- TypeScript，类型限定
- pnpm，包管理

## 实现 👷‍♀️

### React-3D：Web 3D 组件化

- 拓展 JSX 内置元素，使用 TypeScript 限定 Props，设计基础 3D 对象标签；
- 以 Three.js Scene 为渲染目标，实现 React 3D 渲染器；
- 实现与 React-DOM 的衔接。主要为实现场景组件作为 3D 内容绘制的 2D 画布入口，接管三维场景的初始化和帧循环；
- 基于 React Hooks，提供常用状态逻辑复用，包括：数据共享、帧循环介入以及 3D 模型加载；
- 支持 3D 组件鼠标事件绑定。

### Web AR 环境融合渲染

- 如下图，基于 WebXR Device API 深度感知（Depth Sensing）模块提供的环境深度图和 Shader 编程，介入图形渲染管线，实现基于深度计算的遮挡处理方法；

<div align=center><img src="https://github.com/MleMoe/React-3D-AR/blob/main/public/images/occulusion-flow.png" height="300"/></div>

- 基于光照估计（Lighting Estimation）模块和 Three.js 光源类，实现虚拟场景的环境光照渲染与阴影投射；

- 基于 Hit Test 和 DOM Overlay 模块，使用发布订阅模式实现交互支持。
