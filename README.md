# 真实感 WebAR 组件化开发方案

基于 React、Three.js 和 WebXR Device API，组件化开发环境感知的 Web AR 应用。

其它工具 🔧：

- vite
- TypeScript
- pnpm

## Web 3D 组件化

- 拓展 JSX 内置元素，使用 TypeScript 限定 Props，设计基础 3D 对象标签；
- 以 Three.js Scene 为渲染目标，实现 React 3D 渲染器；
- 实现与 React-DOM 的衔接。主要为实现场景组件作为 3D 内容绘制的 2D 画布入口，接管三维场景的初始化和帧循环；
- 基于 React Hooks，提供常用状态逻辑复用，包括：数据共享、帧循环介入以及 3D 模型加载；
- 支持 3D 组件鼠标事件绑定。

## 真实感 Web AR 的环境融合渲染

- 基于 WebXR Device API 深度感知（Depth Sensing）模块提供的环境深度图和 Shader 编程，实现基于深度计算的遮挡处理方法；

- 基于光照估计（Lighting Estimation）模块和 Three.js 光源类，实现虚拟场景的环境光照渲染与阴影投射；

- 基于 Hit Test 和 DOM Overlay 模块，使用发布订阅模式实现交互支持。
