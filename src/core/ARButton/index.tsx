import React, { FC, useState, useLayoutEffect, useCallback } from 'react';
import { WebGLRenderer, XRSessionInit } from 'three';
import type { XRSystem, XRSession } from 'webxr';
import { useAR } from '../hooks';
import './index.scss';

type ARButtonProps = Partial<{
  onStartAR: () => void;
}>;

export const ARButton: FC<ARButtonProps> = ({ onStartAR }) => {
  return (
    <>
      <button className='AR-button' onClick={onStartAR}>
        START AR
      </button>
    </>
  );
};
