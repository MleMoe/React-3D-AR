import React, { FC, useRef } from 'react';
import useMeasure, { Options as ResizeOptions } from 'react-use-measure';
import type { XRSystem, XRSession } from 'webxr';

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  CylinderGeometry,
  MeshPhongMaterial,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
} from 'three';

type ARSceneProps = Partial<{
  className: string;
  style: React.CSSProperties;
  ar: {
    active: boolean;
    session: XRSession;
  };
}>;
export const ARScene: FC<ARSceneProps> = ({ className, style, ar }) => {
  const [containerRef, { width, height }] = useMeasure({
    scroll: true,
    debounce: { scroll: 50, resize: 0 },
  });
  const canvasRef = React.useRef<HTMLCanvasElement>(null!);
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
    </div>
  );
};
