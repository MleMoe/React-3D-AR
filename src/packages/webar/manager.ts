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
  Mesh,
  ShadowMaterial,
  PlaneBufferGeometry,
  MeshPhongMaterial,
} from 'three';
import { RootState } from '../three-react/store';
import { DepthDataTexture, DepthRawTexture } from './texture';
import { transformARMaterial, updateNormalUniforms } from './material';
import { XRSystem } from './hooks';
import { Observer } from '../three-react/observer';
import { XRCPUDepthInformation } from './types';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';
import {
  World,
  NaiveBroadphase,
  GSSolver,
  SplitSolver,
  Body,
  Vec3,
  Plane,
} from 'cannon-es';

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

  depthRawTexture: DepthRawTexture;
  depthDataTexture: DepthDataTexture;
  onAfterDepthInfo: Map<number, (depthInfo: XRCPUDepthInformation) => void>;

  xrLight?: XREstimatedLight;

  shadowMaterial: ShadowMaterial;
  floorMesh: Mesh;

  lastTime: number;
  world: World;
  floor: Body;

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

    this.depthRawTexture = new DepthRawTexture();
    this.depthDataTexture = new DepthDataTexture();
    this.onAfterDepthInfo = new Map();

    this.shadowMaterial = new MeshPhongMaterial({
      opacity: 0.5,
      color: 0x00ffff,
      transparent: true,
    });

    this.floorMesh = new Mesh(
      new PlaneBufferGeometry(100, 100, 1, 1),
      this.shadowMaterial
    );
    this.floorMesh.rotation.set(-Math.PI / 2, 0, 0);
    this.floorMesh.castShadow = false;
    this.floorMesh.receiveShadow = true;

    this.lastTime = 0;

    this.world = new World({ gravity: new Vec3(0, -9.82, 0) });
    // this.world.gravity.set(0, -9.8, 0);
    this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
    this.world.defaultContactMaterial.contactEquationRelaxation = 4;
    this.world.quatNormalizeSkip = 0;
    this.world.quatNormalizeFast = false;

    this.world.broadphase = new NaiveBroadphase();
    this.world.broadphase.useBoundingBoxes = true;

    var solver = new GSSolver();
    solver.tolerance = 0.1;
    solver.iterations = 7;
    // @ts-ignore
    this.world.solver = new SplitSolver(solver);

    this.floor = new Body();
    this.floor.type = Body.STATIC;
    this.floor.position.set(0, 0, 0);
    this.floor.velocity.set(0, 0, 0);
    this.floor.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
    this.floor.addShape(new Plane());
    this.world.addBody(this.floor);
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

    this.depthRawTexture.initTexture(glRenderer.getContext());

    this.shadowMaterial = transformARMaterial(
      this.shadowMaterial,
      this.depthRawTexture
    ) as ShadowMaterial;

    this.scene.add(this.floorMesh);
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
  }

  updateEnvironment(envMap: Texture | null) {
    this.scene?.traverse((object) => {
      if (object.type === 'Mesh') {
        // @ts-ignore
        (object as Mesh).material.envMap = envMap;
      }
    });
  }

  render(time: number, frame?: XRFrame) {
    // let delta = time - this.lastTime;
    // this.lastTime = time;

    if (!frame) {
      return;
    }

    if (!this.renderer || !this.scene) {
      return;
    }

    // this.world.step(delta / 1e3);

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
          if (this.hitState.position.y < this.floor.position.y) {
            this.floor.position.y = this.hitState.position.y;
          }
          this.floorMesh.position.y = this.hitState.position.y;
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
          this.depthRawTexture.updateTexture(depthData);
          this.depthDataTexture.updateDepth(depthData);
          updateNormalUniforms(
            this.scene,
            depthData.normDepthBufferFromNormView,
            depthData.rawValueToMeters
          );

          this.onAfterDepthInfo.forEach((fn) => {
            this.hitState && fn(depthData);
          });
        }
      }
    }
  }
}
