import { SpatialComponent } from "./SpatialComponent";

/**
* Used to handle input events on an entity
*/
export class SpatialInputComponent extends SpatialComponent {
    public _gotEvent(data: any) {
      this.onTranslate(data)
    }
    public onTranslate(data: any) {
  
    }
  }
  
  