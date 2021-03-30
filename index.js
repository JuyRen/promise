/**
 * 根据Promise/A+ 规范一步一步手写
 * 自己中文翻译地址：https://juejin.cn/post/6944373283928145934
 * @time 2021/03/28
 */

// 个人理解：
// 1. promise实例的状态是 new Promise(() => ), 如何调用resolve或reject确定的
// 2. .then()， 是对前一个promise状态变更的异步回调， 以及对后一个promise状态的确立

// promise的状态一定是以下三者之一：pending（等待）, fulfilled（完成）, rejected（拒绝）
const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

function transition(promise, targetStatus, value) {
  // 2.1.1 处于pending的时候，promise表现如下：
  if (promise.status === STATUS.PENDING) {
    // 2.1.2 处于fulfilled的时候，promise表现如下：
    if (targetStatus === STATUS.FULFILLED) {
      //     2.1.2.1 不能再改变promise状态
      Object.defineProperty(promise, "status", {
        writable: false,
        configurable: false,
        value: targetStatus,
      });

      //     2.1.2.2 必须有一个不会改变的value （must not change）
      Object.defineProperty(promise, "value", {
        writable: false,
        configurable: false,
        value,
      });

      if (promise.onFulfilledCallbacks.length) {
        promise.onFulfilledCallbacks.forEach((onFulfilled) => onFulfilled());
      }
    }

    // 2.1.3 处于rejected的时候， promise表现如下：
    if (targetStatus === STATUS.REJECTED) {
      //     2.1.3.1 不能再改变promise状态
      Object.defineProperty(promise, "status", {
        writable: false,
        configurable: false,
        value: targetStatus,
      });

      //     2.1.3.2 必须有一个不会改变的reason （must not change）
      Object.defineProperty(promise, "reason", {
        writable: false,
        configurable: false,
        value,
      });

      if (promise.onRejectedCallbacks.length) {
        promise.onRejectedCallbacks.forEach((onRejected) => onRejected());
      }
    }
  }
}

function resolve(value) {
  transition(this, STATUS.FULFILLED, value);
}

function reject(reason) {
  transition(this, STATUS.REJECTED, reason);
}

// 异步调用onFulfilled,onRejected
function executeAsynchronously(cb) {
  if (typeof process !== "undefined") {
    process.nextTick(cb);
  } else {
    const mo = new MutationObserver(cb);
    const textNode = document.createTextNode("1");
    mo.observe(textNode, {
      characterData: true,
    });
    textNode.data = "2";
  }
}

// Promise Resolution Procedure
function resolvePromiseByX(x, promise, resolve, reject) {
  // 2.3.1 promise和x指向同一个对象，会将promise状态变成rejected，并且reason是一个TypeError
  if (promise === x) {
    throw TypeError("Chaining cycle detected for promise #<Promise>");
  }

  // 2.3.2 如果x是一个promise,会采纳它的状态
  else if (x instanceof MyPromise) {
    //   2.3.2.1 如果x处于pending, 那么promise必须保持pending直到x变成fulfilled或者rejected
    if (x.status === STATUS.PENDING) {
      x.then(
        (X) => {
          // resolve(X)
          // 对X 也要进行 Promise Resolution Procedure
          resolvePromiseByX(X, promise, resolve, reject);
        },
        (reason) => {
          reject(reason);
        }
      );
    } else if (x.status === STATUS.FULFILLED) {
      //   2.3.2.2 如果x变成fulfilled，那么promise也变成fulfilled，它的value与x相同
      resolve(x.value);
    } else {
      //   2.3.2.3 如果x变成rejected，那么promise也变成rejected，它的reason与x相同
      reject(x.reason);
    }
  }

  // 2.3.3 如果x是一个对象或者函数
  else if (["[object Object]"].includes(Object.prototype.toString.call(x))) {
    var called = false;

    try {
      // 2.3.3.1 让then变成x.then
      let then = x.then;
      // 2.3.3.3 如果then是一个函数，则用x作为this来调用它，
      //        第一个参数resolvePromise
      //        第二个参数rejectPromise
      if (typeof then === "function") {
        then.call(
          x,
          (Y) => {
            if (called) return;
            called = true;
            resolvePromiseByX(Y, promise, resolve, reject);
          },
          (reason) => {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } else {
        console.log("resolve: ", resolve);
        resolve(x);
      }
    } catch (err) {
      // 2.3.3.2 如果检索属性x.then导致引发异常e，则promise变成rejected， reason为e
      // 2.3.3.3.4 如果调用then的过程中，抛出异常e
      if (called) return;
      reject(err);
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

  // 2.2 promise 必须提供then方法，去接受当前或最终的value或reason。
  //     then方法接受两个参数onFulfilled, onRejected
  then(onFulfilled, onRejected) {
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === STATUS.FULFILLED) {
        executeAsynchronously(() => {
          try {
            // 2.2.2 如果onFulfilled是一个函数：
            //    2.2.2.1 它一定会在promise的状态变成fulfilled的时候被执行
            //            并且它的第一个参数会是promise的value
            if (typeof onFulfilled === "function") {
              const x = onFulfilled(this.value); // 执行fulfilled回调，并且获取到返回值x
              resolvePromiseByX(x, promise2, resolve, reject); // 对x进行 Promise Resolution Procedure
            } else {
              resolve(this.value);
            }
          } catch (err) {
            reject(err);
          }
        });
      } else if (this.status === STATUS.REJECTED) {
      } else {
        this.onFulfilledCallbacks.push(function () {
          executeAsynchronously(() => {
            try {
              onFulfilled(this.value);
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    });

    return promise2;
  }
}

const p = new MyPromise((resolve, reject) => {
  resolve(1);
});

const p2 = p
  .then((res) => {
    console.log("res: ", res);
    return {
      x: 1,
      // then: (resolvePromise, rejectPromise) => {
      //   rejectPromise(2000);
      //   resolvePromise(1000);
      // },
    };
  })
  .then(
    (res) => {
      console.log(res);
    },
    (err) => {
      console.log("err: ", err);
    }
  );
