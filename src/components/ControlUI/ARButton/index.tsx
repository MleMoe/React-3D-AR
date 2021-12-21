import { FC, useMemo } from 'react';
import './index.scss';

type ARButtonProps = Partial<{
  inProgress: boolean;
  isSupportAR: boolean;
  onStartAR: () => void;
  onEndAR: () => void;
}>;

export const ARButton: FC<ARButtonProps> = ({
  isSupportAR,
  onStartAR,
  onEndAR,
  inProgress,
}) => {
  const statusText = useMemo(() => {
    if (!isSupportAR) {
      return 'UNSUPPORT AR';
    }
    return inProgress ? 'END AR' : 'START AR';
  }, [inProgress, isSupportAR]);
  return !inProgress ? (
    <button
      className='ar-button-start'
      onClick={() => {
        if (!isSupportAR) {
          return;
        }
        onStartAR?.();
      }}
    >
      {statusText}
    </button>
  ) : (
    <button
      className='ar-button-exit'
      onClick={() => {
        onEndAR?.();
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
  );
};
