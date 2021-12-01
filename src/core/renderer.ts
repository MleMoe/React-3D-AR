import Reconciler from 'react-reconciler';
import { UseBoundStore } from 'zustand';

import { EventHandlers } from './events';
import { RootState } from './store';

import * as THREE from 'three';

export type LocalState = {
  root: UseBoundStore<RootState>;
  // objects and parent are used when children are added with `attach` instead of being added to the Object3D scene graph
  objects: Instance[];
  parent?: Instance | null;
  primitive?: boolean;
  eventCount?: number;
  handlers?: Partial<EventHandlers>;
  memoizedProps?: {
    [key: string]: any;
  };
};

export type Instance = THREE.Object3D & {
  _local: LocalState;
  [key: string]: any;
};

export type InstanceProps = {
  [key: string]: unknown;
} & {
  args?: any[];
};

export type Root = {
  container: Reconciler.FiberRoot;
  store: UseBoundStore<RootState>;
};

const logConfig = {
  // 新建实例
  createInstance: true,
  // child 加入容器
  appendChildToContainer: true,
  appendChild: true,
  // 初次 append child
  appendInitialChild: true,
  removeChildFromContainer: true,
  removeChild: true,
  insertInContainerBefore: true,
  insertBefore: true,
  prepareUpdate: true,
  commitUpdate: true,
  finalizeInitialChildren: false,
};

function log(type: keyof typeof logConfig, args: any) {
  if (logConfig[type] === true) {
    console.log(`*** ${type} ***`);
    console.log(args);
  }
}

export let reconciler = Reconciler({
  /* configuration for how to talk to the host environment */
  /* aka "host config" */

  /**
   * mode mutation
   */
  supportsMutation: true,

  /**
   *  创建实例
   * in the render phase
   * @param type
   * @param props
   * @param rootContainerInstance
   * @param hostContext
   * @param internalInstanceHandle
   * @returns
   */
  createInstance(
    type: string,
    props: InstanceProps,
    rootContainerInstance: UseBoundStore<RootState>,
    hostContext,
    internalInstanceHandle
  ) {
    log('createInstance', arguments);

    const { args = [], children, ...rest } = props;

    let name = `${type[0].toUpperCase()}${type.slice(1)}`;
    let instance: Instance = new (THREE as any)[name](...args);
    instance._local = { root: rootContainerInstance, objects: [] };

    for (const attr in rest) {
      if (typeof rest[attr] === 'object') {
        for (const key in rest[attr] as any) {
          instance[attr][key] = (rest[attr] as any)[key];
        }
      } else {
        instance[attr] = rest[attr];
      }
    }
    return instance;
  },

  /**
   * 创建文本实例
   * 若不需支持文本节点，可不处理
   * @param text
   * @param rootContainerInstance
   * @param hostContext
   * @param internalInstanceHandle
   * @returns
   */
  createTextInstance(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    return null;
  },

  /**
   * 初次添加子节点，改变 parent/child 节点
   * in the render phase
   * @param parent
   * @param child
   */
  appendInitialChild(parent: Instance, child: Instance) {
    log('appendInitialChild', arguments);
    if (parent.type.endsWith('Mesh')) {
      if (child.type.endsWith('eometry')) {
        parent.geometry = child;
        return;
      } else {
        if (child.type.endsWith('aterial')) {
          parent.material = child;
          return;
        }
      }
    }
    parent.add(child);
  },

  /**
   *
   * @param container
   * @param child
   */
  appendChildToContainer(container: UseBoundStore<RootState>, child: any) {
    log('appendChildToContainer', arguments);

    container.getState().scene.add(child);
    const state = container.getState();

    const { glRenderer, camera, scene } = state;
    // 渲染
    glRenderer.render(scene, camera);
  },

  /**
   * in the commit phase
   * @param parent
   * @param child
   */
  appendChild(parent, child) {
    log('appendChild', arguments);
  },

  /**
   * 在某 child 节点前插入新 child 节点
   * @param parentInstance
   * @param child
   * @param beforeChild
   */
  insertBefore(parentInstance, child, beforeChild) {
    log('insertBefore', arguments);
  },

  insertInContainerBefore(container, child, before) {
    log('insertInContainerBefore', arguments);
  },

  removeChildFromContainer(
    container: UseBoundStore<RootState>,
    child: Instance
  ) {
    log('removeChildFromContainer', arguments);
    container.getState().scene.remove(child);
  },
  removeChild(parent, child) {
    log('removeChild', arguments);
  },

  /**
   * 比较新旧参数，提供数据给 commitUpdate 更新
   * in the render phase
   * @param instance
   * @param type
   * @param oldProps
   * @param newProps
   * @param rootContainerInstance
   * @param currentHostContext
   * @returns
   */
  prepareUpdate(
    instance,
    type,
    oldProps: any,
    newProps: any,
    rootContainerInstance,
    currentHostContext
  ) {
    log('prepareUpdate', arguments);
    switch (type) {
      case 'threeWebGLRenderer': {
        return true;
      }
      case 'Mesh':
        const {
          rotation: { x: ox, y: oy },
        } = oldProps;
        const {
          rotation: { x: nx, y: ny },
        } = newProps;
        if (ox !== nx || oy !== ny) {
          return {
            rotation: newProps.rotation,
          };
        }
        break;
      default:
    }
  },

  /**
   *
   * @param instance
   * @param updatePayload 为 prepareUpdate return 的数据
   * @param type
   * @param oldProps
   * @param newProps
   * @param finishedWork
   */
  commitUpdate(
    instance: Instance,
    updatePayload: any,
    type,
    oldProps,
    newProps,
    finishedWork
  ) {
    log('commitUpdate', arguments);

    const { glRenderer, scene, camera } = instance._local.root.getState();
    glRenderer.render(scene, camera);
    // switch (type) {
    //   case 'threeWebGLRenderer': {
    //     if (updatePayload === true) {
    //       const { renderer, scene, camera } = instance;
    //       if (scene !== null && camera !== null) {
    //         renderer.render(scene, camera);
    //       }
    //     }
    //     break;
    //   }
    //   case 'threeMesh':
    //     if (updatePayload.rotation !== undefined) {
    //       const {
    //         rotation: { x, y },
    //       } = updatePayload;
    //       if (x !== undefined) {
    //         instance.rotation.x = x;
    //       }
    //       if (y !== undefined) {
    //         instance.rotation.y = y;
    //       }
    //     }
    //     break;
    //   default:
    // }
  },

  /**
   * 当 child 被加入
   * in the render phase
   * @returns return true, the instance will receive a commitMount call later
   */
  finalizeInitialChildren(instance, type, props, rootContainer, hostContext) {
    log('finalizeInitialChildren', arguments);

    return true;
  },
  getChildHostContext() {},

  /**
   * ref 暴露的数据
   * @param instance
   * @returns
   */
  getPublicInstance(instance) {
    return instance;
  },
  getRootHostContext(rootContainer) {
    return null;
  },
  // @ts-ignore
  prepareForCommit(containerInfo) {},
  resetAfterCommit() {},
  shouldSetTextContent() {
    return false;
  },
  clearContainer() {
    return false;
  },
  // 放置 event
  commitMount() {
    // noop
  },
});
