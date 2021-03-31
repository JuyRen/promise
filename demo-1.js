const { MyPromise } = require("./index");
// 封装一个对api 间隔执行的函数，[4000, 3000, 2000, 1000]
async function ajax() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      const number = Math.random() * 100;
      console.log("number: ", number);

      if (number < 20) resolve("success");

      if (number > 95) reject("错误number");

      resolve("pending");
    }, 1000);
  });
}

function apiPolling(api) {
  let maxTime = 10 * 1000;
  const _interval = [3 * 1000, 2 * 1000, 1 * 1000];
  const interval = [0, ..._interval];
  let index = 0;
  let maxIndex = interval.length - 1;
  const startTime = Date.now();

  return new MyPromise((resolve, reject) => {
    function run() {
      setTimeout(() => {
        const curTime = Date.now();
        console.log("curTime - startTime: ", curTime - startTime);
        if (curTime - startTime > maxTime) {
          reject({
            type: "timeout",
          });
        } else {
          api()
            .then((res) => {
              if (res === "pending") {
                if (index < maxIndex) index++;
                run();
              } else {
                resolve(res);
              }
            })
            .catch((err) => {
              reject({
                type: "error",
                reason: err.message || err,
              });
            });
        }
      }, interval[index]);
    }

    run();
  });
}

apiPolling(ajax)
  .then((res) => {
    console.log("res: ", res);
  })
  .catch((err) => {
    console.log("err: ", err);
  });
