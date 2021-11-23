import React, { useEffect, useRef, useState, useMemo } from 'react';
import './App.scss';

// import { Camera } from '@mediapipe/camera_utils';
// import {
//   FaceMesh,
//   FACEMESH_TESSELATION,
//   FACEMESH_RIGHT_EYE,
//   FACEMESH_LEFT_EYE,
//   FACEMESH_RIGHT_EYEBROW,
//   FACEMESH_LEFT_EYEBROW,
//   FACEMESH_FACE_OVAL,
//   FACEMESH_LIPS,
// } from '@mediapipe/face_mesh';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';

// import { drawConnectors } from '/@mediapipe/drawing_utils';
import { useWindowSize } from './utils/hooks/useWindowSize';

const WIDTH = 1280;
const HEIGHT = 720;

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const windowSize = useWindowSize();
  const { width, height } = windowSize;
  const [videoWidth, setVideoWidth] = useState();
  const [videoHeight, setVideoHeight] = useState();
  const [faceMesh, setFaceMesh] = useState(() => {
    const fm = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    fm.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return fm;
  });

  let canvasCtx;
  let camera;

  useEffect(() => {
    if (!windowSize) {
      return;
    }

    if (typeof videoRef.current !== 'undefined' && videoRef.current !== null) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          !videoWidth && setVideoWidth(videoRef.current.videoWidth);
          !videoHeight && setVideoHeight(videoRef.current.videoHeight);

          await faceMesh.send({ image: videoRef.current });
        },
        facingMode: 'user', //'environment',
        // with: width,
        // height: height,
      });
      camera.start();
    }

    // return () => {
    //   // camera.stop();
    //   faceMesh.close();
    // };
  }, []);

  useEffect(() => {
    if (!canvasCtx) {
      canvasCtx = canvasRef.current.getContext('2d');
    }
    if (!videoWidth || !videoHeight) {
      return;
    }

    const onResults = (results) => {
      const canvasHeight = height;
      const canvasWidth = (videoWidth / videoHeight) * height;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      canvasCtx.drawImage(results.image, 0, 0, canvasWidth, canvasHeight);

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
    setFaceMesh((pre) => {
      pre.onResults(onResults);
      return pre;
    });
  }, [videoWidth, videoHeight, canvasRef]);

  console.log('宽度', videoWidth, videoRef.current?.videoWidth);
  console.log('高度', videoHeight, videoRef.current?.videoHeight);

  return (
    <div className='container'>
      <video ref={videoRef} className='input_video'></video>
      <canvas
        ref={canvasRef}
        id='mediapipe_canvas'
        className='output_canvas'
        width={videoWidth ? (videoWidth / videoHeight) * height : width}
        height={height}
      ></canvas>
    </div>
  );
}

export default App;
