import {
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { RootState } from '../three-react/store';
import {
  Vector3,
  Matrix4,
  XRSessionInit,
  XRSession,
  XRSessionMode,
  XRHitTestSource,
  XRHitTestResult,
  XRReferenceSpace,
  XRFrame,
  XRPose,
  XRPlane,
  Quaternion,
  XRRigidTransform,
  Material,
  Vector2,
  Shader,
  MeshPhongMaterial,
  Mesh,
  Object3D,
} from 'three';
import { useFrame, useStore, useThree } from '../three-react/hooks';
import { getUuid } from '../three-react/utils';
import { ARManager } from './manager';
import { transformARMaterial } from './material';
import { Body, Sphere } from 'cannon-es';

export function useARManager() {
  const { ar } = useStore();
  const {
    hitState,
    onAfterHitTest,
    depthRawTexture,
    depthDataTexture,
    onAfterDepthInfo,
    world,
  } = useMemo<ARManager>(() => ar, []);
  return {
    hitState,
    onAfterHitTest,
    depthRawTexture,
    depthDataTexture,
    onAfterDepthInfo,
    world,
  };
}

export function useARMaterial(material: Material) {
  const { depthRawTexture } = useARManager();
  const [key] = useState(() => getUuid());

  const { onAfterDepthInfo } = useARManager();

  const shaderRef = useRef<{ shader?: Shader; modified: boolean }>({
    modified: false,
  });

  const [depthMaterial] = useState(() => {
    material.needsUpdate = true;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uScreenSize = {
        value: new Vector2(window.innerWidth, window.innerHeight),
      };
      shader.uniforms.uScreenDepthTexture = { value: depthRawTexture };
      shader.uniforms.uRawValueToMeters = { value: 1.0 };
      shader.uniforms.uUvTransform = { value: new Matrix4() };
      shader.uniforms.uModified = { value: false };

      shader.fragmentShader =
        `
        uniform bool uModified;
        uniform vec2 uScreenSize;
        uniform sampler2D uScreenDepthTexture;
        uniform mat4 uUvTransform;
        uniform float uRawValueToMeters;
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        'void main() {\n' +
          `
    if(uModified){
      // fragment position in screen space
      vec2 screenSpace = gl_FragCoord.xy / uScreenSize;
      // transform depth uv to be normalized to screen space
      vec2 texCoord = (uUvTransform * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
      // get luminance alpha components from depth texture
      vec2 packedDepth = texture2D(uScreenDepthTexture, texCoord).ra;
      // unpack into single value in millimeters
      float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m

      // check if fragment is behind depth value
      if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
          // then do not render
          discard;
      }
    }
        
      `
      );

      material.userData.shader = shader;

      shaderRef.current = { ...shaderRef.current, shader };
    };
    material.customProgramCacheKey = function () {
      return key;
    };

    return material;
  });

  useEffect(() => {
    const onGetDepthInfoCallback = (depthInfo: XRCPUDepthInformation) => {
      if (!depthInfo || !shaderRef.current.shader) {
        return;
      }
      if (!shaderRef.current.modified) {
        shaderRef.current.modified = true;
        shaderRef.current.shader.uniforms.uModified.value = true;
      }

      shaderRef.current.shader.uniforms.uScreenDepthTexture.value =
        depthRawTexture;
      shaderRef.current.shader.uniforms.uRawValueToMeters.value =
        depthInfo.rawValueToMeters;
      shaderRef.current.shader.uniforms.uUvTransform.value =
        depthInfo.normDepthBufferFromNormView.matrix;
    };

    onAfterDepthInfo.set(0, onGetDepthInfoCallback);

    return () => {
      onAfterDepthInfo.delete(0);
    };
  }, []);

  return depthMaterial;
}

export function usePhysicsObject(
  objRef: React.MutableRefObject<Object3D<THREE.Event> | undefined>
) {
  const { world } = useARManager();
  const { body } = useMemo(() => {
    const body = new Body({ shape: new Sphere(0.1) });
    body.type = Body.DYNAMIC;
    body.mass = 1.0;
    world.addBody(body);
    return { body };
  }, []);

  useEffect(() => {
    if (!objRef.current) {
      console.log('obj is empty');
      return;
    }
    const obj = objRef.current;
    obj.onBeforeRender = () => {
      obj.position.set(body.position.x, body.position.y, body.position.z);
      if (!body.fixedRotation) {
        const { x, y, z, w } = body.quaternion;
        obj.quaternion.set(x, y, z, w);
      }
      console.log('渲染');
    };

    return () => {
      obj.onBeforeRender = () => {};
    };
  }, []);

  return { body };
}

export interface XRSystem extends EventTarget {
  isSessionSupported: (sessionMode: XRSessionMode) => Promise<boolean>;
  requestSession: (
    sessionMode: XRSessionMode,
    sessionInit?: any
  ) => Promise<XRSession>;
}

export function useAR() {
  const [xr] = useState(() => {
    if ('xr' in navigator) {
      return (navigator as any).xr as XRSystem;
    }
  });
  const [support, setSupport] = useState<boolean>();
  const [arSession, setArSession] = useState<XRSession>();
  const [inProgress, setInProgress] = useState(false);

  useLayoutEffect(() => {
    xr?.isSessionSupported('immersive-ar').then((isSupport) => {
      setSupport(isSupport);
    });
  }, []);

  const createARSession = useCallback(
    (
      sessionInit: XRSessionInit,
      onSessionStarted: (session: XRSession) => Promise<void>
    ) => {
      if (!xr || !support) {
        return { support: false };
      }
      if (arSession) {
        return;
      }
      xr.requestSession('immersive-ar', sessionInit).then((session) => {
        setArSession(session);
        onSessionStarted(session).then(() => {
          setInProgress(true);
        });
      });
    },
    [xr, support]
  );

  const disposeARSession = useCallback(() => {
    arSession?.end();
    setInProgress(false);
  }, [arSession]);

  return {
    support,
    inProgress,
    arSession,
    createARSession,
    disposeARSession,
  };
}

export type HitState = {
  visible: boolean;
  position: Vector3;
  hitTestResult?: XRHitTestResult;
};

export function useARHitTest() {
  const { glRenderer } = useThree();

  const hitRef = useRef<HitState>({
    visible: false,
    position: new Vector3(),
  });

  const onAfterGetHitStateRef = useRef<Map<string, (hit: HitState) => void>>(
    new Map()
  );

  const hitTestSource = useRef<XRHitTestSource | undefined>();
  const hitTestSourceRequested = useRef(false);

  const render = useCallback((time?: number, frame?: XRFrame) => {
    if (!frame) {
      return;
    }

    const session = glRenderer.xr.getSession();
    if (!session) return;

    if (!hitTestSourceRequested.current) {
      // const entityTypes: XRHitTestTrackableType[] = ['plane', 'mesh'];
      session
        .requestReferenceSpace('viewer')
        .then((referenceViewerSpace: XRReferenceSpace) => {
          session
            .requestHitTestSource({
              space: referenceViewerSpace,
              // entityTypes,
            })
            .then((source: XRHitTestSource) => {
              hitTestSource.current = source;
            });
        });
      session.addEventListener(
        'end',
        () => {
          hitTestSourceRequested.current = false;
          hitTestSource.current = undefined;
        },
        { once: true }
      );

      hitTestSourceRequested.current = true;
    }
    const referenceSpace = glRenderer.xr.getReferenceSpace();

    if (hitTestSource.current && referenceSpace) {
      const hitTestResults = frame.getHitTestResults(hitTestSource.current);
      hitRef.current.visible = false;

      if (hitTestResults.length) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        if (pose) {
          hitRef.current.visible = true;
          hitRef.current.position = new Vector3(0, 0, 0).applyMatrix4(
            new Matrix4().fromArray(pose.transform.matrix)
          );
          hitRef.current.hitTestResult = hit;

          onAfterGetHitStateRef.current.forEach((fn) => {
            fn(hitRef.current);
          });
        }
      }
    }
  }, []);
  useFrame(render);
  return { hitRef, onAfterGetHitStateRef };
}

export function useARImageTracking() {
  const imgPoseRef = useRef<XRPose>();

  const { glRenderer } = useStore();
  const [webXRManager] = useState(() => glRenderer.xr);

  const render = useCallback((time?: number, frame?: XRFrame) => {
    if (!frame) {
      return;
    }
    // @ts-ignore
    const results = frame.getImageTrackingResults();
    for (const result of results) {
      // The result's index is the image's position in the trackedImages array specified at session creation
      const imageIndex = result.index;
      const referenceSpace = webXRManager.getReferenceSpace();

      // Get the pose of the image relative to a reference space.
      // @ts-ignore
      const pose = frame?.getPose(result.imageSpace, referenceSpace);

      const state = result.trackingState;

      if (state == 'tracked') {
        imgPoseRef.current = pose;
        // HighlightImage(imageIndex, pose);
      } else if (state == 'emulated') {
        console.log(state, imageIndex, pose);
        // FadeImage(imageIndex, pose);
      }
    }
  }, []);

  useFrame(render);
  return { imgPoseRef };
}

export function useCameraAccess() {
  const { glRenderer } = useThree();
  const { glBinding, arSession } = useMemo(() => {
    const arSession = glRenderer.xr.getSession();
    if (!arSession) {
      return {};
    }
    const gl = glRenderer.getContext();
    // @ts-ignore
    const glBinding = new XRWebGLBinding(arSession, gl);

    return { glBinding, arSession };
  }, []);

  const cameraTextureRef = useRef<WebGLTexture>();

  const computeCameraTexture = useCallback(
    async (time?: number, frame?: XRFrame) => {
      if (!frame || !arSession || !glBinding) {
        console.log('no frame or arSession or glBinding');
        return;
      }

      const referenceSpace = await arSession.requestReferenceSpace('viewer');
      if (referenceSpace) {
        let viewerPose = frame.getViewerPose(referenceSpace);
        if (viewerPose) {
          for (const view of viewerPose.views) {
            cameraTextureRef.current = glBinding.getCameraImage(frame, view);
          }
        }
      }
    },
    [glRenderer]
  );

  useFrame(computeCameraTexture);

  return { cameraTextureRef };
}

/**
 * 平面检测待优化
 */

export type PlaneState = {
  position: Vector3;
  orientation: 'Horizontal' | 'Vertical';
  polygon: Quaternion[];
};
export function useARPlaneDetection(rootStore?: RootState) {
  const planePosesRef = useRef<PlaneState[]>([]);
  const { glRenderer } = useStore() ?? (rootStore as RootState);
  const [webXRManager] = useState(() => glRenderer.xr);

  const render = useCallback((time?: number, frame?: XRFrame) => {
    if (!frame) {
      return;
    }
    const referenceSpace = webXRManager.getReferenceSpace();

    // @ts-ignore
    const detectedPlanes: XRPlane[] = frame.detectedPlanes;
    if (!detectedPlanes) {
      return;
    }
    console.log(detectedPlanes);
    const result: PlaneState[] = [];
    detectedPlanes?.forEach((plane) => {
      if (referenceSpace) {
        const planePose = frame.getPose(plane.planeSpace, referenceSpace);
        if (planePose) {
          const position = new Vector3(0, 0, 0).applyMatrix4(
            new Matrix4().fromArray(planePose.transform.matrix)
          );
          result.push({
            position,
            orientation: plane.orientation,
            polygon: plane.polygon.map((item) => {
              return new Quaternion(item.x, item.y, item.z, item.w);
            }),
          });
        }
      }
    });

    planePosesRef.current = result;
  }, []);

  useFrame(render);
  return { planePosesRef };
}

type XRDepthInformation = {
  width: number;
  height: number;

  normDepthBufferFromNormView: XRRigidTransform;
  rawValueToMeters: number;
};

export interface XRCPUDepthInformation extends XRDepthInformation {
  // Data format is determined by session's depthDataFormat attribute.
  data: ArrayBuffer;
  getDepthInMeters: (column: number, row: number) => number;
}

interface XRWebGLDepthInformation extends XRDepthInformation {
  // Opaque texture, its format is determined by session's depthDataFormat attribute.
  texture: WebGLTexture;
}