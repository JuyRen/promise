const { MyPromise } = require("./index");

MyPromise.resolve()
  .then(() => {
    console.log(0);
    return MyPromise.resolve(4); // resolvePromise(x)  此时x是一个promise对象, 注册一个then，加入微任务队列
  })
  .then((res) => {
    console.log(res);
  });

MyPromise.resolve()
  .then(() => {
    console.log(1);
  })
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(3);
  })
  .then(() => {
    console.log(5);
  })
  .then(() => {
    console.log(6);
  });
