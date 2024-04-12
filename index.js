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

class MyPromise {
  constructor(executor) {
    // 将promise状态从 pending  ==》 fulfilled
    const resolve = (value) => {};

    // 将promise状态从 pending ==》 rejected
    const reject = (reason) => {};

    executor(resolve, reject);
  }

  then() {}
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
