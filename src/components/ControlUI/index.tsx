import { FC, Fragment, useCallback, useState } from 'react';
import { Observer } from '../../core/observer';
import { PlaceButton } from './PlaceButton';
import './index.scss';

export type ControlType = 'place';

type ControlBtnMap = {
  [key in ControlType]: FC<{ onClick: (...args: any[]) => void }>;
};

const controlBtnMap: ControlBtnMap = {
  place: PlaceButton,
};

type ControlUIProps = {
  inProgress: boolean;
  uiObserver?: Observer;
  controlTypes: ControlType[];
};
export const ControlUI: FC<ControlUIProps> = ({
  inProgress,
  uiObserver,
  controlTypes,
  children,
}) => {
  const createEventEmitter = useCallback(
    (type: ControlType) => {
      return () => {
        console.log('点击 place');
        uiObserver?.emit(type);
      };
    },
    [uiObserver]
  );

  return (
    <div className='control-ui'>
      {children}
      {uiObserver &&
        inProgress &&
        controlTypes.map((type, index) => (
          <Fragment key={index}>
            {controlBtnMap[type]({ onClick: createEventEmitter(type) })}
          </Fragment>
        ))}
    </div>
  );
};
