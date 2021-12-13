import { FC, useState, useCallback, useRef } from 'react';
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

export const ARSceneNavigator: FC = () => {
  const [inProgress, setInProgress] = useState(false);

  const [storeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));

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
    }
  }, []);

  const onStartAR = useCallback(() => {
    creactARSession(
      {
        requiredFeatures: ['hit-test'], // 'image-tracking',
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
            changeProgress={() => {
              setInProgress((prev) => !prev);
            }}
          ></ARButton>
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
        <ARHitTest />
      </Scene>
    </>
  );
};
