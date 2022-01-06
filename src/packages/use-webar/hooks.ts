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
} from 'three';
import { useFrame, useStore, useThree } from '../three-react/hooks';
import { getUuid } from '../three-react/utils';
import { identity } from '../../assets/js/gl-matrix/mat2';

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
  positions: Vector3[];
  hitTestResults: XRHitTestResult[];
};

export function useARHitTest() {
  const { glRenderer } = useThree();
  const [webXRManager] = useState(() => glRenderer.xr);

  const hitRef = useRef<HitState>({
    visible: false,
    position: new Vector3(0, 0, 0),
    positions: [],
    hitTestResults: [],
  });

  const hitTestSource = useRef<XRHitTestSource | undefined>();
  const hitTestSourceRequested = useRef(false);

  const render = useCallback((time?: number, frame?: XRFrame) => {
    if (!frame) {
      return;
    }

    const session = webXRManager.getSession();
    if (!session) return;

    if (!hitTestSourceRequested.current) {
      // const entityTypes: XRHitTestTrackableType[] = ['plane', 'mesh'];
      session
        .requestReferenceSpace('viewer')
        .then((referenceSpace: XRReferenceSpace) => {
          session
            .requestHitTestSource({
              space: referenceSpace,
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
    const referenceSpace = webXRManager.getReferenceSpace();

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
        }
      }
      hitRef.current.hitTestResults = [...hitTestResults];
      hitRef.current.positions = hitTestResults.reduce((result, hit) => {
        const pose = hit.getPose(referenceSpace);
        if (pose) {
          result.push(
            new Vector3(0, 0, 0).applyMatrix4(
              new Matrix4().fromArray(pose.transform.matrix)
            )
          );
        }
        return result;
      }, [] as Vector3[]);
    }
  }, []);
  useFrame(render);
  return { hitRef };
}

export function useARImageTracking(rootStore?: RootState) {
  const imgPoseRef = useRef<XRPose>();

  const { glRenderer } = useStore(rootStore);
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

export function useCameraAccess(store?: RootState) {
  const { glRenderer } = useThree(store);
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

  useFrame(computeCameraTexture, store);

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

export function useDepthSensing(store?: RootState) {
  const { glRenderer } = useThree(store);
  const [gl] = useState(() => glRenderer.getContext());
  const depthInfoRef = useRef<XRCPUDepthInformation>();
  const onGetDepthInfoRef = useRef<
    Map<string, (depthInfo: XRCPUDepthInformation) => void>
  >(new Map());

  const computeDepthInfo = useCallback(
    async (time?: number, frame?: XRFrame) => {
      if (!frame) {
        console.log('no frame ');
        return;
      }
      const referenceSpace = await frame.session.requestReferenceSpace(
        'viewer'
      );
      if (referenceSpace) {
        let viewerPose = frame.getViewerPose(referenceSpace);
        if (viewerPose) {
          for (const view of viewerPose.views) {
            // @ts-ignore
            depthInfoRef.current = frame.getDepthInformation(view);
            onGetDepthInfoRef.current.forEach((fn) => {
              // @ts-ignore
              fn(frame.getDepthInformation(view));
            });
          }
        }
      }
    },
    [glRenderer]
  );

  useFrame(computeDepthInfo, store);

  return { depthInfoRef, onGetDepthInfoRef };
}

export function useDepthOcclusionMaterial() {
  const { glRenderer } = useStore();
  const gl = useMemo(() => glRenderer.getContext(), []);
  const textureRef = useRef<WebGLTexture>(gl.createTexture());
  const [key] = useState(() => getUuid());

  const { onGetDepthInfoRef } = useDepthSensing();

  const shaderRef = useRef<{ shader?: Shader; modified: boolean }>({
    modified: false,
  });

  const [depthMaterial] = useState(() => {
    const material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
    material.needsUpdate = true;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uScreenSize = {
        value: new Vector2(window.innerWidth, window.innerHeight),
      };
      shader.uniforms.uScreenDepthTexture = { value: gl.createTexture() };
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
        console.log(!!depthInfo, !!shaderRef.current.shader);
        return;
      }
      if (!shaderRef.current.modified) {
        shaderRef.current.modified = true;
        shaderRef.current.shader.uniforms.uModified.value = true;
      }

      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE_ALPHA,
        depthInfo.width,
        depthInfo.height,
        0,
        gl.LUMINANCE_ALPHA,
        gl.UNSIGNED_BYTE,
        new Uint8Array(depthInfo.data)
      );
      gl.activeTexture(gl.TEXTURE0);

      shaderRef.current.shader.uniforms.uScreenDepthTexture.value =
        textureRef.current;
      shaderRef.current.shader.uniforms.uRawValueToMeters.value =
        depthInfo.rawValueToMeters;
      shaderRef.current.shader.uniforms.uUvTransform.value =
        depthInfo.normDepthBufferFromNormView.matrix;
      console.log('更新');
    };

    onGetDepthInfoRef.current.set(key, onGetDepthInfoCallback);

    return () => {
      onGetDepthInfoRef.current.delete(key);
    };
  }, []);

  return depthMaterial;
}
