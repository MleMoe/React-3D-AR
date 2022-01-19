import {
  DataTexture,
  LuminanceAlphaFormat,
  UnsignedByteType,
  LinearFilter,
  CanvasTexture,
} from 'three';
import { XRCPUDepthInformation } from './types';

/**
 * Stores the raw depth values in a 16 bit value packed texture.
 *
 * The distance to the camera is stored in millimeters.
 *
 * This depth has to be unpacked in shader and multiplied by the normalization matrix to obtain rectified UV coordinates.
 */
export class DepthDataTexture extends DataTexture {
  constructor() {
    const width = 160;
    const height = 120;
    const data = new Uint8Array(width * height);

    super(data, width, height, LuminanceAlphaFormat, UnsignedByteType);

    this.magFilter = LinearFilter;
    this.minFilter = LinearFilter;
  }

  /**
   * Update the texture with new depth data.
   *
   * Depth data is retrieved from the WebXR API.
   *
   * @param {*} depthData
   */
  updateDepth(depthData: XRCPUDepthInformation) {
    var dataBuffer = depthData.data;
    // @ts-ignore
    this.image.data = new Uint8Array(dataBuffer);
    this.needsUpdate = true;
  }
}

export class DepthRawTexture {
  gl?: WebGLRenderingContext;
  texture?: WebGLTexture;
  constructor(gl?: WebGLRenderingContext) {
    if (!gl) {
      return;
    }
    this.gl = gl;
    this.texture = gl.createTexture() as WebGLTexture;
  }

  initTexture(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.texture = gl.createTexture() as WebGLTexture;
  }

  updateTexture(depthInfo: XRCPUDepthInformation) {
    if (!this.gl || !this.texture) {
      console.log('not gl and texture');
      return;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.LUMINANCE_ALPHA,
      depthInfo.width,
      depthInfo.height,
      0,
      this.gl.LUMINANCE_ALPHA,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array(depthInfo.data)
    );
    this.gl.activeTexture(this.gl.TEXTURE0);
    return this.texture;
  }
}

export class DepthCanvasTexture extends CanvasTexture {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  /**
   * Draw depth data to a canvas, also sets the size of the canvas.
   *
   * Uses the camera planes to correctly adjust the values.
   */
  updateDepth(depth: XRCPUDepthInformation, near: number, far: number) {
    const canvas = this.image as HTMLCanvasElement;

    canvas.width = depth.height;
    canvas.height = depth.width;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const float32Data = new Uint16Array(depth.data);

    for (let x = 0; x < depth.width; x++) {
      for (let y = 0; y < depth.height; y++) {
        const index = x * depth.width + y;
        var distance =
          (float32Data[index] * depth.rawValueToMeters - near) / (far - near);
        var j = (x * canvas.width + (canvas.width - y)) * 4;

        if (distance > 1.0) {
          distance = 1.0;
        } else if (distance < 0.0) {
          distance = 0.0;
        }

        image.data[j] = Math.ceil(distance * 256);
        image.data[j + 1] = Math.ceil(distance * 256);
        image.data[j + 2] = Math.ceil(distance * 256);
        image.data[j + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    this.needsUpdate = true;
  }
}
