import React, { FC, useRef, useEffect, useState, useLayoutEffect } from 'react';
import useMeasure, { Options as ResizeOptions } from 'react-use-measure';
import type { XRSystem, XRSession } from 'webxr';
import '../tag-types';
import { render } from '..';

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

// const width = 300;
// const height = 300;

export const ARScene: FC<ARSceneProps> = ({
  className,
  style,
  ar,
  children,
}) => {
  const [containerRef, { width, height }] = useMeasure({
    scroll: true,
    debounce: { scroll: 50, resize: 0 },
  });
  // const containerRef = useRef<HTMLDivElement>(null!);
  const canvasRef = React.useRef<HTMLCanvasElement>(null!);

  useLayoutEffect(() => {
    // console.log('children: ', children);
    if (width > 0 && height > 0) {
      render(
        <React.Suspense fallback={null}>{children}</React.Suspense>,
        canvasRef.current
      );
    }
    return () => {};
  }, [width, height]); // 需放上 children，解决了 gl 的唯一性问题， 解决 child 元素的 diff 问题。
  // console.log(width, height);

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
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      ></canvas>
    </div>
  );
};
