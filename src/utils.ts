/* eslint-disable */

import { Object3D } from 'three';


export const object3dChildOf = (
  childObject: Object3D | null,
  parentObject: Object3D
): boolean => {
  if (childObject === parentObject) {
    return true;
  }
  if (!childObject) {
    return false;
  }
  return object3dChildOf(childObject.parent, parentObject);
};