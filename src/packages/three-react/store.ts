import * as THREE from 'three';
import { createContext } from 'react';

import create, { GetState, SetState, UseBoundStore } from 'zustand';
import { InteractionManager } from './events';
import { Observer } from './observer';
import { FrameCallback } from './loop';
import { getUuid } from './utils';

// import { XRSession } from 'three';

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

  // 每帧执行
  frameCallbacks: Map<string, FrameCallback>;
  // 三维物体事件绑定
  interactionManager: InteractionManager;
  // 外部控件事件绑定
  uiObserver: Observer;

  set: SetState<RootState>;
  get: GetState<RootState>;
};

export type StoreProps = {
  canvas: HTMLCanvasElement;
  camera?: Camera;

  ar?: boolean;
};

const context = createContext<UseBoundStore<RootState>>(null!);

const createStore = (props: StoreProps): UseBoundStore<RootState> => {
  const { canvas, camera: cameraProps } = props;
  let camera: Camera;

  const rootState = create<RootState>((set, get) => {
    const glRenderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      canvas,
      antialias: true,
      alpha: true,
    });
    glRenderer.setSize(canvas.width, canvas.height);
    glRenderer.outputEncoding = THREE.sRGBEncoding;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;

    if (!cameraProps) {
      // Create default camera
      camera = new THREE.PerspectiveCamera(
        75,
        canvas.width && canvas.height ? canvas.width / canvas.height : 1,
        0.1,
        1000
      );
    } else {
      camera = cameraProps;
      camera.aspect = canvas.width / canvas.height;
      camera.updateProjectionMatrix();
    }

    const interactionManager = new InteractionManager(canvas, camera);

    const scene = new THREE.Scene();

    const glRender = () => {
      glRenderer.render(scene, camera);
    };
    const frameCallbacks = new Map<string, FrameCallback>();
    frameCallbacks.set(getUuid(), glRender);

    return {
      glRenderer,
      scene,
      camera,
      frameCallbacks,
      interactionManager,
      uiObserver: new Observer(),

      set,
      get,
    };
  });

  const { interactionManager } = rootState.getState();
  interactionManager.setContainer(rootState);

  return rootState;
};

export { createStore, context };