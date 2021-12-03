import React, { FC, useRef, useEffect, useState, useLayoutEffect } from 'react';
import useMeasure, { Options as ResizeOptions } from 'react-use-measure';
import type { XRSystem, XRSession } from 'webxr';
import '../tag-types';
import { reconciler, Root } from '../renderer';
import { Provider } from '../provider';
import { createStore } from '../store';
import * as THREE from 'three';

type ARSceneProps = Partial<{
  className: string;
  style: React.CSSProperties;
  ar: {
    active: boolean;
    session: XRSession;
  };
}>;

const roots = new Map<Element, Root>();

function render(element: React.ReactNode, canvas: HTMLCanvasElement) {
  let root = roots.get(canvas);
  let store = root?.store;
  let container = root?.container;
  if (!store) {
    store = createStore({
      canvas,
    });
    container = reconciler.createContainer(store, 0, false, null);

    roots.set(canvas, { store, container });
  }

  // resize renderer
  const { glRenderer } = store.getState();
  const size = glRenderer.getSize(new THREE.Vector2());
  if (canvas.width !== size.x || canvas.height !== size.y) {
    glRenderer.setSize(canvas.width, canvas.height);
  }

  // reconciler.updateContainer(element, container, null, null);
  reconciler.updateContainer(
    <Provider store={store} element={element} />,
    container,
    null,
    () => undefined
  );
}

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
  }, [width, height, children]); // 需放上 children，解决了 gl 的唯一性问题， 解决 child 元素的 diff 问题。
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
