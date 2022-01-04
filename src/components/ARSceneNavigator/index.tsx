import { FC, useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from '../ControlUI/ARButton';
import { Scene } from '../../packages/three-react/Scene';
import { RootState } from '../../packages/three-react/store';
import { ARContent } from '../ARContent';
import { ARHitTest } from '../ARHitTest';
import { Observer } from '../../packages/three-react/observer';
import { ControlUI } from '../ControlUI';
import './index.scss';
import { FaceButton } from '../ControlUI/FaceButton';
import { useAR } from '../../packages/use-webar/hooks';
import { Model } from '../ARContent/model';
import { CameraImage } from '../ARContent/cameraImage';
import { Depth } from '../ARContent/depth';
import { TestDepth } from '../ARContent/test-depth';
import { CameraScreen } from '../ARContent/cameraScreen';
import { MPFace } from '../mediaPipe/face';
import { MPHand } from '../mediaPipe/hand';

export const ARSceneNavigator: FC = () => {
  const [storeRef, setStoreRef] = useState<{ current: RootState | undefined }>(
    () => ({
      current: undefined,
    })
  );

  const [store, setStore] = useState<RootState>();

  const [uiObserver, setUiObserver] = useState<Observer>();

  const overlayRef = useRef<HTMLDivElement>(null!);

  const { support, createARSession, disposeARSession, inProgress } = useAR();

  const onSessionStarted = useCallback(async (session: THREE.XRSession) => {
    if (storeRef.current) {
      // UI 控件事件监听
      setUiObserver(storeRef.current.uiObserver);
      storeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await storeRef.current.glRenderer.xr.setSession(session);

      // 更换相机和事件响应 dom
      const { interactionManager, glRenderer } = storeRef.current;
      const { setCamera, setResponseDom } = interactionManager;
      setCamera(
        glRenderer.xr.getCamera(new THREE.Camera()) as THREE.PerspectiveCamera
      );
      setResponseDom(overlayRef.current);
      setStore(storeRef.current);
    }
  }, []);

  const onStartAR = useCallback(() => {
    createARSession(
      {
        requiredFeatures: ['camera-access', 'hit-test'], // 'depth-sensing' 'image-tracking', 'hit-test',
        optionalFeatures: ['dom-overlay'],
        // @ts-ignore
        domOverlay: { root: overlayRef.current },
        // depthSensing: {
        //   usagePreference: ['cpu-optimized'],
        //   dataFormatPreference: ['luminance-alpha'],
        // },
      },
      onSessionStarted
    );
  }, [support]);

  return (
    <>
      <div
        ref={overlayRef}
        className={'overlay' + (inProgress ? ' overlay-ar' : '')}
      >
        <canvas className='overlay-canvas' />
        <ControlUI
          uiObserver={uiObserver}
          controlTypes={['place']}
          inProgress={inProgress}
        >
          <ARButton
            isSupportAR={support}
            onStartAR={onStartAR}
            onEndAR={disposeARSession}
            inProgress={inProgress}
          ></ARButton>
          {/* <FaceButton store={store} visible={inProgress}></FaceButton> */}
        </ControlUI>
      </div>

      <Scene
        storeRef={storeRef}
        ar={true}
        control={true}
        camera={
          new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
          )
        }
      >
        <ambientLight args={[0xaaaaaa]} />
        <directionalLight
          args={[0xaaaaaa]}
          position={{ x: -100, y: -100, z: -100 }}
        />
        <axesHelper args={[1]} />
        {/* <ARContent /> */}
        {/* {inProgress && <ARHitTest />} */}
        {/* {inProgress && <TestDepth />} */}
        {/* <TestDepth /> */}
        <gridHelper
          args={[100, 40, 0x303030, 0x303030]}
          position={{ x: 0, y: 0, z: 0 }}
        />

        {/* <Model position={{ x: 5, y: 0, z: -10 }} /> */}
        {/* <Model /> */}
        {inProgress && <MPFace />}
      </Scene>
    </>
  );
};
