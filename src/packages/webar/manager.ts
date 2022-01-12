import {
  Scene,
  XRViewerPose,
  CanvasTexture,
  DataTexture,
  PerspectiveCamera,
  DirectionalLight,
  AmbientLight,
  WebGLRenderer,
  XRHitTestResult,
  XRHitTestSource,
  Vector2,
  Vector3,
  WebGLRenderingContext,
  PCFSoftShadowMap,
  XRFrame,
  Matrix4,
  XRSessionInit,
  XRSession,
  sRGBEncoding,
  Texture,
} from 'three';
import { RootState } from '../three-react/store';
import { DepthDataTexture } from './texture';
import { updateNormalUniforms } from './material';
import { XRSystem } from './hooks';
import { Observer } from '../three-react/observer';
import { XRCPUDepthInformation } from './types';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';

export type HitState = {
  visible: boolean;
  position?: Vector3;
  hitTestResult?: XRHitTestResult;
};

export class ARManager {
  root?: RootState;
  scene: Scene | null;
  camera: PerspectiveCamera | null;
  renderer: WebGLRenderer | null;

  isARSupport: boolean | null;
  session: XRSession | null;

  gl: WebGLRenderingContext | null;
  resolution: Vector2;

  canvas: HTMLCanvasElement | null;
  overlayCanvas: HTMLCanvasElement | null;
  uiObserver: Observer | null;

  viewerPose: XRViewerPose | null;

  hitTestSourceRequested: boolean;
  xrHitTestSource: XRHitTestSource | null;
  hitState: HitState;
  onAfterHitTest: Map<number, (hit: HitState) => void>;

  depthDataTexture: DepthDataTexture;
  onAfterDepthInfo: Map<number, (depthInfo: XRCPUDepthInformation) => void>;

  xrLight?: XREstimatedLight;

  constructor() {
    this.viewerPose = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.isARSupport = null;
    this.session = null;

    this.gl = null;
    this.resolution = new Vector2(window.innerWidth, window.innerHeight);

    this.canvas = null;
    this.overlayCanvas = null;
    this.uiObserver = null;

    this.hitTestSourceRequested = false;
    this.xrHitTestSource = null;
    this.hitState = {
      visible: false,
    };
    this.onAfterHitTest = new Map();

    this.depthDataTexture = new DepthDataTexture();
    this.onAfterDepthInfo = new Map();
  }

  setAttributesFromRoot(root: RootState) {
    this.root = root;
    const { scene, glRenderer, camera, uiObserver } = root;
    this.scene = scene;
    this.renderer = glRenderer;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.sortObjects = false;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    this.camera = camera;
    this.canvas = glRenderer.domElement;
    this.resolution.set(this.canvas.width, this.canvas.height);
    // @ts-ignore
    this.gl = glRenderer.getContext();

    this.uiObserver = uiObserver;

    this.xrLight = new XREstimatedLight(glRenderer);

    this.xrLight.addEventListener('estimationstart', () => {
      console.log('启动光估计');
      scene.add(this.xrLight as XREstimatedLight);
      this.updateEnvironment((this.xrLight as XREstimatedLight).environment);
    });

    this.xrLight.addEventListener('estimationend', () => {
      console.log('结束光估计');
      scene.remove(this.xrLight as XREstimatedLight);
      this.updateEnvironment(null);
    });
  }

  async startAR(
    sessionInit: XRSessionInit,
    onSessionStarted: (root: RootState, session: XRSession) => any,
    onError?: () => any
  ) {
    if (this.session === null) {
      const xr = (navigator as any).xr as XRSystem;
      this.isARSupport = await xr.isSessionSupported('immersive-ar');
      if (!this.isARSupport) {
        onError?.();
        return;
      }

      this.session = await xr.requestSession('immersive-ar', sessionInit);
      if (this.session && this.root) {
        console.log(this.session);
        this.renderer?.xr.setReferenceSpaceType('local');
        await this.renderer?.xr.setSession(this.session);

        const { interactionManager, glRenderer, camera } = this.root;
        const { setCamera, setResponseDom } = interactionManager;
        setCamera(
          // @ts-ignore
          glRenderer.xr.getCamera() as THREE.PerspectiveCamera
        );
        camera.fov = glRenderer.domElement.width / glRenderer.domElement.height;

        this.root && onSessionStarted(this.root, this.session);
      }
    }
  }

  reset() {
    this.session?.end();
    this.xrHitTestSource?.cancel();

    this.viewerPose = null;

    this.isARSupport = null;
    this.session = null;

    this.gl = null;
    this.resolution = new Vector2(window.innerWidth, window.innerHeight);

    this.canvas = null;
    this.overlayCanvas = null;
    this.uiObserver = null;

    this.hitTestSourceRequested = false;
    this.xrHitTestSource = null;
    this.hitState = {
      visible: false,
    };
    this.onAfterHitTest = new Map();

    this.depthDataTexture = new DepthDataTexture();
    this.onAfterDepthInfo = new Map();

    this.xrLight = undefined;
  }

  updateEnvironment(envMap: Texture | null) {
    this.scene?.traverse((object) => {
      if (object.type === 'Mesh') {
        // @ts-ignore
        (object as Mesh).material.envMap = envMap;
      }
    });
  }

  render(time?: number, frame?: XRFrame) {
    if (!frame) {
      return;
    }
    if (!this.renderer || !this.scene) {
      return;
    }
    const session = frame.session;
    const referenceSpace = this.renderer.xr.getReferenceSpace();
    if (!referenceSpace) {
      return;
    }

    if (!this.hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => {
            this.xrHitTestSource = source;
          });
      });

      this.hitTestSourceRequested = true;
    }

    if (this.xrHitTestSource && referenceSpace) {
      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
      if (hitTestResults.length) {
        const hit = hitTestResults[0];

        const pose = hit.getPose(referenceSpace);
        if (pose) {
          this.hitState.visible = true;
          this.hitState.position = new Vector3(0, 0, 0).applyMatrix4(
            new Matrix4().fromArray(pose.transform.matrix)
          );
          this.hitState.hitTestResult = hit;
          this.onAfterHitTest.forEach((fn) => {
            this.hitState && fn(this.hitState);
          });
        }
      } else {
        this.hitState.visible = false;
      }
    }

    const viewerPose = frame.getViewerPose(referenceSpace);
    if (viewerPose) {
      this.viewerPose = viewerPose;
      for (const view of this.viewerPose.views) {
        const depthData: XRCPUDepthInformation =
          // @ts-ignore
          frame.getDepthInformation(view);
        if (depthData) {
          this.depthDataTexture.updateDepth(depthData);
          this.onAfterDepthInfo.forEach((fn) => {
            this.hitState && fn(depthData);
          });
          updateNormalUniforms(
            this.scene,
            depthData.normDepthBufferFromNormView
          );
        }
      }
    }
  }
}
