// 1
{
  const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("success");
    }, 500);
  });

  p1.then((res) => {
    console.log("1", res);
  });

  p1.then((res) => {
    console.log("2", res);
  });

  const p2 = p1.then(1);
  p2.then((res) => {
    console.log("p2", res);
  });
}

// 2
{
  const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject("p1 error");
    }, 1000);
  });
  const p2 = p1.then(undefined, (err) => {
    console.log("error", err);
  });
  p2.then(
    (res) => {
      console.log("p2 success", res);
    },
    (err) => {
      console.log("p2 error", err);
    }
  );
}

// 3
{
  const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("p1 success");
    }, 1500);
  });

  function res() {
    return "我是res函数";
  }

  res.then = (resolve, reject) => {
    reject("error 1");
    reject("error 2");
    resolve("success 1");
    resolve("success 2");

    throw new Error("error 3");
  };

  // const res = {
  //   then: function (resolve, reject) {
  //     reject("error 1");
  //     reject("error 2");
  //     resolve("success 1");
  //     resolve("success 2");

  //     throw new Error("error 3");
  //   },
  // };

  const p2 = p1.then(() => res);

  p2.then(
    (res) => {
      console.log("p2 success", res);
    },
    (err) => {
      console.log("p2 error", err);
    }
  );
}
