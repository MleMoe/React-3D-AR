import {
  Scene,
  XRViewerPose,
  PerspectiveCamera,
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
  Quaternion,
  Material,
  XRRigidTransform,
} from 'three'
import { RootState } from '../react-3d/store'
import { DepthRawTexture } from './texture'
import { XRSystem } from './types'
import { Observer } from '../react-3d/observer'
import { XRCPUDepthInformation } from './types'
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight'

export type HitState = {
  visible: boolean
  position: Vector3
  rotation: Quaternion
  hitTestResult?: XRHitTestResult
}

export class ARManager {
  root?: RootState
  scene: Scene | null
  camera: PerspectiveCamera | null
  renderer: WebGLRenderer | null

  isARSupport: boolean | null
  session: XRSession | null

  gl: WebGLRenderingContext | null
  resolution: Vector2

  canvas: HTMLCanvasElement | null
  overlay: HTMLDivElement | null
  overlayCanvas: HTMLCanvasElement | null
  uiObserver: Observer | null

  onSessionStarted: ((root: RootState, session: THREE.XRSession) => void) | null

  viewerPose: XRViewerPose | null

  hitTestSourceRequested: boolean
  xrHitTestSource: XRHitTestSource | null
  hitState: HitState
  onAfterHitTest: Map<number, (hit: HitState) => void>

  depthRawTexture: DepthRawTexture
  // depthDataTexture: DepthDataTexture;
  onAfterDepthInfo: Map<number, (depthInfo: XRCPUDepthInformation) => void>

  xrLight?: XREstimatedLight

  floorMesh: Mesh

  lastTime: number

  transformARMaterial: (
    material: Material,
    depthMap: DepthRawTexture
  ) => Material

  constructor() {
    this.transformARMaterial = ARManager.transformARMaterial
    this.viewerPose = null

    this.scene = null
    this.camera = null
    this.renderer = null

    this.isARSupport = null
    this.session = null

    this.gl = null
    this.resolution = new Vector2(window.innerWidth, window.innerHeight)

    this.canvas = null
    this.overlay = null
    this.overlayCanvas = null
    this.uiObserver = null

    this.onSessionStarted = null

    this.hitTestSourceRequested = false
    this.xrHitTestSource = null
    this.hitState = {
      visible: false,
      position: new Vector3(),
      rotation: new Quaternion(),
    }
    this.onAfterHitTest = new Map()

    this.depthRawTexture = new DepthRawTexture()
    // this.depthDataTexture = new DepthDataTexture();
    this.onAfterDepthInfo = new Map()

    this.floorMesh = new Mesh(
      new PlaneBufferGeometry(100, 100, 1, 1),
      new ShadowMaterial({ opacity: 0.5 })
    )
    // this.floorMesh.position.y = -10;
    this.floorMesh.rotation.set(-Math.PI / 2, 0, 0)
    this.floorMesh.castShadow = false
    this.floorMesh.receiveShadow = true

    this.lastTime = 0
  }

  setAttributesFromRoot(root: RootState) {
    this.root = root
    const { scene, glRenderer, camera, uiObserver } = root
    this.scene = scene
    this.renderer = glRenderer

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.sortObjects = false
    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.xr.enabled = true

    this.camera = camera
    this.canvas = glRenderer.domElement
    this.resolution.set(this.canvas.width, this.canvas.height)
    // @ts-ignore
    this.gl = glRenderer.getContext()

    this.uiObserver = uiObserver

    this.xrLight = new XREstimatedLight(glRenderer)

    this.xrLight?.addEventListener('estimationstart', () => {
      console.log('启动光估计')

      if (this.xrLight) {
        // scene.add(this.xrLight.directionalLight);
        // scene.add(this.xrLight.lightProbe);
        this.xrLight.directionalLight.castShadow = true
      }
      this.updateEnvironment((this.xrLight as XREstimatedLight).environment)
    })

    this.xrLight.addEventListener('estimationend', () => {
      console.log('结束光估计')
      scene.remove(this.xrLight as XREstimatedLight)
      this.updateEnvironment(null)
    })

    this.depthRawTexture.initTexture(glRenderer.getContext())

    // this.scene.add(this.floorMesh);
  }

  async startAR(
    sessionInit: XRSessionInit,
    onSessionStarted?: (root: RootState, session: XRSession) => any,
    onError?: () => any
  ) {
    if (!this.session) {
      const xr = (navigator as any).xr as XRSystem
      this.isARSupport = await xr.isSessionSupported('immersive-ar')
      if (!this.isARSupport) {
        onError?.()
        return
      }

      this.session = await xr.requestSession('immersive-ar', sessionInit)
      if (this.session && this.root) {
        this.renderer?.xr.setReferenceSpaceType('local')
        await this.renderer?.xr.setSession(this.session)

        const { interactionManager, glRenderer, camera } = this.root
        const { setCamera, setResponseDom } = interactionManager
        setCamera(
          // @ts-ignore
          glRenderer.xr.getCamera() as THREE.PerspectiveCamera
        )
        camera.fov = glRenderer.domElement.width / glRenderer.domElement.height

        onSessionStarted?.(this.root, this.session)
        this.overlay &&
          this.root.interactionManager.setResponseDom(this.overlay)

        this.onSessionStarted?.(this.root, this.session)
      }
    }
  }

  reset() {
    this.session?.end()
    this.xrHitTestSource?.cancel()

    this.viewerPose = null

    this.isARSupport = null
    this.session = null

    this.gl = null
    this.resolution = new Vector2(window.innerWidth, window.innerHeight)
    this.camera?.position.set(0, 0, 0)
    this.camera?.lookAt(0, 0, -1)

    this.camera?.updateProjectionMatrix()

    this.canvas = null
    this.overlayCanvas = null
    this.uiObserver = null

    this.hitTestSourceRequested = false
    this.xrHitTestSource = null
    this.hitState = {
      visible: false,
      position: new Vector3(),
      rotation: new Quaternion(),
    }
    this.onAfterHitTest = new Map()

    // this.depthDataTexture = new DepthDataTexture();
    this.onAfterDepthInfo = new Map()
  }

  updateEnvironment(envMap: Texture | null) {
    this.scene?.traverse((object) => {
      if (object.type === 'Mesh') {
        // @ts-ignore
        if ((object as Mesh).material.userData?.isARMaterial) {
          // @ts-ignore
          ;(object as Mesh).material.envMap = envMap
          object.castShadow = true
        }
      }
    })
  }

  static transformARMaterial(material: Material, depthMap: DepthRawTexture) {
    material.userData = {
      isARMaterial: true,
      uniforms: {
        uScreenDepthTexture: { value: depthMap.texture }, // aaaaa
        uWidth: { value: 1.0 },
        uHeight: { value: 1.0 },
        uUvTransform: { value: new Matrix4() },
        uOcclusionEnabled: { value: true },
        uRawValueToMeters: { value: 0.001 },
      },
    }

    material.onBeforeCompile = (shader) => {
      material.needsUpdate = true

      for (let i in material.userData.uniforms) {
        shader.uniforms[i] = material.userData.uniforms[i]
      }

      shader.vertexShader =
        `
			varying float vDepth;
			` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <fog_vertex>',
        `
			#include <fog_vertex>

			vDepth = gl_Position.z;
			`
      )

      shader.fragmentShader =
        `
      uniform float uWidth;
			uniform float uHeight;
      uniform sampler2D uScreenDepthTexture;
      uniform mat4 uUvTransform;
      uniform float uRawValueToMeters;

			uniform bool uOcclusionEnabled;
      varying float vDepth;

			` + shader.fragmentShader

      const fragmentEntryPoint = '#include <clipping_planes_fragment>'

      shader.fragmentShader = shader.fragmentShader.replace(
        fragmentEntryPoint,
        `
    ${fragmentEntryPoint}
      
    if(uOcclusionEnabled){
      float x = gl_FragCoord.x / uWidth;
			float y = gl_FragCoord.y / uHeight;
      vec2 texCoord = (uUvTransform * vec4(x, 1.0 - y, 0.0, 1.0)).xy;

      vec2 packedDepth = texture2D(uScreenDepthTexture, texCoord).ra;
      float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m

      if (depth < gl_FragCoord.z / gl_FragCoord.w) {
          discard;
      }
    }
      `
      )
    }

    return material
  }

  static updateNormalUniforms(
    scene: Scene,
    normTextureFromNormViewMatrix: XRRigidTransform,
    rawValueToMeters: number
  ) {
    scene.traverse(function (child) {
      if (child instanceof Mesh) {
        if (child.material && child.material.userData?.isARMaterial) {
          // if (child.material.userData?.isCollisionMaterial) {
          //   child.material.userData.uniforms.uRawValueToMeters.value =
          //     rawValueToMeters;
          //   child.material.userData.uniforms.uUvTransform.value.fromArray(
          //     normTextureFromNormViewMatrix.matrix
          //   );
          // } else {
          if (!child.material.userData.uniforms.uOcclusionEnabled.value) {
            child.material.userData.uniforms.uOcclusionEnabled.value = true
          }

          child.material.userData.uniforms.uWidth.value = Math.floor(
            window.devicePixelRatio * window.innerWidth
          )
          child.material.userData.uniforms.uHeight.value = Math.floor(
            window.devicePixelRatio * window.innerHeight
          )

          child.material.userData.uniforms.uRawValueToMeters.value =
            rawValueToMeters
          child.material.userData.uniforms.uUvTransform.value.fromArray(
            normTextureFromNormViewMatrix.matrix
          )
          // }

          child.material.uniformsNeedUpdate = true
        }
      }
    })
  }

  render(time: number, frame?: XRFrame) {
    // let delta = time - this.lastTime;
    // this.lastTime = time;

    if (!frame) {
      return
    }

    if (!this.renderer || !this.scene) {
      return
    }

    // if (!this.overlayCanvas) {
    //   this.overlayCanvas = document.getElementsByClassName(
    //     'overlay-canvas'
    //   )[0] as HTMLCanvasElement;
    // }

    // this.world.step(delta / 1e3);

    const session = frame.session
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    if (!referenceSpace) {
      return
    }

    if (!this.hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => {
            this.xrHitTestSource = source
          })
      })

      this.hitTestSourceRequested = true
    }

    if (this.xrHitTestSource && referenceSpace) {
      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource)
      hitTestResults.forEach((hit) => {
        const pose = hit.getPose(referenceSpace)
        if (pose) {
          this.hitState.visible = true
          this.hitState.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          )
          this.hitState.rotation.set(
            pose.transform.orientation.x,
            pose.transform.orientation.y,
            pose.transform.orientation.z,
            pose.transform.orientation.w
          )
          this.hitState.hitTestResult = hit
          this.onAfterHitTest.forEach((fn) => {
            this.hitState && fn(this.hitState)
          })
          this.floorMesh.position.y = this.hitState.position.y
        }
      })
      if (!hitTestResults.length) {
        this.hitState.visible = false
      }
    }

    const viewerPose = frame.getViewerPose(referenceSpace)
    if (viewerPose) {
      this.viewerPose = viewerPose
      for (const view of this.viewerPose.views) {
        const depthData: XRCPUDepthInformation =
          // @ts-ignore
          frame.getDepthInformation?.(view)
        if (depthData) {
          this.depthRawTexture.updateTexture(depthData)
          // this.depthDataTexture.updateDepth(depthData);

          ARManager.updateNormalUniforms(
            this.scene,
            depthData.normDepthBufferFromNormView,
            depthData.rawValueToMeters
          )

          this.onAfterDepthInfo.forEach((fn) => {
            this.hitState && fn(depthData)
          })
        }
      }
    }
  }
}
