import {
  useContext,
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import { context } from './store';
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
} from 'three';
import { FrameCallback } from './loop';

export interface XRSystem extends EventTarget {
  isSessionSupported: (sessionMode: XRSessionMode) => Promise<boolean>;
  requestSession: (
    sessionMode: XRSessionMode,
    sessionInit?: any
  ) => Promise<XRSession>;
}

export function useStore() {
  const store = useContext(context).getState();
  if (!store)
    throw `请在 scene 的 child 组件使用，若不是，请使用 Scene 的 storeRef`;
  return store;
}

export function useThree() {
  const store = useContext(context).getState();
  if (!store)
    throw `请在 scene 的 child 组件使用，若不是，请使用 Scene 的 storeRef`;
  const [three] = useState(() => {
    const { glRenderer, scene, camera } = store;
    return { glRenderer, scene, camera };
  });
  return three;
}

export function useFrame(callback: FrameCallback) {
  const store = useContext(context).getState();
  useLayoutEffect(() => {
    const { frameCallbacks } = store;
    frameCallbacks.push(callback);
  }, []);
}

export function useAR() {
  const [xr] = useState(() => {
    if ('xr' in navigator) {
      return (navigator as any).xr as XRSystem;
    }
  });
  const [support, setSupport] = useState<boolean>();
  const [arSession, setArSession] = useState<XRSession>();

  useLayoutEffect(() => {
    xr?.isSessionSupported('immersive-ar').then((isSupport) => {
      setSupport(isSupport);
    });
  }, []);

  const creactARSession = useCallback(
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
        onSessionStarted(session);
      });
    },
    [xr, support]
  );

  const disposeARSession = useCallback(() => {
    arSession?.end();
  }, [arSession]);

  return {
    support,
    arSession,
    creactARSession,
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

export type PlaneState = {
  position: Vector3;
  orientation: 'Horizontal' | 'Vertical';
  polygon: Quaternion[];
};
export function useARPlaneDetection() {
  const planePosesRef = useRef<PlaneState[]>([]);
  const { glRenderer } = useStore();
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
