import { Body } from 'cannon-es';
import { VoxelEnvironment } from './VoxelEnvironment';

export class VoxelBody extends Body {
  active: boolean;
  manager: VoxelEnvironment;
  probability: number;

  constructor(manager: VoxelEnvironment, x: number, y: number, z: number) {
    super();

    /**
     * Indicates if the body is enabled of disabled.
     */
    this.active = false;

    /**
     * Voxel enviroment manager to wich this voxel body belongs.
     */
    this.manager = manager;

    /**
     * Current probability of this voxel belonging to the enviroment.
     */
    this.probability = 0.0;

    this.type = Body.STATIC;
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.addShape(this.manager.shape);
  }

  /**
   * 更新体素内部概率
   * 如果体素的概率低于阈值，则体素被停用。
   * Update the voxel internal probability.
   * If the probability of the voxels goes bellow the threshold the voxel is deactivated.
   *
   * @param {number} hit
   * 如果为1则体素被深度占据，否则不被占据。 介于两者之间的值可用于类似抗锯齿的计算。
   * If the 1 the voxel is occupied by depth, otherwise is not occupied. A value inbetween can be used for antialiasing like calculation.
   * @param {number} factor
   * 基于帧之间经过的时间和更新概率的更新因子
   * The update factor based on the the time elapsed between frames and the update probability
   */
  update(hit: number, factor: number) {
    this.probability = this.probability * (1 - factor) + factor * hit;

    if (this.probability > 1) {
      this.probability = 1.0;
    } else if (this.probability < 0) {
      this.probability = 0.0;
    }

    this.active = this.probability > this.manager.threshold;
  }
}
