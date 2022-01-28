import { FC, useState, useRef, useMemo, useEffect, ReactNode } from 'react';
import { Scene, SceneProps } from '../../three-react/Scene';
import './index.scss';
import { ARManager } from '../manager';

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
        {!inProgress && (
          <button
            className='ar-button-start'
            onClick={() => {
              arManager.startAR(
                {
                  requiredFeatures: [
                    'hit-test',
                    'depth-sensing',
                    'anchors',
                    'light-estimation',
                  ], //  'image-tracking'
                  optionalFeatures: ['dom-overlay'],
                  // @ts-ignore
                  domOverlay: { root: overlay },
                  depthSensing: {
                    usagePreference: ['cpu-optimized'], // cpu-optimized
                    dataFormatPreference: ['luminance-alpha'], // luminance-alpha
                  },
                },
                () => {
                  setInProgress(true);
                }
              );
              uiObserver?.emit('startSession');
            }}
          >
            Start AR
          </button>
        )}
        {dashboard}
      </div>

      <Scene ar={arManager} uiObserver={uiObserver} {...props}>
        <ambientLight paras={[0xeeeeee]} />
        {children}
      </Scene>
    </>
  );
};
