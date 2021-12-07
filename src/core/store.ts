import * as THREE from 'three';
import { createContext } from 'react';

import create, { GetState, SetState, UseBoundStore } from 'zustand';
import { InteractionManager } from './events';

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

  interactionManager: InteractionManager;

  ar: boolean;
  arSession?: THREE.XRSession;
  setArSession: (session: THREE.XRSession) => void;

  set: SetState<RootState>;
  get: GetState<RootState>;
};

export type StoreProps = {
  canvas: HTMLCanvasElement;
  camera?: Camera;

  ar?: boolean;
  arSessinInit?: THREE.XRSessionInit;
};

const context = createContext<UseBoundStore<RootState>>(null!);

const createStore = (props: StoreProps): UseBoundStore<RootState> => {
  const { canvas, ar = false, arSessinInit = {}, camera: cameraProps } = props;
  let camera = cameraProps;

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

    if (!camera) {
      // Create default camera
      camera = new THREE.PerspectiveCamera(
        75,
        canvas.width && canvas.height ? canvas.width / canvas.height : 1,
        0.1,
        1000
      );
      camera.lookAt(0, 0, 0);
      camera.position.set(0, 10, 100);
    }

    const interactionManager = new InteractionManager(canvas, camera);

    const scene = new THREE.Scene();

    return {
      glRenderer,
      scene,
      camera,

      interactionManager,

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

  const { interactionManager } = rootState.getState();
  interactionManager.setContainer(rootState);

  return rootState;
};

export { createStore, context };
