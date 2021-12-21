import { FC, useState, useCallback, useMemo, useEffect } from 'react';
import './index.scss';
import {
  FaceMesh,
  Results,
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_FACE_OVAL,
  FACEMESH_LIPS,
} from '@mediapipe/face_mesh';
import { RootState } from '../../../packages/three-react/store';
import { XRFrame, XRSession } from 'three';

type FaceButtonProps = {
  visible: boolean;
  store: RootState | undefined;
};
export const FaceButton: FC<FaceButtonProps> = ({ visible, store }) => {
  const [inProgress, setInProgress] = useState(false);

  const { webXRManager, frameCallbacks, glRenderer } = useMemo(() => {
    if (store) {
      const { frameCallbacks, glRenderer } = store;
      const { xr: webXRManager } = glRenderer;
      return { webXRManager, frameCallbacks, glRenderer };
    }
    return {};
  }, [store]);

  const [glBinding, setGlBinding] = useState<any>();

  useEffect(() => {
    if (glRenderer && webXRManager && !glBinding) {
      const arSession = webXRManager.getSession();
      const gl = glRenderer.getContext();

      if (arSession && gl) {
        // @ts-ignore
        setGlBinding(new XRWebGLBinding(arSession, gl));
      }
    }
    return () => {};
  }, [glRenderer, webXRManager]);

  const [faceMesh] = useState(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        console.log(file);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  });

  const frameSend = useCallback(
    async (time?: number, frame?: XRFrame) => {
      const referenceSpace = await webXRManager
        ?.getSession()
        ?.requestReferenceSpace('viewer');
      if (referenceSpace) {
        let viewerPose = frame?.getViewerPose(referenceSpace);
        if (viewerPose) {
          for (const view of viewerPose.views) {
            const cameraTexture = glBinding.getCameraImage(frame, view);
            console.log('cameraTexture: ', cameraTexture);
          }
        }
      }
    },
    [webXRManager, glBinding]
  );

  const onStart = useCallback(() => {
    console.log('glBinding');
    console.log(glBinding);
    // console.log(glBinding.getCameraImage(size));

    // frameCallbacks?.push(frameSend);
  }, [frameCallbacks, frameSend]);

  return visible ? (
    <button
      className='button-place'
      onClick={() => {
        if (inProgress) {
          // onEnd();
        } else {
          onStart();
        }
        setInProgress((prev) => !prev);
      }}
    >
      <svg
        viewBox='0 0 1024 1024'
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='32'
        height='32'
      >
        <path
          d='M808.497 83.727H216.408c-288.06 0-288.06 856.546 0 856.546h592.089c286.855-0.001 286.855-856.546 0-856.546M383.84 512c0 23.653-19.083 42.788-42.787 42.788-23.603 0-42.787-19.135-42.787-42.788V340.75c0-23.754 19.184-42.887 42.787-42.887 23.704 0 42.787 19.133 42.787 42.887V512z m214.137 299.811H426.828v-42.888c0-47.307 38.268-85.675 85.475-85.675 47.307 0 85.674 38.368 85.674 85.675v42.888zM726.438 512c0 23.653-19.083 42.788-42.787 42.788-23.604 0-42.888-19.135-42.888-42.788V340.75c0-23.754 19.284-42.887 42.888-42.887 23.704 0 42.787 19.133 42.787 42.887V512z'
          fill='currentColor'
        ></path>
      </svg>
    </button>
  ) : null;
};
