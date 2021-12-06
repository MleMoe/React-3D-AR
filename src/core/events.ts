import { Object3D, Vector2, Raycaster } from 'three';
import { UseBoundStore } from 'zustand';
import { Instance } from './renderer';
import { Camera, RootState } from './store';
export interface BaseEvent {
  type: string;
}

/**
 * Event object.
 */
export interface Event extends BaseEvent {
  target?: any;
  [attachment: string]: any;
}
export type EventListener<E, T, U> = (
  event: E & { type: T } & { target: U }
) => void;

export type EventHandlers = {
  onClick?: EventListener<Event, string, Object3D<Event>>;
  onDbClick?: EventListener<Event, string, Object3D<Event>>;
};

export type InteractiveObject = {
  instance: Instance;
  distance: number;
  intersected: boolean;
};

export class InteractionManager {
  canvas: HTMLCanvasElement;
  camera: Camera;
  mouse: Vector2;
  interactiveObjects: InteractiveObject[];
  raycaster: THREE.Raycaster;
  container?: UseBoundStore<RootState>;
  size: {
    width: number;
    height: number;
  };
  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.camera = camera;
    this.canvas = canvas;
    this.size = {
      width: canvas.width,
      height: canvas.height,
    };

    this.mouse = new Vector2(-1, 1); // top left default position

    this.interactiveObjects = [];

    this.raycaster = new Raycaster();

    canvas.addEventListener('click', this.onMouseClick);
    canvas.addEventListener('dblclick', this.onMouseDblClick);
  }

  setContainer = (container: UseBoundStore<RootState>) => {
    this.container = container;
  };

  dispose = () => {
    this.canvas.removeEventListener('click', this.onMouseClick);
    this.canvas.removeEventListener('dbclick', this.onMouseDblClick);
  };

  add = (instance: Instance) => {
    if (instance) {
      // const interactiveObject = new InteractiveObject(object, object.name);
      this.interactiveObjects.push({
        instance,
        distance: Infinity,
        intersected: false,
      });
    }
  };

  remove = (instance: Instance) => {
    if (instance) {
      const index = this.interactiveObjects.findIndex(
        ({ instance: node }) => node.uuid === instance.uuid
      );
      this.interactiveObjects.splice(index, 1);
    }
  };

  update = (event: MouseEvent) => {
    const { offsetX, offsetY } = event;
    const { width, height } = this.size;
    console.log(offsetX, offsetY, width, height);

    // this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mouse.set((offsetX / width) * 2 - 1, -(offsetY / height) * 2 + 1);

    console.log('mouse: ', this.mouse);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    this.interactiveObjects.forEach((object) => {
      this.checkIntersection(object);
    });

    this.interactiveObjects.sort(function (a, b) {
      return a.distance - b.distance;
    });

    console.log(this.interactiveObjects);
  };

  checkIntersection = (object: InteractiveObject) => {
    const intersects = this.raycaster.intersectObjects([object.instance], true);

    if (intersects.length > 0) {
      let distance = intersects[0].distance;
      object.intersected = true;
      intersects.forEach((i) => {
        if (i.distance < distance) {
          distance = i.distance;
        }
      });
      object.distance = distance;
    } else {
      object.intersected = false;
      object.distance = Infinity;
    }
  };

  onMouseClick = (event: MouseEvent) => {
    this.update(event);
    // const event = new InteractiveEvent('click', mouseEvent);
    for (const obj of this.interactiveObjects) {
      if (obj.instance._local.eventListeners['onClick']) {
        if (obj.intersected) {
          this.dispatch(obj, { type: 'onClick', target: obj.instance });
          // this.container && glRender(this.container);
          break;
        } else {
          console.log('没有射线击中的对象, ', this.interactiveObjects);
        }
      }
    }
  };

  onMouseDblClick = () => {
    // this.update();
    // const event = new InteractiveEvent('dbclick', mouseEvent);
    // this.interactiveObjects.forEach((object) => {
    //   if (object.intersected) {
    //     this.dispatch(object, event);
    //   }
    // });
  };

  dispatch = (object: InteractiveObject, event: Event) => {
    if (object.instance) {
      event.coords = this.mouse;
      event.distance = object.distance;
      object.instance.dispatchEvent(event);
    }
  };
}
