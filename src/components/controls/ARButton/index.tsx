import { FC, useState, useMemo } from 'react';
import './index.scss';

type ARButtonProps = Partial<{
  isSupportAR: boolean;
  onStartAR: () => void;
  onEndAR: () => void;
}>;

export const ARButton: FC<ARButtonProps> = ({
  isSupportAR,
  onStartAR,
  onEndAR,
}) => {
  const [inProgress, setInProgress] = useState(false);
  const statusText = useMemo(() => {
    if (!isSupportAR) {
      return 'UNSUPPORT AR';
    }
    return inProgress ? 'END AR' : 'START AR';
  }, [inProgress, isSupportAR]);
  return (
    <>
      <button
        className='AR-button'
        onClick={() => {
          if (!isSupportAR) {
            return;
          }
          if (inProgress) {
            onEndAR?.();
          } else {
            onStartAR?.();
          }
          setInProgress((prev) => !prev);
        }}
      >
        {statusText}
      </button>
    </>
  );
};
