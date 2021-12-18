import { RootState } from './store';
import { XRFrame } from 'three';

export type FrameCallback = (time?: number, frame?: XRFrame) => void;
/**
 * 渲染场景
 * @param container root 信息
 */
function glRender(
  frameCallbacks: FrameCallback[],
  time: number,
  frame?: XRFrame
) {
  frameCallbacks.forEach((callback) => {
    callback(time, frame);
  });
}

export function createLoop(storeSate: RootState) {
  const { glRenderer, frameCallbacks } = storeSate;
  glRenderer.setAnimationLoop((time: number, frame?: XRFrame) =>
    glRender(frameCallbacks, time, frame)
  );
}
