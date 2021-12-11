import { FC, useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from '../controls/ARButton';
import { useAR } from '../../core/hooks';
import { Scene } from '../../core/Scene';
import { RootState } from '../../core/store';
import { ARContent } from '../ARContent';
import { ARHitTest } from '../ARHitTest';
import { ARImageTracking } from '../ARImageTracking';
import { PlaceButton } from '../controls/PlaceButton';

export const ARSceneNavigator: FC = () => {
  const [storeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));
  const overlayRef = useRef<HTMLDivElement>(null!);
  const imgRef = useRef<HTMLImageElement>(null!);

  const { support, arSession, creactARSession, disposeARSession } = useAR();

  const onSessionStarted = useCallback(async (session: THREE.XRSession) => {
    if (storeRef.current) {
      storeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await storeRef.current.glRenderer.xr.setSession(session);

      // 更换相机和事件响应 dom
      const { interactionManager, glRenderer } = storeRef.current;
      const { setCamera, setResponseDom } = interactionManager;
      setCamera(
        glRenderer.xr.getCamera(new THREE.Camera()) as THREE.PerspectiveCamera
      );
      setResponseDom(overlayRef.current);

      // @ts-ignore
      const scores = await session.getTrackedImageScores();
      console.log('scores: ', scores);
      let trackableImages = 0;
      for (let index = 0; index < scores.length; ++index) {
        if (scores[index] == 'trackable') ++trackableImages;
      }
      if (trackableImages == 0) {
        throw 'No trackable images';
      }
    }
  }, []);

  const onStartAR = useCallback(() => {
    creactARSession(
      {
        requiredFeatures: ['hit-test'], // 'image-tracking',
        optionalFeatures: ['dom-overlay'],
        // @ts-ignore
        domOverlay: { root: overlayRef.current },
        // trackedImages: [
        //   {
        //     image: imgBitmap,
        //     widthInMeters: 0.3,
        //   },
        // ],
      },
      onSessionStarted
    );
  }, []);

  // const [imgBitmap, setImgBitmap] = useState<ImageBitmap>(null!);
  // useEffect(() => {
  //   createImageBitmap(imgRef.current).then((imgBitmap) => {
  //     setImgBitmap(imgBitmap);
  //   });

  //   return () => {};
  // }, []);

  return (
    <>
      <div ref={overlayRef} id='overlay'>
        <ARButton
          isSupportAR={support}
          onStartAR={onStartAR}
          onEndAR={disposeARSession}
        ></ARButton>
        <PlaceButton />
      </div>
      {/* <img
        ref={imgRef}
        src='/trex-image-big.jpeg'
        style={{
          zIndex: 100,
          objectFit: 'contain',
          width: '100vw',
          height: '100vh',
        }}
      ></img> */}

      <Scene
        storeRef={storeRef}
        ar={true}
        camera={new THREE.PerspectiveCamera(75)}
      >
        <ambientLight args={[0xaaaaaa]} />
        <directionalLight
          args={[0xaaaaaa]}
          position={{ x: -100, y: -100, z: -100 }}
        />
        <ARContent />
        <ARHitTest />
        {/* <ARImageTracking imgBitmap={imgBitmap} /> */}
      </Scene>
    </>
  );
};
