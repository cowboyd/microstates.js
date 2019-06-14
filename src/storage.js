import { view, set, Path } from '@microstates/lens';

export default class Storage {
  constructor(value, observe = x => x) {
    this.value = value;
    this.observe = observe;
  }

  get() {
    return this.value;
  }

  set(value) {
    if (value !== this.value) {
      this.value = value;
      this.observe();
    }
    return this;
  }

  getPath(path) {
    return view(Path(path), this.value);
  }

  setPath(path, value) {
    return this.set(set(Path(path), value, this.value));
  }
}
