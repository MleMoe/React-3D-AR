import { ControlType } from '../../components/ControlUI';

export type UIEventType = ControlType;

export class Observer {
  private eventsMap = new Map();

  /**
   * 绑定
   * @param eventName
   * @param callback
   */
  on(eventName: UIEventType, callback: (...args: any[]) => void) {
    if (this.eventsMap.has(eventName)) {
      this.eventsMap.get(eventName).push(callback);
    } else {
      this.eventsMap.set(eventName, [callback]);
    }
  }

  /**
   * 发射
   * @param eventName
   * @param args
   */
  emit(eventName: UIEventType, ...args: any[]) {
    this.eventsMap.get(eventName).forEach((fn: (...args: any[]) => void) => {
      fn(...args);
    });
  }

  /**
   * 移除
   * @param eventName
   */
  off(eventName: string) {
    this.eventsMap.delete(eventName);
  }
}
