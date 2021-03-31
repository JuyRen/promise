// 在执行上下文栈清空之前
function nextTick(callback) {
  if (
    typeof process !== "undefined" &&
    typeof process.nextTick === "function"
  ) {
    process.nextTick(callback);
  } else {
    const observer = new MutationObserver(callback);
    const textNode = document.createTextNode("1");
    observer.observe(textNode, {
      characterData: true,
    });
    textNode.data = "2";
  }
}
//  * 2.1 promise的状态一定是以下三者之一：
const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

function resolve(value) {
  // 2.1.1 处于pending的时候，promise
  if (this.status === STATUS.PENDING) {
    //    2.1.1.1.能够转变成fulfilled

    // 2.1.2 处于fulfilled的时候
    //      2.1.2.1 不能再改变promise状态
    Object.defineProperty(this, "status", {
      value: STATUS.FULFILLED,
      writable: false,
    });
    //      2.1.2.2 必须有一个不会改变的value （must not change）
    Object.defineProperty(this, "value", {
      value,
      writable: false,
    });

    if (this.onFulfilledCallbacks.length) {
      this.onFulfilledCallbacks.forEach((onFulfilled) => onFulfilled());
    }
  }
}

function reject(reason) {
  // 2.1.1 处于pending的时候，promise
  //    2.1.1.1.能够转变成rejected
  if (this.status === STATUS.PENDING) {
    // 2.1.3 处于rejected的时候， promise表现如下：
    //      2.1.3.1 不能再改变promise状态
    Object.defineProperty(this, "status", {
      value: STATUS.REJECTED,
      writable: false,
    });
    //      2.1.3.2 必须有一个不会改变的reason （must not change）
    Object.defineProperty(this, "reason", {
      value: reason,
      writable: false,
    });

    if (this.onRejectedCallbacks.length) {
      this.onRejectedCallbacks.forEach((onRejected) => onRejected());
    }
  }
}

function resolvePromiseByX(x, promise, resolve, reject) {
  if (promise === x) {
    // 2.3.1 promise和x指向同一个对象，会将promise状态变成rejected，并且reason是一个TypeError
    return reject(new TypeError("promise and x are same "));
  } else if (x instanceof MyPromise) {
    // // 2.3.2 如果x是一个promise,会采纳它的状态
    // if (x.status === STATUS.PENDING) {
    //   //    2.3.2.1 如果x处于pending, 那么promise必须保持pending直到x变成fulfilled或者rejected
    //   x.then(function (y) {
    //     resolvePromiseByX(y, promise, resolve, reject);
    //   }, reject);
    // } else if (x.status === STATUS.FULFILLED) {
    //   // 2.3.2.2 如果x变成fulfilled，那么promise也变成fulfilled，它的value与x.value相同
    //   resolve(x.value);
    // } else {
    //   // 2.3.2.3 如果x变成rejected，那么promise也变成rejected，它的reason与x.reason相同
    //   reject(x.reason);
    // }

    x.then(function (y) {
      resolvePromiseByX(y, promise, resolve, reject);
    }, reject);
  } else if ((x && typeof x === "object") || typeof x === "function") {
    // 2.3.3 如果x是一个对象或者函数
    //     2.3.3.1 让then变成x.then
    //     2.3.3.2 如果检索属性x.then导致引发异常e，则promise变成rejected， reason为e
    try {
      var then = x.then;
    } catch (error) {
      // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
      return reject(error);
    }

    if (typeof then === "function") {
      //     2.3.3.3 如果then是一个函数，则用x作为this来调用它，
      //     第一个参数resolvePromise，
      //     第二个参数rejectPromise
      var called = false;

      try {
        then.call(
          x,
          (v) => {
            if (called) return;
            called = true;

            resolvePromiseByX(v, promise, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            // 2.3.3.3.2 当rejectPromise传入r调用时，promise变成rejected，reason也为r
            reject(r);
          }
        );
      } catch (err) {
        if (called) return;
        reject(err);
      }
    } else {
      // 2.3.3.4 如果then不是一个方法， promise状态变成fulfilled，value为x
      //    2.3.3.3.4.1 如果已调用resolvePromise或rejectPromise，则将其忽略
      resolve(x);
    }
  } else {
    resolve(x);
  }
}
class MyPromise {
  constructor(fn) {
    this.status = STATUS.PENDING;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    try {
      fn(resolve.bind(this), reject.bind(this));
    } catch (err) {
      reject.call(this, err);
    }
  }

  // 2.2 then方法
  // then方法接受两个参数 onFulfilled, onRejected
  then(onFulfilled, onRejected) {
    // 2.2.1 onFulfilled和onRejected都是可选参数
    const finalOnFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    const finalOnRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };

    if (this.status === STATUS.FULFILLED) {
      var promise2 = new MyPromise((resolve, reject) => {
        nextTick(() => {
          try {
            if (typeof onFulfilled === "function") {
              const x = onFulfilled(this.value);
              resolvePromiseByX(x, promise2, resolve, reject);
            } else {
              // 2.2.7.3 如果onFulfilled不是一个函数，
              //         并且promise1是fulfilled状态，
              //         那么promise2一定是fulfilled状态，
              //         并且它的value是promise1的value
              resolve(this.value);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
      return promise2;
    } else if (this.status === STATUS.REJECTED) {
      const promise2 = new MyPromise((resolve, reject) => {
        nextTick(() => {
          try {
            if (typeof onRejected === "function") {
              const x = onRejected(this.reason);
              resolvePromiseByX(x, promise2, resolve, reject);
            } else {
              // 2.2.7.4 如果onRejected不是一个函数，
              //         并且promise1是rejected状态，
              //         那么promise2一定是rejected状态
              //         并且它的reason是promise1的reason
              reject(this.reason);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
      return promise2;
    } else {
      /** 碰到resolve，reject异步调用时
       *    setTimeout(() => {
       *      resolve() / reject()
       *    }, time)
       *  将 onFulfilled, onRejected先存储
       */
      const promise2 = new MyPromise((resolve, reject) => {
        this.onFulfilledCallbacks.push(() => {
          nextTick(() => {
            try {
              if (typeof onFulfilled === "function") {
                const x = onFulfilled(this.value);
                resolvePromiseByX(x, promise2, resolve, reject);
              } else {
                resolve(this.value);
              }
            } catch (err) {
              reject(err);
            }
          });
        });
        this.onRejectedCallbacks.push(() => {
          nextTick(() => {
            try {
              if (typeof onRejected === "function") {
                const x = onRejected(this.reason);
                resolvePromiseByX(x, promise2, resolve, reject);
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
}

module.exports = {
  resolved: function (value) {
    return new MyPromise(function (resolve) {
      resolve(value);
    });
  },
  rejected: function (reason) {
    return new MyPromise(function (resolve, reject) {
      reject(reason);
    });
  },
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
