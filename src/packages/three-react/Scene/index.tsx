import React, { FC, useState, useLayoutEffect } from 'react';
import useMeasure from 'react-use-measure';
import '../tag-types';
import { reconciler, Root } from '../renderer';
import { Provider } from '../provider';
import { createStore, Camera, RootState } from '../store';
import * as THREE from 'three';
import { createLoop } from '../loop';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ARManager } from '../../webar/manager';

export type SceneProps = Partial<{
  storeRef: {
    current: RootState | undefined;
  };
  className: string;
  style: React.CSSProperties;
  camera: Camera;
  ar: ARManager;
  control: boolean;
  renderer: THREE.WebGLRenderer;
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

export const Scene: FC<SceneProps> = ({
  storeRef,
  className,
  style,
  renderer,
  camera,
  ar,
  control = false,
  children,
}) => {
  const [divRef, { width, height }] = useMeasure({
    scroll: true,
    debounce: { scroll: 50, resize: 0 },
  });
  const canvasRef = React.useRef<HTMLCanvasElement>(null!);
  const [root, setRoot] = useState<Root>();

  useLayoutEffect(() => {
    if (canvasRef.current && width && height && !root) {
      const store = createStore({
        canvas: canvasRef.current,
        camera,
        control,
        renderer,
        ar,
      });

      if (ar) {
        ar.setAttributesFromRoot(store.getState());
      }

      if (storeRef) {
        storeRef.current = store.getState();
      }

      const container = reconciler.createContainer(store, 0, false, null);

      setRoot({ store, container });
      // 启动绘制循环
      createLoop(store.getState());
    }
  }, [width, height]);

  useLayoutEffect(() => {
    if (root) {
      // resize renderer and camera
      const { glRenderer, camera, interactionManager } = root.store.getState();
      const size = glRenderer.getSize(new THREE.Vector2());
      if (width !== size.x || height !== size.y) {
        glRenderer.setSize(width, height);
        if ('aspect' in camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
      const { raycaster, mouse } = interactionManager;
      raycaster.setFromCamera(mouse, camera);
    }
  }, [width, height, root]);

  useLayoutEffect(() => {
    if (root && width > 0 && height > 0) {
      render(root, <React.Suspense fallback={null}>{children}</React.Suspense>);
    }
  }, [width, height, children, root]); // 需放上 children，解决了 gl 的唯一性问题， 解决 child 元素的 diff 问题。

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
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
