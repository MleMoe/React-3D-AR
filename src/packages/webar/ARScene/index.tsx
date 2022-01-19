import { FC, useState, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ARButton } from '../../../components/ControlUI/ARButton';
import { Scene, SceneProps } from '../../three-react/Scene';
import { RootState } from '../../three-react/store';
import { ARHitTest } from '../components/ARHitTest';
import { Observer } from '../../three-react/observer';
import { ControlUI } from '../../../components/ControlUI';
import './index.scss';
import { ARManager } from '../manager';
import { ARLightEstimate } from '../../../components/ARLightEstimate';

type ARSceneProps = {} & SceneProps;

export const ARScene: FC<ARSceneProps> = ({ children }) => {
  const arManager = useMemo(() => new ARManager(), []);
  const [inProgress, setInProgress] = useState(false);
  const [uiObserver, setUiObserver] = useState<Observer>();

  const overlayRef = useRef<HTMLDivElement>(null!);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null!);

  const onSessionStarted = useCallback(
    (root: RootState, session: THREE.XRSession) => {
      root.interactionManager.setResponseDom(overlayRef.current);
      setInProgress(true);
      setUiObserver(root.uiObserver);
    },
    []
  );
  const onStartAR = useCallback(() => {
    arManager.overlayCanvas = overlayCanvasRef.current;
    arManager.startAR(
      {
        requiredFeatures: [
          'hit-test',
          'depth-sensing',
          'anchors',
          'light-estimation',
        ], //'camera-access',  'image-tracking'
        optionalFeatures: ['dom-overlay'],
        // @ts-ignore
        domOverlay: { root: overlayRef.current },
        depthSensing: {
          usagePreference: ['cpu-optimized'], // cpu-optimized
          dataFormatPreference: ['luminance-alpha'], // luminance-alpha
        },
      },
      onSessionStarted
    );
  }, []);

  return (
    <>
      <div
        ref={overlayRef}
        className={'overlay' + (inProgress ? ' overlay-ar' : '')}
      >
        <canvas ref={overlayCanvasRef} className='overlay-canvas' />
        <ControlUI
          uiObserver={uiObserver}
          controlTypes={['place']}
          inProgress={inProgress}
        >
          <ARButton
            onStartAR={onStartAR}
            onEndAR={() => {
              arManager.reset();
              setInProgress(false);
            }}
            inProgress={inProgress}
          ></ARButton>
        </ControlUI>
      </div>

      <Scene ar={arManager}>
        <ambientLight paras={[0xffffff]} />
        {inProgress && (
          <>
            {/* <ARHitTest /> */}
            {children}
          </>
        )}
      </Scene>
    </>
  );
};
