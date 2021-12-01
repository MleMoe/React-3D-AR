import { reconciler, Root } from './renderer';
import { Provider } from './provider';
import { createStore } from './store';

const roots = new Map<Element, Root>();

export function render(
  element: React.ReactNode,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  let root = roots.get(canvas);
  let store = root?.store;
  if (!store) {
    store = createStore({
      canvas,
    });
    roots.set(canvas, { store });
  }
  const { glRenderer } = store.getState();

  // const state = store.getState();
  // console.log(state);
  // const fiber = reconciler.createContainer(store, 0, false, null);
  let container = reconciler.createContainer(store, 0, false, null);
  // reconciler.updateContainer(element, container, null, null);
  // console.log(element);
  reconciler.updateContainer(
    <Provider store={store} element={element} />,
    container,
    null,
    () => undefined
  );

  // const { glRenderer, scene, camera } = store.getState();
  // console.log(scene);
  // glRenderer.render(scene, camera);
}
