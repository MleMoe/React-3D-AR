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
import { Body, Sphere } from 'cannon-es';

export function useARManager() {
  const { ar } = useStore();
  const {
    overlay,
    hitState,
    onAfterHitTest,
    depthRawTexture,
    onAfterDepthInfo,
    overlayCanvas,
    transformARMaterial,
    session,
    xrLight,
  } = useMemo<ARManager>(() => ar, []);
  return {
    session,
    overlay,
    hitState,
    onAfterHitTest,
    depthRawTexture,
    onAfterDepthInfo,
    overlayCanvas,
    transformARMaterial,
    xrLight,
  };
}

// export function usePhysicsObject(
//   objRef: React.MutableRefObject<Object3D<THREE.Event> | undefined>
// ) {
//   // const { world } = useARManager();
//   const { body } = useMemo(() => {
//     const body = new Body({ shape: new Sphere(0.1) });
//     body.type = Body.DYNAMIC;
//     body.mass = 1.0;
//     world.addBody(body);
//     return { body };
//   }, []);

//   useEffect(() => {
//     if (!objRef.current) {
//       console.log('obj is empty');
//       return;
//     }
//     const obj = objRef.current;
//     obj.onBeforeRender = () => {
//       obj.position.set(body.position.x, body.position.y, body.position.z);
//       if (!body.fixedRotation) {
//         const { x, y, z, w } = body.quaternion;
//         obj.quaternion.set(x, y, z, w);
//       }
//       console.log('渲染');
//     };

//     return () => {
//       obj.onBeforeRender = () => {};
//     };
//   }, []);

//   return { body };
// }

// export function useARImageTracking() {
//   const imgPoseRef = useRef<XRPose>();

//   const { glRenderer } = useStore();
//   const [webXRManager] = useState(() => glRenderer.xr);

//   const render = useCallback((time?: number, frame?: XRFrame) => {
//     if (!frame) {
//       return;
//     }
//     // @ts-ignore
//     const results = frame.getImageTrackingResults();
//     for (const result of results) {
//       // The result's index is the image's position in the trackedImages array specified at session creation
//       const imageIndex = result.index;
//       const referenceSpace = webXRManager.getReferenceSpace();

//       // Get the pose of the image relative to a reference space.
//       // @ts-ignore
//       const pose = frame?.getPose(result.imageSpace, referenceSpace);

//       const state = result.trackingState;

//       if (state == 'tracked') {
//         imgPoseRef.current = pose;
//         // HighlightImage(imageIndex, pose);
//       } else if (state == 'emulated') {
//         console.log(state, imageIndex, pose);
//         // FadeImage(imageIndex, pose);
//       }
//     }
//   }, []);

//   useFrame(render);
//   return { imgPoseRef };
// }

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

// /**
//  * 平面检测待优化
//  */

// export type PlaneState = {
//   position: Vector3;
//   orientation: 'Horizontal' | 'Vertical';
//   polygon: Quaternion[];
// };
// export function useARPlaneDetection(rootStore?: RootState) {
//   const planePosesRef = useRef<PlaneState[]>([]);
//   const { glRenderer } = useStore() ?? (rootStore as RootState);
//   const [webXRManager] = useState(() => glRenderer.xr);

//   const render = useCallback((time?: number, frame?: XRFrame) => {
//     if (!frame) {
//       return;
//     }
//     const referenceSpace = webXRManager.getReferenceSpace();

//     // @ts-ignore
//     const detectedPlanes: XRPlane[] = frame.detectedPlanes;
//     if (!detectedPlanes) {
//       return;
//     }
//     console.log(detectedPlanes);
//     const result: PlaneState[] = [];
//     detectedPlanes?.forEach((plane) => {
//       if (referenceSpace) {
//         const planePose = frame.getPose(plane.planeSpace, referenceSpace);
//         if (planePose) {
//           const position = new Vector3(0, 0, 0).applyMatrix4(
//             new Matrix4().fromArray(planePose.transform.matrix)
//           );
//           result.push({
//             position,
//             orientation: plane.orientation,
//             polygon: plane.polygon.map((item) => {
//               return new Quaternion(item.x, item.y, item.z, item.w);
//             }),
//           });
//         }
//       }
//     });

//     planePosesRef.current = result;
//   }, []);

//   useFrame(render);
//   return { planePosesRef };
// }
