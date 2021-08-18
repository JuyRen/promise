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

function promiseResolutionProcedure(promise, x, resolve, reject) {
  if (promise === x) {
    throw new TypeError("same object");
  } else if (x instanceof MSPromise) {
    x.then((y) => {
      promiseResolutionProcedure(promise, y, resolve, reject);
    }, reject);
  } else if ((typeof x === "object" && x !== null) || typeof x === "function") {
    let then;
    let called = false;

    try {
      then = x.then;
    } catch (error) {
      reject(error);
    }

    if (typeof then === "function") {
      try {
        const resolvePromise = (y) => {
          if (!called) {
            promiseResolutionProcedure(promise, y, resolve, reject);
            called = true;
          }
        };

        const rejectPromise = (error) => {
          if (!called) {
            reject(error);
            called = true;
          }
        };

        then.call(x, resolvePromise, rejectPromise);
      } catch (error) {
        if (!called) {
          reject(error);
        }
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}

class MSPromise {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING;
    this.value = null;
    this.reason = null;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        if (value instanceof MSPromise) {
          value.then(resolve, reject);
        } else {
          this.status = PROMISE_STATUS.FULFILLED;
          this.value = value;

          if (this.onFulfilledCallbacks.length) {
            this.onFulfilledCallbacks.forEach((cb) => {
              cb();
            });

            this.onFulfilledCallbacks = [];
          }
        }
      }
    };

    const reject = (reason) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.REJECTED;
        this.reason = reason;

        if (this.onRejectedCallbacks.length) {
          this.onRejectedCallbacks.forEach((cb) => {
            cb();
          });

          this.onRejectedCallbacks = [];
        }
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    if (this.status === PROMISE_STATUS.FULFILLED) {
      const promise2 = new MSPromise((resolve, reject) => {
        nextTick(() => {
          if (onFulfilled) {
            if (typeof onFulfilled === "function") {
              try {
                const x = onFulfilled(this.value);
                promiseResolutionProcedure(promise2, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            } else {
              resolve(this.value);
            }
          } else {
            resolve(this.value);
          }
        });
      });

      return promise2;
    }

    if (this.status === PROMISE_STATUS.REJECTED) {
      const promise2 = new MSPromise((resolve, reject) => {
        nextTick(() => {
          if (onRejected) {
            if (typeof onRejected === "function") {
              try {
                const x = onRejected(this.reason);
                promiseResolutionProcedure(promise2, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(this.reason);
            }
          } else {
            reject(this.reason);
          }
        });
      });

      return promise2;
    }

    if (this.status === PROMISE_STATUS.PENDING) {
      const promise2 = new MSPromise((resolve, reject) => {
        this.onFulfilledCallbacks.push(() => {
          nextTick(() => {
            if (onFulfilled) {
              if (typeof onFulfilled === "function") {
                try {
                  const x = onFulfilled(this.value);
                  promiseResolutionProcedure(promise2, x, resolve, reject);
                } catch (error) {
                  reject(error);
                }
              } else {
                resolve(this.value);
              }
            } else {
              resolve(this.value);
            }
          });
        });

        this.onRejectedCallbacks.push(() => {
          nextTick(() => {
            if (onRejected) {
              if (typeof onRejected === "function") {
                try {
                  const x = onRejected(this.reason);
                  promiseResolutionProcedure(promise2, x, resolve, reject);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(this.reason);
              }
            } else {
              reject(this.reason);
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

  finally(cb) {
    return this.then(
      (value) => {
        try {
          cb();
          return value;
        } catch (error) {
          throw error;
        }
      },
      (error) => {
        try {
          cb();
          throw error;
        } catch (e) {
          throw e;
        }
      }
    );
  }

  static resolve(x) {
    if (x instanceof MSPromise) {
      return x;
    }

    if (x.then) {
      return new MSPromise((resolve, reject) => {
        return x.then(resolve, reject);
      });
    }

    return new MSPromise((resolve, reject) => {
      resolve(x);
    });
  }

  static reject(x) {
    return new MSPromise((resolve, reject) => {
      reject(x);
    });
  }

  static all(array) {
    return new MSPromise((resolve, reject) => {
      var count = 0;
      var result = [];
      for (let i = 0, len = array.length; i < len; i++) {
        const item = MSPromise.resolve(array[i]);
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

  static race(array) {
    return new MSPromise((resolve, reject) => {
      for (let i = 0; i < array.length; i++) {
        const item = MSPromise.resolve(array[i]);

        item.then(resolve, reject);
      }
    });
  }
}

module.exports = {
  MSPromise,
  deferred: function () {
    var resolve, reject;
    return {
      promise: new MSPromise(function (res, rej) {
        resolve = res;
        reject = rej;
      }),
      resolve: resolve,
      reject: reject,
    };
  },
};
