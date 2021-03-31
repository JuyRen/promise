const PROMISE_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

function nextTick(cb) {
  if (
    typeof process !== "undefined" &&
    typeof process.nextTick === "function"
  ) {
    process.nextTick(cb);
  } else {
    const observer = new MutationObserver(cb);
    const textNode = document.createTextNode("1");
    observer.observe(textNode, {
      characterData: true,
    });
    textNode.data = "2";
  }
}

function resolvePromise2ByValue(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(
      new TypeError("Chaining cycle detected for promise #<Promise>")
    );
  } else if (x instanceof MyPromise) {
    x.then((y) => {
      resolvePromise2ByValue(promise, y, resolve, reject);
    }, reject);
  } else if ((x && typeof x === "object") || typeof x === "function") {
    let then;

    try {
      then = x.then;
    } catch (err) {
      reject(err);
    }

    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise2ByValue(promise, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } catch (e) {
        if (called) return;
        reject(e);
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}
class MyPromise {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING;
    this.value = null;
    this.reason = null;

    this.onFulfilledCallbacksQueue = [];
    this.onRejectedCallbacksQueue = [];

    const resolve = (value) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.FULFILLED;
        this.value = value;

        if (this.onFulfilledCallbacksQueue.length) {
          this.onFulfilledCallbacksQueue.forEach((callback) => {
            callback();
          });
        }
      }
    };

    const reject = (reason) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.REJECTED;
        this.reason = reason;

        if (this.onRejectedCallbacksQueue.length) {
          this.onRejectedCallbacksQueue.forEach((callback) => {
            callback();
          });
        }
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  static resolve(x) {
    if (x instanceof MyPromise) {
      return x;
    }

    return new MyPromise((resolve, reject) => {
      resolve(x);
    });
  }

  static reject(x) {
    return new MyPromise((resolve, reject) => {
      reject(x);
    });
  }

  static all(array) {
    return new MyPromise((resolve, reject) => {
      var count = 0;
      var result = [];
      for (let i = 0, len = array.length; i < len; i++) {
        const item = MyPromise.resolve(array[i]);
        item
          .then((res) => {
            count++;
            result[i] = res;
            if (count === len) {
              resolve(result);
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  }

  static race() {}

  static allSettled() {}

  then(onFulfilled, onRejected) {
    if (this.status === PROMISE_STATUS.FULFILLED) {
      const promise2 = new MyPromise((resolve, reject) => {
        nextTick(() => {
          if (typeof onFulfilled !== "function") {
            resolve(this.value);
          } else {
            try {
              const x = onFulfilled(this.value);
              resolvePromise2ByValue(promise2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          }
        });
      });
      return promise2;
    } else if (this.status === PROMISE_STATUS.REJECTED) {
      const promise2 = new Promise((resolve, reject) => {
        nextTick(() => {
          if (typeof onRejected !== "function") {
            reject(this.reason);
          } else {
            try {
              const x = onRejected(this.reason);
              resolvePromise2ByValue(promise2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          }
        });
      });

      return promise2;
    } else {
      const promise2 = new Promise((resolve, reject) => {
        this.onFulfilledCallbacksQueue.push(() => {
          nextTick(() => {
            try {
              if (typeof onFulfilled === "function") {
                const x = onFulfilled(this.value);
                resolvePromise2ByValue(promise2, x, resolve, reject);
              } else {
                resolve(this.value);
              }
            } catch (err) {
              reject(err);
            }
          });
        });

        this.onRejectedCallbacksQueue.push(() => {
          nextTick(() => {
            try {
              if (typeof onRejected === "function") {
                const x = onRejected(this.reason);
                resolvePromise2ByValue(promise2, x, resolve, reject);
              } else {
                reject(this.reason);
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      });

      return promise2;
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

module.exports = {
  MyPromise,
  deferred: function () {
    var resolve, reject;
    return {
      promise: new MyPromise(function (res, rej) {
        resolve = res;
        reject = rej;
      }),
      resolve: resolve,
      reject: reject,
    };
  },
};
