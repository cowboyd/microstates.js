import { IClass, IStateObject, IPath } from '../Interfaces';
import { curry } from 'ramda';
import reduceTypeInstanceDescriptors from './reduceTypeInstanceDescriptors';
import matchStateType from './matchStateType';

export default curry(function traverseState(
  type: IClass,
  path: IPath,
  state: IStateObject
): IStateObject {
  switch (type) {
    case String:
    case Number:
    case Boolean:
    case Array:
    case Object:
      return matchStateType(type, path, state);
    default:
      return reduceTypeInstanceDescriptors(
        type,
        (descriptor, name) => {
          let { value: type } = descriptor;
          return matchStateType(type, [...path, name], state);
        },
        { enumerable: true }
      );
  }
});
