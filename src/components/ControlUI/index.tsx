import { FC, Fragment, useCallback, useState } from 'react';
import { Observer } from '../../packages/three-react/observer';
import { PlaceButton } from './PlaceButton';
import './index.scss';
import { MenuButton } from './MenuButton';
import { NaviButton } from './NaviButton';

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
      {inProgress && (
        <div className='scene-menu'>
          <div>
            <MenuButton />
          </div>
          <div className='line'></div>
          <div className='navi-btn-wrap'>
            <NaviButton>
              <path
                d='M288.3 544.1c0.6 0.8 1.4 1.7 2.1 2.5l360.5 394.9c19.6 21.5 52.9 23 74.4 3.4 21.5-19.6 23-52.9 3.4-74.4L400.4 510.7 729 151.9c19.6-21.4 18.2-54.7-3.3-74.4-21.4-19.6-54.7-18.2-74.4 3.3L290.2 475.1c-18 19.6-18.3 49.1-1.9 69z'
                fill='currentColor'
              ></path>
            </NaviButton>
            <NaviButton>
              <path
                d='M731.7 475.1L370.6 80.8c-19.7-21.5-53-22.9-74.4-3.3-21.5 19.7-22.9 53-3.3 74.4l328.6 358.8-328.3 359.8c-19.6 21.5-18.1 54.8 3.4 74.4 21.5 19.6 54.8 18.1 74.4-3.4l360.5-394.9c0.7-0.8 1.5-1.7 2.1-2.5 16.4-19.9 16.1-49.4-1.9-69z'
                fill='currentColor'
              ></path>
            </NaviButton>
          </div>
        </div>
      )}
      <div className='bottom-control'>
        {inProgress && (
          <>
            <div className='line'></div>
            <div className='triangle-down'></div>
          </>
        )}
        <div className='btns'>
          {children}
          {inProgress &&
            controlTypes.map((type, index) => (
              <Fragment key={index}>
                {controlBtnMap[type]({ onClick: createEventEmitter(type) })}
              </Fragment>
            ))}
        </div>
      </div>
    </div>
  );
};
