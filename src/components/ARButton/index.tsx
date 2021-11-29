import React, { FC, useState, useLayoutEffect, useCallback } from 'react';
import { WebGLRenderer } from 'three';
import type { XRSystem, XRSession } from 'webxr';
import './index.scss';

type ARButtonProps = {
  renderer: WebGLRenderer;
  sessionInit?: {
    requiredFeatures?: any[];
    optionalFeatures?: any[];
    domOverlay?: HTMLElement;
  };
};

export const ARButton: FC<ARButtonProps> = ({ renderer }) => {
  const [xr] = useState(() => {
    if ('xr' in navigator) {
      return (navigator as any).xr as XRSystem;
    }
  });
  const [isSupport, setIsSupport] = useState<boolean>();
  const [session, setSession] = useState<XRSession>();
  const [status, setStatus] = useState<'start' | 'end'>();

  useLayoutEffect(() => {
    // (async () => {
    //   setIsSupport(!!(await xr?.isSessionSupported('immersive-ar')));
    // })();

    xr?.isSessionSupported('immersive-ar')
      .then((res) => {
        setIsSupport(res);
      })
      .catch((reason) => {
        setIsSupport(false);
        console.log(reason);
      });
  }, []);

  const onStartAR = useCallback(() => {
    if (isSupport) {
      xr?.requestSession('immersive-ar').then((session) => {
        setSession(session);
        setStatus('start');
        //@ts-ignore
        renderer?.xr.setSession(session);
      });
    }
  }, [isSupport, session]);

  const onEndAR = useCallback(() => {
    if (session) {
      session?.end();
      setStatus('end');
    }
  }, [session]);

  return (
    <>
      {status !== 'start' ? (
        <button className='AR-button' onClick={onStartAR}>
          {isSupport ? 'START AR' : 'UNSUPPORT AR'}
        </button>
      ) : (
        <svg
          className='AR-button-exit'
          width='38'
          height='38'
          xmlns='http://www.w3.org/2000/svg'
          onClick={onEndAR}
        >
          <g
            stroke='#FFF'
            stroke-width='2'
            fill='none'
            fill-rule='evenodd'
            stroke-linecap='round'
            stroke-linejoin='round'
          >
            <path d='M 12,12 L 28,28 M 28,12 12,28' />
          </g>
        </svg>
      )}
    </>
  );
};
