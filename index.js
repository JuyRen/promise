/* thenable
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

// 模拟微任务
function simulationMicrotask(cb) {
  if (
    typeof process !== "undefined" &&
    typeof process.nextTick === "function"
  ) {
    process.nextTick(cb);
  } else {
    queueMicrotask(cb);
  }
}

const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor() {
    this.status = STATUS.PENDING;
    this.value = undefined;
    this.reason = undefined;
  }

  then(onFulfilled, onRejected) {
    if (onFulfilled) {
      if (typeof onFulfilled === "function") {
        if (this.status === STATUS.FULFILLED) {
          onFulfilled(this.value);
        }
      }
    }

    if (onRejected) {
      if (typeof onRejected === "function") {
        if (this.status === STATUS.REJECTED) {
          onRejected(this.reason);
        }
      }
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
