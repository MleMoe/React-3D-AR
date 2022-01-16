import Reconciler from 'react-reconciler';
import { UseBoundStore } from 'zustand';

import { RootState } from './store';

import * as THREE from 'three';
import { isEqual } from './utils';
import { EventHandlers } from './events';

export type LocalState = {
  eventListeners: Partial<EventHandlers>;
  containerInfo: UseBoundStore<RootState>;
};

export type Instance = Omit<THREE.Object3D, 'parent' | 'children'> & {
  _local: LocalState;
  /**
   * Object's parent in the scene graph.
   * @default null
   */
  parent: Instance | null;
  /**
   * Array with object's children.
   * @default []
   */
  children: Instance[];
  [key: string]: any;
};

type InstanceCustomProps = {
  [key: string]: any;
};

export type InstanceProps = InstanceCustomProps & {
  paras?: any[];
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

  let isChanged = removeKeys.length ? true : false;
  for (const key of newKeys) {
    if (!isEqual(oldProps[key], newProps[key])) {
      isChanged = true;
      break;
    }
  }

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
  finalizeInitialChildren: true,
};

function log(type: keyof typeof logConfig, paras: any) {
  if (logConfig[type] === true) {
    console.log(`*** ${type} ***`);
    console.log(paras);
  }
}

/**
 * 为节点添加或更新属性
 * @param instance
 * @param props
 * @returns 节点
 */
function applyProps(instance: Instance, props: InstanceCustomProps) {
  for (const attr in props) {
    if (/^on(Click|DoubleClick)/.test(attr)) {
      const type = attr as keyof EventHandlers;
      const { _local } = instance;
      const { eventListeners } = _local;
      const eventListener = eventListeners[type];

      const { interactionManager } = _local.containerInfo.getState();

      if (eventListener != undefined) {
        instance.removeEventListener(type, eventListener);
      } else {
        interactionManager.add(instance);
      }
      instance.addEventListener(attr, props[type]);
      eventListeners[type] = props[type];
      continue;
    }

    if (attr === 'ref') {
      props[attr].current = getPublicInstance(instance);
      continue;
    }

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
 * ref 暴露的数据
 * @param instance
 * @returns
 */
function getPublicInstance(instance: Instance) {
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
 * @returns 节点
 */
function createInstance(
  type: string,
  props: InstanceProps,
  rootContainerInstance: UseBoundStore<RootState>,
  hostContext?: any,
  internalInstanceHandle?: any
) {
  log('createInstance', arguments);

  const { paras = [], children, ...rest } = props;

  let name = `${type[0].toUpperCase()}${type.slice(1)}`;
  let instance: Instance = new (THREE as any)[name](...paras);

  instance._local = {
    containerInfo: rootContainerInstance,
    eventListeners: {},
  };
  if (Object.keys(rest).length) {
    instance = applyProps(instance, rest);
  }

  return instance;
}

function appendChild(parent: Instance, child: Instance) {
  log('appendChild', arguments);
  parent.add(child);
}

function removeChild(parent: Instance, child: Instance) {
  child._local.containerInfo.getState().interactionManager.remove(child);
  child.removeFromParent();
}

function switchInstance(
  instance: Instance,
  type: string,
  nextProps: InstanceProps
) {
  const newInstance = createInstance(
    type,
    nextProps,
    instance._local.containerInfo
  );

  // 更新 children
  if (instance.children) {
    (instance.children as Instance[]).forEach((child) =>
      appendChild(newInstance, child)
    );
    instance.children = [];
  }

  // 更新 parent
  const parent = instance.parent;
  if (parent) {
    appendChild(parent, newInstance);
    removeChild(parent, instance);
  }

  return newInstance;
}

export let reconciler = Reconciler(
  // @ts-ignore
  {
    /**
     * mode mutation
     */
    supportsMutation: true,
    isPrimaryRenderer: false,
    createInstance,

    /**
     * 初次添加子节点，改变 parent/child 节点
     * in the render phase
     */
    appendInitialChild(parent: Instance, child: Instance) {
      log('appendInitialChild', arguments);
      appendChild(parent, child);
    },

    /**
     *
     * @param container
     * @param child
     */
    appendChildToContainer(
      container: UseBoundStore<RootState>,
      child: Instance
    ) {
      log('appendChildToContainer', arguments);

      // 最上层节点的 parent 是 scene
      // child._local.parent = container.getState().scene;
      container.getState().scene.add(child);
    },

    /**
     * in the commit phase
     * @param parent
     * @param child
     */
    appendChild,

    /**
     * 在某 child 节点前插入新 child 节点
     * @param parentInstance
     * @param child
     * @param beforeChild
     */
    insertBefore(parentInstance, child, beforeChild) {
      log('insertBefore', arguments);
      appendChild(parentInstance, child);
    },

    insertInContainerBefore(container, child, before) {
      log('insertInContainerBefore', arguments);
      container.getState().scene.add(child);
    },

    removeChildFromContainer(
      container: UseBoundStore<RootState>,
      child: Instance
    ) {
      log('removeChildFromContainer', arguments);
      container.getState().scene.remove(child);
    },
    removeChild,

    /**
     * 比较新旧参数，提供数据给 commitUpdate 更新
     * in the render phase
     * @returns 更新数据
     */
    prepareUpdate(
      instance: Instance,
      type: string,
      oldProps: InstanceProps,
      newProps: InstanceProps,
      rootContainerInstance,
      currentHostContext
    ): DiffPropsData | null {
      const {
        paras: parasNew = [],
        children: childrenNew,
        ...restNew
      } = newProps;
      const {
        paras: parasOld = [],
        children: childrenOld,
        ...restOld
      } = oldProps;

      // 判断构造函数参数
      if (!isEqual(parasOld, parasNew)) {
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
     * 应用更新
     * @param updatePayload 为 prepareUpdate return 的数据
     */
    commitUpdate(
      instance: Instance,
      updatePayload: DiffPropsData,
      type,
      prevProps: InstanceProps,
      nextProps: InstanceProps,
      internalHandle
    ) {
      log('commitUpdate', arguments);

      const { reconstruct, changes } = updatePayload;
      if (reconstruct) {
        console.log('需重建节点');
        switchInstance(instance, type, nextProps);
        return;
      }

      if (changes?.isChanged) {
        const { removeKeys, nowProps } = changes;
        // 待验证
        if (removeKeys.length) {
          const { paras = [] } = nextProps;
          const rawInstance = new (THREE as any)[
            `${type[0].toUpperCase()}${type.slice(1)}`
          ](...paras);
          removeKeys.forEach((key) => {
            instance[key] = rawInstance[key];
          });
        }

        applyProps(instance, nowProps);
      }
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
    getPublicInstance,

    getRootHostContext(rootContainer) {
      return null;
    },
    prepareForCommit(containerInfo) {
      return null;
    },
    resetAfterCommit() {},

    clearContainer() {
      return false;
    },
    // 放置 event
    commitMount() {
      // noop
    },

    /**
     * 文本相关
     */
    // createTextInstance(
    //   text,
    //   rootContainerInstance,
    //   hostContext,
    //   internalInstanceHandle
    // ) {
    // },
    shouldSetTextContent() {
      return false;
    },
  }
);
