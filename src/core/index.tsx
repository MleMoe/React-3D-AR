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
  glRenderer.setSize(canvas.width, canvas.height);

  let container = reconciler.createContainer(store, 0, false, null);
  // reconciler.updateContainer(element, container, null, null);
  reconciler.updateContainer(
    <Provider store={store} element={element} />,
    container,
    null,
    () => undefined
  );
}
