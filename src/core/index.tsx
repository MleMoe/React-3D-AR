import { reconciler, Root } from './renderer';
import { Provider } from './provider';
import { createStore } from './store';
import * as THREE from 'three';

const roots = new Map<Element, Root>();

export function render(element: React.ReactNode, canvas: HTMLCanvasElement) {
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
