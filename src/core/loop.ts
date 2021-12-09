import { RootState } from './store';

/**
 * 渲染场景
 * @param container root 信息
 */
function glRender(frameCallbacks: (() => void)[]) {
  frameCallbacks.forEach((callback) => {
    callback();
  });
}

export function createLoop(storeSate: RootState) {
  const { glRenderer, frameCallbacks } = storeSate;
  glRenderer.setAnimationLoop(() => glRender(frameCallbacks));
}
