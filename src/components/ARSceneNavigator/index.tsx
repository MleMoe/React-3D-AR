import { FC, useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from '../ControlUI/ARButton';
import { useAR } from '../../core/hooks';
import { Scene } from '../../core/Scene';
import { RootState } from '../../core/store';
import { ARContent } from '../ARContent';
import { ARHitTest } from '../ARHitTest';
import { Observer } from '../../core/observer';
import { ControlUI } from '../ControlUI';
import './index.scss';
import { FaceButton } from '../ControlUI/FaceButton';
import { CamaraAccessTest } from '../extends/CameraAccessTest';

export const ARSceneNavigator: FC = () => {
  const [inProgress, setInProgress] = useState(false);

  const [storeRef, setStoreRef] = useState<{ current: RootState | undefined }>(
    () => ({
      current: undefined,
    })
  );

  const [store, setStore] = useState<RootState>();

  const [uiObserver, setUiObserver] = useState<Observer>();

  const overlayRef = useRef<HTMLDivElement>(null!);

  const { support, arSession, creactARSession, disposeARSession } = useAR();

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
    creactARSession(
      {
        requiredFeatures: ['camera-access'], // 'image-tracking', 'hit-test',
        optionalFeatures: ['dom-overlay'],
        // @ts-ignore
        domOverlay: { root: overlayRef.current },
      },
      onSessionStarted
    );
  }, [support]);

  return (
    <>
      <div ref={overlayRef} className='overlay'>
        <canvas
          className='overlay-canvas'
          style={{ zIndex: 10, background: 'darkkhaki' }}
        ></canvas>
        {store && <CamaraAccessTest store={store} />}

        <ControlUI
          uiObserver={uiObserver}
          controlTypes={[]}
          inProgress={inProgress}
        >
          <ARButton
            isSupportAR={support}
            onStartAR={onStartAR}
            onEndAR={disposeARSession}
            inProgress={inProgress}
            changeProgress={() => {
              setInProgress((prev) => !prev);
            }}
          ></ARButton>
          <FaceButton store={store} visible={inProgress}></FaceButton>
        </ControlUI>
      </div>

      <Scene
        storeRef={storeRef}
        ar={true}
        camera={new THREE.PerspectiveCamera(75)}
      >
        <ambientLight args={[0xaaaaaa]} />
        <directionalLight
          args={[0xaaaaaa]}
          position={{ x: -100, y: -100, z: -100 }}
        />
        {/* <ARHitTest /> */}
      </Scene>
    </>
  );
};
