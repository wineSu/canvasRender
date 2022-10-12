type SetStyleFn = () => void;

let updateCallbacks: SetStyleFn[] = [];
let scheduler = Promise.resolve();

export function schedule(callback) {
  if (updateCallbacks.length === 0) {
    scheduler.then(flush);
  }
  updateCallbacks.push(callback);
}

export function flush() {
  const callback = updateCallbacks.pop();
  if(typeof callback === 'function') {
    callback();
  }
  updateCallbacks.length = 0;
}
