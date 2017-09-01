import { ISchema } from '../Interfaces';
import MicrostateString from '../primitives/string';
import MicrostateNumber from '../primitives/number';
import MicrostateBoolean from '../primitives/boolean';
import MicrostateObject from '../primitives/object';
import MicrostateArray from '../primitives/array';
import MicrostateParameterizedArray from '../primitives/parameterizedArray';

export default function getReducerType(type: ISchema) {
  if (Array.isArray(type) && type.length > 0) {
    return MicrostateParameterizedArray;
  }
  switch (type) {
    case String:
      return MicrostateString;
    case Number:
      return MicrostateNumber;
    case Boolean:
      return MicrostateBoolean;
    case Object:
      return MicrostateObject;
    case Array:
      return MicrostateArray;
  }
  return type;
}
