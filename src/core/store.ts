import * as THREE from 'three';
import { createContext } from 'react';

import create, { GetState, SetState, UseBoundStore } from 'zustand';
import { InteractionManager } from './events';

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

  frameCallbacks: (() => void)[];
  interactionManager: InteractionManager;

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
    const frameCallbacks = [glRender];

    return {
      glRenderer,
      scene,
      camera,
      frameCallbacks,
      interactionManager,

      set,
      get,
    };
  });

  const { interactionManager } = rootState.getState();
  interactionManager.setContainer(rootState);

  return rootState;
};

export { createStore, context };
