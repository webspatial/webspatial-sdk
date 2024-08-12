import { SpatialResource } from "./SpatialResource";

/**
* Used to handle input events on an entity
*/
export class SpatialInputComponent extends SpatialResource {
    public _gotEvent(data: any) {
      this.onTranslate(data)
    }
    public onTranslate(data: any) {
  
    }
  }
  
  