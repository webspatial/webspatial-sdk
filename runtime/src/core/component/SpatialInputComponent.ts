import { Vec3 } from '../private/WebSpatial'
import { SpatialComponent } from './SpatialComponent'


type TranslateEvent = {
  eventType: "dragstart" | "dragend" | "drag"
  translate?: Vec3
}
/**
 * Used to handle input events on an entity
 */
export class SpatialInputComponent extends SpatialComponent {
  public _gotEvent(data: any) {
    this.onTranslate(data)
  }
  public onTranslate(data: TranslateEvent) { }
}
