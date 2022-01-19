import { XRCPUDepthInformation } from './types';

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
