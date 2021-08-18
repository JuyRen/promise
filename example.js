const { MSPromise } = require("./index");

const p = MSPromise.race([]);

p.then((res) => console.log(res)).catch((err) => console.log("err", err));
// {
//   const p = new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve("成功");
//     }, 1000);

//     reject("失败");
//   });

//   p.then(
//     (res) => {
//       console.log(res);
//     },
//     (error) => {
//       console.log(error);
//     }
//   );
// }

// {
//   const p = new Promise((resolve, reject) => {
//     resolve("成功");
//   });

//   p.then(console.log(2)).then((res) => {
//     console.log(res);
//   });
//   p.then(() => console.log(2)).then((res) => {
//     console.log(res);
//   });
// }

// {
//   const p = new Promise((resolve, reject) => {
//     resolve("成功");
//   });

//   p.then((res) => {
//     return {
//       then(resolve, reject) {
//         reject(res);
//         resolve(res);
//         throw new Error("c");
//       },
//     };
//   }).then(
//     (res) => {
//       console.log("res: ", res);
//     },
//     (error) => {
//       console.log("error: ", error);
//     }
//   );
// }

// {
//   const p = new Promise((resolve, reject) => {
//     reject("失败");
//   });

//   const d = p.catch((error) => {
//     return error;
//   });

//   d.then(
//     (res) => console.log("成功", res),
//     (error) => console.log("error", error)
//   );
// }

// {
//   const d = MSPromise.resolve().then((res) => {
//     return new MSPromise((resolve, reject) => {
//       resolve(
//         new MSPromise((resolve1, reject1) => {
//           resolve1(MSPromise.reject("失败了"));
//         })
//       );
//     });
//   });

//   d.then(
//     (res) => console.log("成功"),
//     (error) => console.log("error", error)
//   );
// }

// {
//   const p = new Promise((resolve, reject) => {
//     reject(Promise.reject(1));
//   });

//   p.then(
//     (res) => console.log("res", res),
//     (error) => console.log("error", error)
//   );
// }
