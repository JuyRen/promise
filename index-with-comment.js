// 2.1 Promise 状态
const PROMISE_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

// 2.2.4 在执行上下文栈只包含平台代码（platform code）之前，
//       onFulfilled 或者 onRejected都不会执行
//       文档中建议可以使用setTimeout宏任务， 或者 MutationObserver()/process.nextTick()
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
  // 2.3.1 promise和x指向同一个对象，
  //       会将promise状态变成rejected，
  //       并且reason是一个TypeError
  if (promise === x) {
    return reject(
      new TypeError("Chaining cycle detected for promise #<Promise>")
    );
  } else if (x instanceof MyPromise) {
    // 2.3.2 如果x是一个promise,会采纳它的状态
    x.then((y) => {
      resolvePromise2ByValue(promise, y, resolve, reject);
    }, reject);
  } else if ((x && typeof x === "object") || typeof x === "function") {
    // 2.3.3 如果x是一个对象或者函数
    let then;

    //  2.3.3.2 如果检索属性x.then导致引发异常e，则promise变成rejected， reason为e
    try {
      then = x.then; // 2.3.3.1 让then变成x.then
    } catch (err) {
      reject(err);
    }

    // 2.3.3.3 如果then是一个函数，则用x作为this来调用它，第一个参数
    if (typeof then === "function") {
      let called = false; // 2.3.3.3.3 如果同时调用resolvePromise和rejectPromise，或者对同一参数进行了多次调用，则第一个调用优先，而所有其他调用均被忽略
      try {
        // then接受两个参数， 第一个参数代表resolvePromise， 第二个参数是reject
        then.call(
          x,
          (y) => {
            //  2.3.3.3.1 当resolvePromise被调用，并且传入y时，运行[[Resolve]]（promise，y）
            if (called) return;
            called = true;
            resolvePromise2ByValue(promise, y, resolve, reject);
          },
          (r) => {
            // 2.3.3.3.2 当rejectPromise传入r调用时，promise变成rejected，reason也为r
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } catch (e) {
        // 2.3.3.3.4 如果调用then的过程中，抛出异常e
        if (called) return; // 2.3.3.3.4.1 如果已调用resolvePromise或rejectPromise，则将其忽略
        reject(e); // 2.3.3.3.4.2 否则promise变成rejected，reason为e
      }
    } else {
      // 2.3.3.4 如果then不是一个方法， promise状态变成fulfilled，value为x
      resolve(x);
    }
  } else {
    // 2.3.4 如果x不是函数或者对象，promise变成fulfilled，value值为x
    resolve(x);
  }
}
class MyPromise {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING; // 初始状态
    this.value = null; // value: js中任何数据类型，包括undefined，thenable, promise
    this.reason = null; // reason: 用来描述”promise“为什么”rejected“

    this.onFulfilledCallbacksQueue = []; // 存放状态变为fulfilled时的回调 多次promise.then() promise.then() promise.then()，每个都要储存
    this.onRejectedCallbacksQueue = []; // 存放状态变为rejected时的回调

    const resolve = (value) => {
      //     2.1.2 处于fulfilled的时候，promise表现如下：
      //          2.1.2.1 不能再改变promise状态
      //          2.1.2.2 必须有一个不会改变的value （must not change）
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.FULFILLED;
        this.value = value;

        // 回调的执行
        if (this.onFulfilledCallbacksQueue.length) {
          this.onFulfilledCallbacksQueue.forEach((callback) => {
            callback();
          });
        }
      }
    };

    const reject = (reason) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        // 2.1.3 处于rejected的时候， promise表现如下：
        //      2.1.3.1 不能再改变promise状态
        //      2.1.3.2 必须有一个不会改变的reason （must not change）
        this.status = PROMISE_STATUS.REJECTED;
        this.reason = reason;

        // 回调的执行
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

  // 2.2 promise 必须提供 then 方法，去接受当前或最终的 value 或 reason。
  // then方法接受两个参数onFulfilled, onRejected
  then(onFulfilled, onRejected) {
    if (this.status === PROMISE_STATUS.FULFILLED) {
      const promise2 = new MyPromise((resolve, reject) => {
        nextTick(() => {
          // 2.2.7.3 如果onFulfilled不是一个函数，
          //         并且promise1是fulfilled状态，
          //         那么promise2一定是fulfilled状态，
          //         并且它的value是promise1的value
          if (typeof onFulfilled !== "function") {
            resolve(this.value);
          } else {
            try {
              // 2.2.7.1 如果onFulfilled是函数， return了一个值x，
              //         那么promise2 => [[Resolve]](promise2, x).
              const x = onFulfilled(this.value);
              resolvePromise2ByValue(promise2, x, resolve, reject);
            } catch (err) {
              // 2.2.7.2 如果onFulfilled, throw了一个“exception” e，
              //         那么promise2一定会变成rejected状态，它的reason就是e
              reject(err);
            }
          }
        });
      });
      return promise2; // 2.2.7 then 必须返回promise
    } else if (this.status === PROMISE_STATUS.REJECTED) {
      const promise2 = new Promise((resolve, reject) => {
        nextTick(() => {
          // 2.2.7.4 如果onRejected不是一个函数，
          //         并且promise1是rejected状态，
          //         那么promise2一定是rejected状态，
          //         并且它的reason是promise1的reason
          if (typeof onRejected !== "function") {
            reject(this.reason);
          } else {
            try {
              // 2.2.7.1 如果onRejected是函数， return了一个值x，
              //         那么promise2 => [[Resolve]](promise2, x).
              const x = onRejected(this.reason);
              resolvePromise2ByValue(promise2, x, resolve, reject);
            } catch (err) {
              // 2.2.7.2 如果onRejected, throw了一个“exception” e，
              //         那么promise2一定会变成rejected状态，它的reason就是e
              reject(err);
            }
          }
        });
      });

      return promise2; // 2.2.7 then 必须返回promise
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

      return promise2; // 2.2.7 then 必须返回promise
    }
  }
}

module.exports = {
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
