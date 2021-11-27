import React, { useEffect, useRef } from 'react';
import './index.scss';

import { Camera } from '@mediapipe/camera_utils';
import {
  FaceMesh,
  Results,
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_FACE_OVAL,
  FACEMESH_LIPS,
} from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

// import 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
// import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
// import 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';

import { useWindowSize } from '../../utils/hooks/useWindowSize';

const WIDTH = 1280;
const HEIGHT = 720;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    console.log('useEffect');
    if (!videoRef.current) {
      console.log('videoRef is possibly null');
      return;
    } else {
      console.log(videoRef.current.videoWidth, videoRef.current.videoHeight);
    }

    if (!canvasRef.current) {
      console.log('canvasRef is possibly null');
      return;
    }

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      console.log('canvasCtx is possibly null');
      return;
    }

    const onResults = (results: Results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      // canvasCtx.drawImage(results.image, 0, 0, WIDTH, HEIGHT);

      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 1,
          });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
          //   color: '#FF3030',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
          //   color: '#FF3030',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
          //   color: '#30FF30',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
          //   color: '#30FF30',
          // });
          drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
            color: '#E0E0E0',
          });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
          //   color: '#E0E0E0',
          // });
        }
      }
      canvasCtx.restore();
    };

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        console.log(file);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: WIDTH,
      height: HEIGHT,
    });
    camera.start().then(() => {
      console.log(
        'then: ',
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    });
    console.log(
      'finaly',
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
  }, [videoRef.current, canvasRef.current]);

  console.log('render');

  return (
    <>
      <div ref={containerRef} className='canvas-container'>
        <video ref={videoRef} className='video-input'></video>
        <canvas
          ref={canvasRef}
          className='canvas-output'
          width={WIDTH}
          height={HEIGHT}
        ></canvas>
      </div>
      {/* <a onClick={() => containerRef.current.requestFullscreen()}>
        full screen
      </a> */}
    </>
  );
}

export default App;
