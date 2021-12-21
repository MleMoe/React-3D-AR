import { useLayoutEffect, useMemo, useState, FC, useRef } from 'react';
import { useThree } from '../../../packages/three-react/hooks';
import { MeshBasicMaterial } from 'three';
import { RootState } from '../../../packages/three-react/store';
import './index.scss';
import { useCameraAccess } from '../../../packages/use-webar/hooks';

function drawCanvasFromTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  canvas: HTMLCanvasElement
) {
  const imageWidth: number = gl.drawingBufferWidth;
  const imageHeight: number = gl.drawingBufferHeight;

  // make a framebuffer
  const fb = gl.createFramebuffer();

  // make this the current frame buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // attach the texture to the framebuffer.
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

  // check if you can read from this type of texture.
  const canRead =
    gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;

  // Read the contents of the framebuffer
  const readback_pixels = new Uint8Array(imageWidth * imageHeight * 4);
  // readback_pixels.fill(0); // init with black
  console.log('canRead ', canRead, gl.FRAMEBUFFER_COMPLETE);

  // read the pixels
  gl.readPixels(
    0,
    0,
    imageWidth,
    imageHeight,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    readback_pixels
  );
  console.log(readback_pixels);

  // Unbind the framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Create a 2D canvas to store the result
  canvas.width = imageWidth;
  canvas.height = imageHeight;

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (!context) {
    console.log('context is ', context);
  }

  // Copy the pixels to a 2D canvas
  const imageData = context.createImageData(imageWidth, imageHeight);
  imageData.data.set(readback_pixels);

  context.putImageData(imageData, 0, 0);
  console.log('绘制！');
}

// Vertex shader program
const vsSource = `
                attribute vec4 a_Position;
                attribute vec2 a_TexCoord;
                varying vec2 v_TexCoord;
                void main(void) {
                  gl_Position = a_Position;
                  v_TexCoord = a_TexCoord;
                }
            `;

// Fragment shader program
const fsSource = `
            precision mediump float;
            uniform sampler2D uSampler;
            varying vec2 v_TexCoord;
            void main(void) {
              vec4 col = texture2D(uSampler, v_TexCoord);
              gl_FragColor.rgb = col.rgb;
              gl_FragColor.a = 0.75;
            }
        `;

function createProgram(
  webgl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) {
  // 创建程序
  let shader_vertex = webgl.createShader(webgl.VERTEX_SHADER) as WebGLShader;
  let shader_fragment = webgl.createShader(
    webgl.FRAGMENT_SHADER
  ) as WebGLShader;

  webgl.shaderSource(shader_vertex, vertex);
  webgl.shaderSource(shader_fragment, fragment);

  // 编译源码
  webgl.compileShader(shader_vertex);
  webgl.compileShader(shader_fragment);

  if (webgl.getShaderParameter(shader_vertex, webgl.COMPILE_STATUS) === false) {
    console.error(
      'Compile Shader Error: shader_vertex,' +
        webgl.getShaderInfoLog(shader_vertex)
    );
  }
  if (
    webgl.getShaderParameter(shader_fragment, webgl.COMPILE_STATUS) === false
  ) {
    console.error(
      'Compile Shader Error: shader_fragment,' +
        webgl.getShaderInfoLog(shader_fragment)
    );
  }
  // 创建执行程序
  let program = webgl.createProgram() as WebGLProgram;
  webgl.attachShader(program, shader_vertex);
  webgl.attachShader(program, shader_fragment);

  // 连接context和program
  webgl.linkProgram(program);
  if (webgl.getProgramParameter(program, webgl.LINK_STATUS) === false) {
    console.error(webgl.getProgramInfoLog(program));
  }
  webgl.useProgram(program);
  return program;
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  // 顶点坐标，纹理坐标
  const verticesTexCoords = new Float32Array([
    -0.5, 0.5, 0.0, 1.0, -0.5, -0.5, 0.0, 0.0, 0.5, 0.5, 1.0, 1.0, 0.5, -0.5,
    1.0, 0.0,
  ]);
  const n = 4;

  const verticesTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
  const shaderProgram = createProgram(gl, vsSource, fsSource);

  const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(
    gl.getAttribLocation(shaderProgram, 'a_Position'),
    2,
    gl.FLOAT,
    false,
    FSIZE * 4,
    FSIZE * 2
  );
  gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, 'a_Position'));

  const a_texCoord = gl.getAttribLocation(shaderProgram, 'a_TexCoord');
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_texCoord);

  return { n, shaderProgram };
}

function drawToCanvas(texture: WebGLTexture, canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl');
  if (gl) {
    const textureEmpty = gl.createTexture() as WebGLTexture;
    const { n, shaderProgram } = initVertexBuffers(gl);
    const u_Sampler = gl.getUniformLocation(shaderProgram, 'u_Sampler');
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u_Sampler, 0);
  }
}

type CamaraAccessTestProps = {
  store: RootState;
};
export const CamaraAccessTest: FC<CamaraAccessTestProps> = ({ store }) => {
  const { glRenderer } = useThree(store);

  const { cameraTexture } = useCameraAccess(store);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const [gl] = useState(() => glRenderer.getContext());

  // useLayoutEffect(() => {
  //   const timer = setInterval(() => {
  //     if (texture) {
  //       drawToCanvas(texture, canvasRef.current);
  //     }
  //     // texture && drawCanvasFromTexture(gl, texture, canvasRef.current);
  //   });
  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, [gl, texture]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className='overlay-canvas'
        onClick={() => {
          cameraTexture && drawToCanvas(cameraTexture, canvasRef.current);
        }}
      ></canvas>
      {/* <img
        src={imgBase64}
        className='overlay-canvas'
        style={{ zIndex: 12 }}
      ></img> */}
    </>
  );
};
