import { Object3D, Vector2, Raycaster } from 'three';
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
  responseDom: HTMLElement | null;
  canvas: HTMLCanvasElement;
  camera: Camera;
  mouse: Vector2;
  interactiveObjects: InteractiveObject[];
  raycaster: THREE.Raycaster;
  container?: RootState;
  size: {
    width: number;
    height: number;
  };
  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    responseDom?: HTMLElement
  ) {
    this.responseDom = responseDom || canvas.parentElement;
    this.camera = camera;
    this.canvas = canvas;
    this.size = {
      width: canvas.width,
      height: canvas.height,
    };

    this.mouse = new Vector2(-1, 1); // top left default position

    this.interactiveObjects = [];

    this.raycaster = new Raycaster();

    this.setEventListener();
  }

  setContainer = (container: RootState) => {
    this.container = container;
  };

  setCamera = (camera: Camera) => {
    this.camera = camera;
  };

  setResponseDom = (responseDom: HTMLElement) => {
    this.dispose();
    this.responseDom = responseDom;
    this.setEventListener();
  };

  setEventListener = () => {
    this.responseDom?.addEventListener('click', this.onMouseClick);
    this.responseDom?.addEventListener('dblclick', this.onMouseDblClick);
  };

  dispose = () => {
    this.responseDom?.removeEventListener('click', this.onMouseClick);
    this.responseDom?.removeEventListener('dbclick', this.onMouseDblClick);
  };

  add = (instance: Instance) => {
    if (instance) {
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

    this.mouse.set((offsetX / width) * 2 - 1, -(offsetY / height) * 2 + 1);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    this.interactiveObjects.forEach((object) => {
      object.intersected = false;
      object.distance = Infinity;
      this.checkIntersection(object);
    });

    this.interactiveObjects.sort(function (a, b) {
      return a.distance - b.distance;
    });
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
    console.log('???????????????');
    this.update(event);
    // const event = new InteractiveEvent('click', mouseEvent);
    for (const obj of this.interactiveObjects) {
      if (obj.instance._local.eventListeners['onClick']) {
        if (obj.intersected) {
          console.log(obj);
          this.dispatch(obj, { type: 'onClick', target: obj.instance });
          break;
        } else {
          console.log('???????????????????????????');
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
