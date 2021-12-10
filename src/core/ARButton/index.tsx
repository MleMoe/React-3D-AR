import React, { FC, useState, useLayoutEffect, useCallback } from 'react';
import { WebGLRenderer, XRSessionInit } from 'three';
import type { XRSystem, XRSession } from 'webxr';
import { useAR } from '../hooks';
import './index.scss';

type ARButtonProps = Partial<{
  onStartAR: () => void;
  onEndAR: () => void;
}>;

export const ARButton: FC<ARButtonProps> = ({ onStartAR, onEndAR }) => {
  const [inProgress, setInProgress] = useState(false);
  return (
    <>
      <button
        className='AR-button'
        onClick={() => {
          if (inProgress) {
            onEndAR?.();
          } else {
            onStartAR?.();
          }
          setInProgress((prev) => !prev);
        }}
      >
        {inProgress ? 'END AR' : 'START AR'}
      </button>
    </>
  );
};
