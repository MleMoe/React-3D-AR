import { FC, useState, useRef, useMemo, useEffect, ReactNode } from 'react';
import { Scene, SceneProps } from '../../three-react/Scene';
import './index.scss';
import { ARManager } from '../manager';
import { EmitButton } from '../components/EmitButton';
import { Observer } from '../../three-react/observer';

type ARSceneProps = { dashboard: ReactNode; landing?: ReactNode } & SceneProps;

export const ARScene: FC<ARSceneProps> = ({
  children,
  dashboard = null,
  uiObserver = new Observer(),
  landing = null,
  ...props
}) => {
  const arManager = useMemo(() => new ARManager(), []);
  const [inProgress, setInProgress] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null!);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    uiObserver.on('startSession', () => {
      setInProgress(true);

      arManager.startAR({
        requiredFeatures: [
          'hit-test',
          'depth-sensing',
          'anchors',
          'light-estimation',
        ], //  'image-tracking'
        optionalFeatures: ['dom-overlay'],
        // @ts-ignore
        domOverlay: { root: overlayRef.current },
        depthSensing: {
          usagePreference: ['cpu-optimized'], // cpu-optimized
          dataFormatPreference: ['luminance-alpha'], // luminance-alpha
        },
      });
    });
    uiObserver.on('endSession', () => {
      arManager.reset();
      setInProgress(false);
      console.log(arManager.camera?.position);
    });
    arManager.overlay = overlayRef.current;
    arManager.overlayCanvas = overlayCanvasRef.current;
  }, []);

  return (
    <>
      <div ref={overlayRef} className={inProgress ? 'overlay overlay-ar' : ''}>
        <canvas ref={overlayCanvasRef} className='overlay-canvas' />
        {!inProgress ? (
          <button
            className='ar-button-start'
            onClick={() => {
              uiObserver?.emit('startSession');
            }}
          >
            Start AR
          </button>
        ) : (
          <button
            className='ar-button-exit'
            onClick={() => {
              uiObserver?.emit('endSession');
            }}
          >
            <svg
              viewBox='0 0 1024 1024'
              version='1.1'
              xmlns='http://www.w3.org/2000/svg'
              p-id='12694'
              width='36'
              height='36'
            >
              <path
                d='M785.92 955.733333c-52.599467 0-97.416533-19.3536-129.706667-55.978666L512 726.7328l-143.701333 172.032c-39.594667 38.8096-82.466133 56.763733-130.321067 56.763733C140.9024 955.528533 85.333333 905.693867 85.333333 818.858667c0-37.5808 13.653333-72.3968 40.448-103.424l194.7648-214.8352L162.4064 326.997333c-27.579733-32.017067-41.130667-68.778667-41.130667-110.250666 5.4272-86.186667 59.904-137.728 153.4976-147.8656L280.507733 68.266667l5.768534 0.785066c37.512533 5.3248 72.226133 23.176533 102.980266 53.009067l3.515734 3.8912 119.296 147.2512L631.466667 126.0544c27.989333-32.8704 63.931733-51.677867 107.4176-56.968533l5.461333-0.6144 5.461333 0.580266c87.8592 10.171733 142.097067 60.7232 152.6784 142.404267l0.750934 5.5296-0.750934 5.461333c-4.778667 37.546667-17.3056 71.133867-37.034666 100.010667l-1.706667 2.525867-160.324267 175.7184 195.9936 216.302933 1.706667 2.56c19.456 28.603733 31.914667 59.972267 36.829867 93.184l0.682666 4.573867-0.341333 4.539733C932.829867 906.9568 877.226667 955.733333 785.954133 955.733333z'
                fill='currentColor'
              ></path>
            </svg>
          </button>
        )}
        {inProgress && dashboard}
      </div>

      <Scene ar={arManager} uiObserver={uiObserver} {...props}>
        <ambientLight paras={[0xeeeeee]} />
        {!inProgress && landing}
        {inProgress && children}
      </Scene>
    </>
  );
};
