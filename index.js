// promise的状态一定是以下三者之一：pending（等待）, fulfilled（完成）, rejected（拒绝）
const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

// 2.1.1 处于pending的时候，promise表现如下：
//     2.1.1.1 能够转变成fulfilled状态或者rejected状态

// 2.1.2 处于fulfilled的时候，promise表现如下：
//     2.1.2.1 不能再改变promise状态
//     2.1.2.2 必须有一个不会改变的value （must not change）

// 2.1.3 处于rejected的时候， promise表现如下：
//     2.1.3.1 不能再改变promise状态
//     2.1.3.2 必须有一个不会改变的reason （must not change）

function transition(promise, targetStatus, result) {
  if (promise.status === STATUS.PENDING) {
    promise.status = targetStatus;

    if (targetStatus === STATUS.FULFILLED) {
      promise.value = result;
    }

    if (targetStatus === STATUS.REJECTED) {
      promise.reason = result;
    }
  }
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

function resolve(value) {
  if (this.status === STATUS.PENDING) {
    this.status = STATUS.FULFILLED;
    this.value = value;
  }
}

function reject(reason) {
  if (this.status === STATUS.PENDING) {
    this.status = STATUS.REJECTED;
    this.reason = reason;
  }
}

class MyPromise {
  constructor(fn) {
    this.status = STATUS.PENDING;

    try {
      fn(resolve.bind(this), reject.bind(this));
    } catch (err) {
      reject.call(this, err);
    }
  }

  // promise 必须提供then方法，去接受当前或最终的value或reason。
  // then方法接受两个参数onFulfilled, onRejected
  then(onFulfilled, onRejected) {
    // 2.2.2 如果onFulfilled是一个函数：
    if (typeof onFulfilled === "function") {
      // 2.2.2.1 它一定会在promise的状态变成fulfilled的时候被执行,并且它的第一个参数会是promise的value
      if (this.status === STATUS.FULFILLED) {
        // 2.2.4 在执行上下文栈只包含平台代码（platform code）之前， onFulfilled 或者 onRejected都不会执行(笔者备注：函数执行栈清空之后才去执行， platform code个人理解为非自己手写的代码，如js解析器...)
        executeAsynchronously(() => {
          onFulfilled(this.value);
        });
      }
    }

    // 2.2.3 如果onRejected是一个函数
    if (typeof onRejected === "function") {
      // 2.2.3.1 它一定会在promise的状态变成rejected的时候被执行,并且它的第一个参数会是promise的reason
      if (this.status === STATUS.REJECTED) {
        executeAsynchronously(() => {
          onRejected(this.reason);
        });
      }
    }
  }
}
