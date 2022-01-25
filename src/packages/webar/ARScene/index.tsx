import {
  FC,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
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

type ARSceneProps = { dashboard: ReactNode } & SceneProps;

export const ARScene: FC<ARSceneProps> = ({
  children,
  dashboard = null,
  uiObserver,
  ...props
}) => {
  const arManager = useMemo(() => new ARManager(), []);
  const [inProgress, setInProgress] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null!);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    uiObserver?.on('startSession', () => {
      setInProgress(true);
    });
    uiObserver?.on('endSession', () => {
      arManager.reset();
    });
    arManager.overlay = overlayRef.current;
    arManager.overlayCanvas = overlayCanvasRef.current;
  }, []);

  return (
    <>
      <div ref={overlayRef} className={inProgress ? 'overlay overlay-ar' : ''}>
        <canvas ref={overlayCanvasRef} className='overlay-canvas' />
        {dashboard}
      </div>

      <Scene ar={arManager} uiObserver={uiObserver} {...props}>
        <ambientLight paras={[0xeeeeee]} />
        {children}
      </Scene>
    </>
  );
};
