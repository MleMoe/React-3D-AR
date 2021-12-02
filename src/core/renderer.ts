import Reconciler from 'react-reconciler';
import { UseBoundStore } from 'zustand';

import { EventHandlers } from './events';
import { RootState } from './store';

import * as THREE from 'three';
import { isEqual } from './utils';

export type LocalState = {
  root: UseBoundStore<RootState>;
  // objects and parent are used when children are added with `attach` instead of being added to the Object3D scene graph
  objects: Instance[];
  parent?: Instance | null;
};

export type Instance = THREE.Object3D & {
  _local: LocalState;
  [key: string]: any;
};

type InstanceCustomProps = {
  [key: string]: any;
};

export type InstanceProps = InstanceCustomProps & {
  args?: any[];
};

export type Root = {
  container: Reconciler.FiberRoot;
  store: UseBoundStore<RootState>;
};

type ChangeInfo = {
  isChanged: boolean;
  removeKeys: string[];
  nowProps: {
    [key in string]: any;
  };
};
export type DiffPropsData = {
  reconstruct: boolean;
  changes?: ChangeInfo;
};

function diffProps(
  oldProps: { [key in string]: any },
  newProps: { [key in string]: any }
): ChangeInfo {
  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  const removeKeys = oldKeys.filter((key) => !newKeys.includes(key));

  const isChanged = newKeys.reduce((result, key) => {
    if (!isEqual(oldProps[key], newProps[key])) {
      return true;
    }
    return result;
  }, false);

  return { isChanged, removeKeys, nowProps: newProps };
}

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

/**
 * 渲染场景
 * @param container root 信息
 */
function glRender(container: UseBoundStore<RootState>) {
  const state = container.getState();

  const { glRenderer, camera, scene } = state;
  // 渲染
  glRenderer.render(scene, camera);
}

/**
 * 为节点添加或更新属性
 * @param instance
 * @param props
 * @returns
 */
function applyProps(instance: Instance, props: InstanceCustomProps) {
  for (const attr in props) {
    if (typeof props[attr] === 'object') {
      for (const key in props[attr] as any) {
        instance[attr][key] = (props[attr] as any)[key];
      }
    } else {
      instance[attr] = props[attr];
    }
  }
  return instance;
}

/**
 *  创建节点
 * in the render phase
 * @param type
 * @param props
 * @param rootContainerInstance
 * @param hostContext
 * @param internalInstanceHandle
 * @returns
 */
function createInstance(
  type: string,
  props: InstanceProps,
  rootContainerInstance: UseBoundStore<RootState>,
  hostContext: any,
  internalInstanceHandle: any
) {
  log('createInstance', arguments);

  const { args = [], children, ...rest } = props;

  let name = `${type[0].toUpperCase()}${type.slice(1)}`;
  let instance: Instance = new (THREE as any)[name](...args);
  instance._local = { root: rootContainerInstance, objects: [] };
  if (Object.keys(rest).length) {
    instance = applyProps(instance, rest);
  }

  return instance;
}

export let reconciler = Reconciler({
  /**
   * mode mutation
   */
  supportsMutation: true,
  isPrimaryRenderer: false,
  createInstance,

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
    child._local.parent = parent;
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
    glRender(container);
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
    instance: Instance,
    type: string,
    oldProps: InstanceProps,
    newProps: InstanceProps,
    rootContainerInstance,
    currentHostContext
  ): DiffPropsData | null {
    const { args: argsNew = [], children: childrenNew, ...restNew } = newProps;
    const { args: argsOld = [], children: childrenOld, ...restOld } = oldProps;

    // 判断构造函数参数
    if (!isEqual(argsOld, argsNew)) {
      return {
        reconstruct: true,
      };
    }

    // 判断其它 props，暂时不判断 children
    const changes = diffProps(restOld, restNew);
    if (changes.isChanged) {
      return {
        reconstruct: false,
        changes,
      };
    }

    return null;
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
    updatePayload: DiffPropsData,
    type,
    oldProps: InstanceProps,
    newProps: InstanceProps,
    finishedWork
  ) {
    log('commitUpdate', arguments);

    const { reconstruct, changes } = updatePayload;
    if (reconstruct) {
      console.log('需重建节点');
      return;
    }

    if (changes) {
      const { removeKeys, nowProps } = changes;
      applyProps(instance, nowProps);
    }

    glRender(instance._local.root);
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
