import {
  useContext,
  useState,
  useLayoutEffect,
  useEffect,
  useMemo,
} from 'react';
import { context } from './store';

import { FrameCallback } from './loop';
import { getUuid } from './utils';
import { Texture, TextureLoader } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function useStore() {
  const store = useContext(context);

  return store;
}

export function useThree() {
  const store = useStore();
  const { glRenderer, scene, camera, orbitControl } = useMemo(() => store, []);
  return { glRenderer, scene, camera, orbitControl };
}

export function useFrame(callback: FrameCallback) {
  const store = useStore();
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
