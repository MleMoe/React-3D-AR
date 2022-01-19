import * as THREE from 'three';
import { createContext } from 'react';

import { InteractionManager } from './events';
import { Observer } from './observer';
import { FrameCallback } from './loop';
import { getUuid } from './utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WebGLRenderer } from 'three';

export type Camera = THREE.PerspectiveCamera;
export type Raycaster = THREE.Raycaster & {
  enabled: boolean;
};

export type Size = { width: number; height: number };
export type Viewport = Size;

export type RootState = {
  glRenderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: Camera;

  onBeforeRender: Map<number, FrameCallback>;
  onAfterRender: Map<number, FrameCallback>;

  // 每帧执行
  frameCallbacks: Map<string, FrameCallback>;
  // 三维物体事件绑定
  interactionManager: InteractionManager;
  // three.js orbit 控制器
  orbitControl?: OrbitControls;
  // 外部控件事件绑定
  uiObserver: Observer;

  ar: any;
};

export type StoreProps = {
  canvas: HTMLCanvasElement;
  camera?: Camera;
  renderer?: WebGLRenderer;
  ar?: any;
  control?: boolean;
};

const context = createContext<RootState>(null!);

const createStore = (props: StoreProps): RootState => {
  const { canvas, camera: cameraProps, control, renderer, ar } = props;

  const glRenderer =
    renderer ??
    new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      canvas,
      alpha: true,
      depth: true,
      precision: 'highp',
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      logarithmicDepthBuffer: false,
      stencil: true,
    });
  glRenderer.domElement = glRenderer.domElement ?? canvas;
  glRenderer.setSize(canvas.width, canvas.height);

  let camera: Camera =
    cameraProps ??
    new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 10);
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();

  const interactionManager = new InteractionManager(canvas, camera);

  const scene = new THREE.Scene();

  const onBeforeRender = new Map<number, FrameCallback>();
  const onAfterRender = new Map<number, FrameCallback>();

  const render = (time?: number, frame?: THREE.XRFrame) => {
    onBeforeRender.forEach((callbackfn) => callbackfn(time, frame));
    glRenderer.render(scene, camera);
    onAfterRender.forEach((callbackfn) => callbackfn(time, frame));
  };

  const arRender = (time?: number, frame?: THREE.XRFrame) => {
    // ar 处理
    ar?.render(time, frame);
  };
  const frameCallbacks = new Map<string, FrameCallback>();
  frameCallbacks.set('0-arRender', arRender);
  frameCallbacks.set('0-render', render);

  const rootState = {
    glRenderer,
    scene,
    camera,
    onBeforeRender,
    onAfterRender,
    frameCallbacks,
    interactionManager,
    ...(control ? { orbitControl: new OrbitControls(camera, canvas) } : {}),
    uiObserver: new Observer(),
    ar: ar ?? {},
  };

  interactionManager.setContainer(rootState);

  return rootState;
};

export { createStore, context };
