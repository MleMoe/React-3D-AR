import {
  DataTexture,
  LuminanceAlphaFormat,
  UnsignedByteType,
  LinearFilter,
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
    const height = 90;
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
