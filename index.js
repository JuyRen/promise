// 在执行上下文栈清空之前

//  * 2.1 promise的状态一定是以下三者之一：
const STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

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

function resolve(value) {
  // 2.1.1 处于pending的时候，promise
  //    2.1.1.1.能够转变成fulfilled
  if (this.status === STATUS.PENDING) {
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

    nextTick(() => {
      if (this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.forEach((onFulfilled) => onFulfilled());
      }

      this.onFulfilledCallbacks = [];
    });
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

    nextTick(() => {
      if (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.forEach((onRejected) => onRejected());
      }

      this.onRejectedCallbacks = [];
    });
  }
}

function resolvePromiseByX(x, promise, resolve, reject) {
  if (promise === x) {
    console.log("in resolvePromiseByX: step 1");
    // 2.3.1 promise和x指向同一个对象，会将promise状态变成rejected，并且reason是一个TypeError
    return reject(new TypeError("promise and x are same "));
  } else if (x instanceof MyPromise) {
    console.log("in resolvePromiseByX: step 2");
    // 2.3.2 如果x是一个promise,会采纳它的状态
    if (x.status === STATUS.PENDING) {
      //    2.3.2.1 如果x处于pending, 那么promise必须保持pending直到x变成fulfilled或者rejected
      x.then(resolve, reject);
    } else if (x.status === STATUS.FULFILLED) {
      // 2.3.2.2 如果x变成fulfilled，那么promise也变成fulfilled，它的value与x.value相同
      resolve(x.value);
    } else {
      // 2.3.2.3 如果x变成rejected，那么promise也变成rejected，它的reason与x.reason相同
      reject(x.reason);
    }
  } else if (typeof x === "object" || typeof x === "function") {
    console.log("in resolvePromiseByX: step 3");
    // 2.3.3 如果x是一个对象或者函数
    try {
      //     2.3.3.1 让then变成x.then
      //     2.3.3.2 如果检索属性x.then导致引发异常e，则promise变成rejected， reason为e
      let then = x.then;

      //     2.3.3.3.3 如果同时调用resolvePromise和rejectPromise，或者对同一参数进行了多次调用，则第一个调用优先，而所有其他调用均被忽略
      var called = false;

      if (typeof then === "function") {
        //     2.3.3.3 如果then是一个函数，则用x作为this来调用它，
        //     第一个参数resolvePromise，
        //     第二个参数rejectPromise
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
      } else {
        // 2.3.3.4 如果then不是一个方法， promise状态变成fulfilled，value为x

        // 2.3.3.3.4.1 如果已调用resolvePromise或rejectPromise，则将其忽略
        if (called) return;
        resolve(x);
      }
    } catch (err) {
      reject(err);
    }
  } else {
    console.log("in resolvePromiseByX: step 4");
    resolve(x);
  }
}
class MyPromise {
  constructor(fn) {
    this.status = STATUS.PENDING;
    this.value = null;
    this.reason = null;

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
            const x = finalOnFulfilled(this.value);
            resolvePromiseByX(x, promise2, resolve, reject);
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
            finalOnRejected(this.reason);
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
          try {
            finalOnFulfilled(this.value);
          } catch (err) {
            reject(err);
          }
        });
        this.onRejectedCallbacks.push(() => {
          try {
            finalOnRejected(this.reason);
          } catch (err) {
            reject(err);
          }
        });
      });
      return promise2;
    }
  }
}

const p = new MyPromise((resolve, reject) => {
  resolve(100);
});

p.then(
  (res) => {
    console.log("res: ", res);
    return {
      x: 1,
      then(resolvePromise, rejectPromise) {
        resolvePromise(1000);
      },
    };
  },
  (err) => {
    console.log("err: ", err);
  }
).then(
  (res) => {
    console.log("res1: ", res);
  },
  (err) => {
    console.log("err1: ", err);
  }
);
