import { Body, Shape, World, Vec3 } from 'cannon-es';
import {
  Vector3,
  Mesh,
  Quaternion,
  Matrix4,
  BufferGeometry,
  Material,
  WebGLRenderer,
  Scene,
  Camera,
  Group,
} from 'three';

/**
 * Wrapper for cannon.js physics objects.
 *
 * The editor includes tools to create cannon shapes from three.js geometry objects.
 *
 * Documentation for cannon.js physics available here http:// schteppe.github.io/cannon.js/docs/
 */
export class PhysicsMesh extends Mesh {
  body: Body;
  world: World;
  mode: 'LOCAL' | 'WORLD';
  /**
   * @param {BufferGeometry} geometry - Geometry of the object.
   * @param {Material} material - Material used to render the object.
   * @param {World} world - Physics world where the object will be placed at.
   */
  constructor(world: World) {
    super();

    this.frustumCulled = false;

    /**
     * Physics body contains the following attributes:
     */
    this.body = new Body();
    this.body.type = Body.DYNAMIC;
    this.body.mass = 1.0;

    /**
     * Physics object position mode, indicates how coordinates from the physics engine are transformed into object coordinates.
     */
    this.mode = 'LOCAL';

    /**
     * Refenrece to the physics world.
     */
    this.world = world;
    this.world.addBody(this.body);

    /**
     * Update object position and rotation based on cannon.js body.
     */
    this.onBeforeRender = (
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      material: Material,
      group: Group
    ) => {
      if (this.mode === 'LOCAL') {
        this.position.set(
          this.body.position.x,
          this.body.position.y,
          this.body.position.z
        );
        if (!this.body.fixedRotation) {
          const { x, y, z, w } = this.body.quaternion;

          this.quaternion.set(x, y, z, w);
        }
      } else if (this.mode === 'WORLD') {
        // Physics transform matrix
        var transform = new Matrix4();
        if (this.body.fixedRotation) {
          transform.setPosition(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
          );
        } else {
          const quaternion = new Quaternion();
          const { x, y, z, w } = this.body.quaternion;
          quaternion.set(x, y, z, w);
          transform.makeRotationFromQuaternion(quaternion);
          transform.setPosition(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
          );
        }

        // Get inverse of the world matrix
        const inverse = this.parent?.matrixWorld.clone().invert();

        // Get position, scale and quaternion
        var scale = new Vector3();
        inverse?.multiply(transform);
        inverse?.decompose(this.position, this.quaternion, scale);
      }
    };
  }

  /**
   * Intialize physics object and add it to the scene physics world.
   */
  initialize() {
    if (this.mode === 'LOCAL') {
      this.body.position.set(this.position.x, this.position.y, this.position.z);
      const { x, y, z, w } = this.quaternion;
      this.body.quaternion.set(x, y, z, w);
    } else if (this.mode === 'WORLD') {
      const position = new Vector3();
      this.getWorldPosition(position);
      this.body.position.set(this.position.x, this.position.y, this.position.z);

      const quaternion = new Quaternion();
      this.getWorldQuaternion(quaternion);
      const { x, y, z, w } = quaternion;
      this.body.quaternion.set(x, y, z, w);
    }
  }

  /**
   * Add shape to physics object body.
   */
  addShape(shape: Shape) {
    if (!(shape instanceof Shape)) {
      throw new Error('Shape received is not of CANNON.Shape type');
    }

    this.body.addShape(shape);
  }
}
