import { Vec3 } from '../SpatialTransform'
import { EventSpatialComponent } from './EventSpatialComponent'

/**
 * Translate event, matching similar behavior to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event
 */
type TranslateEvent = {
  eventType: 'dragstart' | 'dragend' | 'drag'
  translate?: Vec3
}
/**
 * Used to handle input events on an entity
 */
export class SpatialInputComponent extends EventSpatialComponent {
  protected override onRecvEvent(data: any): void {
    this.onTranslate(data)
  }

  /**
   * Callback fired when a translate event occurs
   * @param data translate event data
   */
  public onTranslate(data: TranslateEvent) {}
}
