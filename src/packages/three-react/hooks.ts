import { useContext, useState, useLayoutEffect, useEffect } from 'react';
import { context, RootState } from './store';

import { FrameCallback } from './loop';
import { getUuid } from './utils';
import { Texture, TextureLoader } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function useStore(rootStore?: RootState) {
  const store = useContext(context)?.getState();
  if (rootStore) return rootStore;

  return store;
}

export function useThree(rootStore?: RootState) {
  const store = useStore(rootStore);
  const [three] = useState(() => {
    const { glRenderer, scene, camera, orbitControl } = store;
    return { glRenderer, scene, camera, orbitControl };
  });
  return three;
}

export function useFrame(callback: FrameCallback, rootStore?: RootState) {
  const store = useStore(rootStore);
  useLayoutEffect(() => {
    const { frameCallbacks } = store;
    const callbackId = getUuid();

    frameCallbacks.set(callbackId, callback);
    return () => {
      frameCallbacks.delete(callbackId);
    };
  }, []);
}

type LoadModelResult<T> = T extends TextureLoader
  ? Texture
  : T extends GLTFLoader
  ? GLTF
  : unknown;

interface Loader<T> extends THREE.Loader {
  load(
    url: string,
    onLoad?: (result: LoadModelResult<T>) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void;
}

type LoadResult<T> = {
  status: 'init' | 'inProgress' | 'success' | 'failed';
  message?: string;
  loadResults?: Array<LoadModelResult<T>>;
};

export function useLoader<T = GLTFLoader>(
  Proto: new () => Loader<T>,
  filePath: string | string[],
  onProgress?: (event: ProgressEvent<EventTarget>) => void
): LoadResult<T> {
  const filePaths = (
    Array.isArray(filePath) ? filePath : [filePath]
  ) as string[];

  const [status, setStatus] = useState<
    'init' | 'inProgress' | 'success' | 'failed'
  >('init');
  const [message, setMessage] = useState<string>();
  const [loadResults, setLoadResults] = useState<Array<LoadModelResult<T>>>();

  useEffect(() => {
    const loader = new Proto();
    setStatus('inProgress');
    Promise.all(
      filePaths.map(
        (filePath) =>
          new Promise<LoadModelResult<T>>((resolve, reject) =>
            loader.load(
              filePath,
              (data) => {
                resolve(data);
              },
              onProgress,
              (error) => reject(`Could not load ${filePath}: ${error.message}`)
            )
          )
      )
    )
      .then((result) => {
        setStatus('success');
        setLoadResults(result);
      })
      .catch((err: string) => {
        setStatus('failed');
        setMessage(err);
      });
    return () => {};
  }, []);
  return { status, message, loadResults };
}
