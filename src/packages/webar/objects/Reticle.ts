import {
  Mesh,
  RingBufferGeometry,
  CircleBufferGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  Material,
} from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

/**
 * Cursor is used to interfact with the environment.
 *
 * The cursor moves around with the device.
 *
 * @extends {Mesh}
 */
export class Cursor extends Mesh {
  constructor(geometry: BufferGeometry, material: Material) {
    if (!geometry) {
      var ring = new RingBufferGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
      var dot = new CircleBufferGeometry(0.005, 32).rotateX(-Math.PI / 2);
      geometry = mergeBufferGeometries([ring, dot]);
    }

    if (!material) {
      material = new MeshBasicMaterial({
        opacity: 0.4,
        depthTest: false,
        transparent: true,
      });
    }

    super(geometry, material);

    this.matrixAutoUpdate = false;
    this.visible = false;
  }
}
