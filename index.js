/**
 * 注释1：
 * 构造函数的传参文档上没有说明，只能以实际 new Promise((resolve, reject) => {}) 情况,
 * 定义executor函数的两个参数resolve和reject,
 * resolve改变promise的状态为fulfilled, reject改变promise的状态为rejected.
 */

/*
  注释2：
  术语thenable的解释
  - thenable is an object or function that defines a then method.
  例子：
  1、
    const thenable = {
      then: function() {}
    }

  2、
    function thenable() {}
    thenable.then = function() {}
*/

/**
 * 注释3：
 * 2.2.6 then may be called multiple times on the same promise.
 *
 * const p1 = new MyPromise()
 *
 * p1.then()
 * p1.then()
 * p1.then()
 *
 */

/**
 * 注释4: mockMicrotask
 * 模拟浏览器环境或node环境微任务队列
 * queueMicrotask 、 MutationObserver 、 process.nextTick.
 */

function mockMicrotask(cb) {
  if (
    typeof process !== "undefined" &&
    typeof process.nextTick === "function"
  ) {
    process.nextTick(cb);
  } else {
    queueMicrotask(cb);
  }
}

const STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor(executor) {
    this.status = STATES.PENDING;
    this.value = undefined;
    this.reason = undefined;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    // 将promise状态从 pending  ==》 fulfilled
    const resolve = (value) => {
      if (this.status === STATES.PENDING) {
        this.status = STATES.FULFILLED;
        this.value = value;

        if (this.onFulfilledCallbacks.length) {
          this.onFulfilledCallbacks.forEach((cb) => cb());
          this.onFulfilledCallbacks = [];
        }
      }
    };

    // 将promise状态从 pending ==》 rejected
    const reject = (reason) => {
      if (this.status === STATES.PENDING) {
        this.status = STATES.REJECTED;
        this.reason = reason;

        if (this.onRejectedCallbacks.length) {
          this.onRejectedCallbacks.forEach((cb) => cb());
          this.onRejectedCallbacks = [];
        }
      }
    };

    executor(resolve, reject);
  }

  then(onFulfilled, onRejected) {
    if (this.status === STATES.FULFILLED) {
      const promise2 = new MyPromise((resolve, reject) => {
        onFulfilled =
          typeof onFulfilled === "function"
            ? onFulfilled
            : () => {
                resolve(this.value);
              };

        mockMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });

      return promise2;
    }

    if (this.status === STATES.REJECTED) {
      const promise2 = new MyPromise((resolve, reject) => {
        onRejected =
          typeof onRejected === "function"
            ? onRejected
            : () => {
                reject(this.reason);
              };

        mockMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });

      return promise2;
    }

    if (this.status === STATES.PENDING) {
      const promise2 = new MyPromise((resolve, reject) => {
        onFulfilled =
          typeof onFulfilled === "function"
            ? onFulfilled
            : () => {
                resolve(this.value);
              };

        onRejected =
          typeof onRejected === "function"
            ? onRejected
            : () => {
                reject(this.reason);
              };

        this.onFulfilledCallbacks.push(() => {
          mockMicrotask(() => {
            try {
              const x = onFulfilled(this.value);
              promiseResolutionProcedure(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });

        this.onRejectedCallbacks.push(() => {
          mockMicrotask(() => {
            try {
              const x = onRejected(this.reason);
              promiseResolutionProcedure(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      });

      return promise2;
    }
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

function promiseResolutionProcedure(promise, x, resolve, reject) {
  if (x === promise) {
    reject(new TypeError("same object"));
  } else if (x instanceof MyPromise) {
    x.then((y) => {
      promiseResolutionProcedure(promise, y, resolve, reject);
    }, reject);
  } else if ((typeof x === "object" && x !== null) || typeof x === "function") {
    let then;

    try {
      then = x.then;
      let called = false;

      if (typeof then === "function") {
        const resolvePromise = (y) => {
          if (called) return;
          called = true;
          promiseResolutionProcedure(promise, y, resolve, reject);
        };
        const rejectPromise = (r) => {
          if (called) return;
          called = true;
          reject(r);
        };

        try {
          then.call(x, resolvePromise, rejectPromise);
        } catch (e) {
          if (called) return;
          reject(e);
        }
      } else {
        resolve(x);
      }
    } catch (e) {
      reject(e);
    }
  } else {
    resolve(x);
  }
}
