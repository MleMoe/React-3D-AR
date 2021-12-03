import React, {
  FC,
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useMemo,
} from 'react';
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
  camera: THREE.Camera | THREE.PerspectiveCamera | THREE.OrthographicCamera;
  ar: {
    active: boolean;
    session: XRSession;
  };
}>;

/**
 * 渲染
 */
function render(root: Root, element: React.ReactNode) {
  reconciler.updateContainer(
    <Provider store={root.store} element={element} />,
    root.container,
    null,
    () => undefined
  );
}

export const ARScene: FC<ARSceneProps> = ({
  className,
  style,
  camera,
  ar,
  children,
}) => {
  const [containerRef, { width, height }] = useMeasure({
    scroll: true,
    debounce: { scroll: 50, resize: 0 },
  });
  const canvasRef = React.useRef<HTMLCanvasElement>(null!);
  const [root, setRoot] = useState<Root>();

  useLayoutEffect(() => {
    if (canvasRef.current) {
      const store = createStore({
        canvas: canvasRef.current,
        camera,
      });
      const container = reconciler.createContainer(store, 0, false, null);

      setRoot({ store, container });
    }
  }, [canvasRef.current]);

  useLayoutEffect(() => {
    if (root) {
      // resize renderer
      const { glRenderer } = root.store.getState();
      const size = glRenderer.getSize(new THREE.Vector2());
      if (width !== size.x || height !== size.y) {
        glRenderer.setSize(width, height);
      }
    }
  }, [width, height]); // 可不写 root

  useLayoutEffect(() => {
    if (root && width > 0 && height > 0) {
      render(root, <React.Suspense fallback={null}>{children}</React.Suspense>);
    }
  }, [width, height, children, root]); // 需放上 children，解决了 gl 的唯一性问题， 解决 child 元素的 diff 问题。

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
