import * as THREE from 'three';
import * as React from 'react';

import create, { GetState, SetState, UseBoundStore } from 'zustand';

// import { XRSession } from 'three';

export type Camera = THREE.OrthographicCamera | THREE.PerspectiveCamera;
export type Raycaster = THREE.Raycaster & {
  enabled: boolean;
};

export type Size = { width: number; height: number };
export type Viewport = Size;

export type RootState = {
  glRenderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: Camera;

  controls: THREE.EventDispatcher | null;

  ar: boolean;
  arSession?: THREE.XRSession;
  setArSession: (session: THREE.XRSession) => void;

  set: SetState<RootState>;
  get: GetState<RootState>;
};

const context = React.createContext<UseBoundStore<RootState>>(null!);

// 返回一个 WebGLRenderer
const createRendererInstance = (
  canvas: HTMLCanvasElement
): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(canvas.width, canvas.height);

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor('#ecd9bd');

  return renderer;
};

export type StoreProps = {
  canvas: HTMLCanvasElement;

  ar?: boolean;
  arSessinInit?: THREE.XRSessionInit;
  orthographic?: boolean;
};

const createStore = (props: StoreProps): UseBoundStore<RootState> => {
  const { canvas, ar = false, arSessinInit = {}, orthographic = false } = props;

  const rootState = create<RootState>((set, get) => {
    const glRenderer = createRendererInstance(canvas);
    // Create default camera
    const camera = orthographic
      ? new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000)
      : new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(0, 1, 10);

    const scene = new THREE.Scene();

    return {
      glRenderer,
      scene,
      camera,

      controls: null,
      mouse: new THREE.Vector2(),

      set,
      get,

      ar,
      arSessinInit,
      setArSession: (arSession: THREE.XRSession) => {
        set(() => ({
          ar: true,
          arSession: arSession,
        }));
      },
    };
  });

  return rootState;
};

export { createStore, context };
