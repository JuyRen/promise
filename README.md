# 1. Terminology： 术语

    1.1 "promise" ：拥有then方法的对象或函数.

    1.2 "thenable"：能够定义then方法的对象或函数

    1.3 ”value“：js中任何数据类型，包括undefined，thenable, promise

    1.4 "exception（异常）": 通过throw抛出的值

    1.5 “reason": 用来描述”promise“为什么”rejected“

# 2. Requirements： 要求

2.1 Promise 状态

> promise 的状态一定是以下三者之一：pending（等待）, fulfilled（完成）, rejected（拒绝）

    2.1.1 处于pending的时候，promise表现如下：
        2.1.1.1 能够转变成fulfilled状态或者rejected状态

    2.1.2 处于fulfilled的时候，promise表现如下：
        2.1.2.1 不能再改变promise状态
        2.1.2.2 必须有一个不会改变的value （must not change）

    2.1.3 处于rejected的时候， promise表现如下：
        2.1.3.1 不能再改变promise状态
        2.1.3.2 必须有一个不会改变的reason （must not change）

2.2 then 方法

> promise 必须提供 then 方法，去接受当前或最终的 value 或 reason。

```
then方法接受两个参数
promise.then(onFulfilled, onRejected)
```

    2.2.1 onFulfilled和onRejected都是可选参数
        2.2.1.1 如果onFulfilled不是一个函数，那么它必须被忽略
        2.2.1.2 如果onRejected不是一个函数，那么它必须被忽略

    2.2.2 如果onFulfilled是一个函数：
        2.2.2.1 它一定会在promise的状态变成fulfilled的时候被执行,并且它的第一个参数会是promise的value
        2.2.2.2 它一定不会在promise的状态变成fulfilled之前执行
        2.2.2.3 它一定不会执行多次

    2.2.3 如果onRejected是一个函数
        2.2.3.1 它一定会在promise的状态变成rejected的时候被执行,并且它的第一个参数会是promise的reason
        2.2.3.2 它一定不会在promise的状态变成rejected之前执行
        2.2.3.3 它一定不会执行多次

    2.2.4 在执行上下文栈只包含平台代码（platform code）之前， onFulfilled 或者 onRejected都不会执行(笔者备注：函数执行栈清空之后才去执行， platform code个人理解为非自己手写的代码，如js解析器...)

    2.2.5 onFulfilled和onRejected必须作为函数调用

    2.2.6 then可能会在同一个promise中调用很多次
        2.2.6.1 当promise状态为fulfilled时，onFulfilled必须按照顺序依次执行
        2.2.6.2 当promise状态为rejected时，onRejected必须按照顺序依次执行

    2.2.7 then 必须返回promise
     promise2 = promise1.then(onFulfilled, onRejected);

        2.2.7.1 如果onFulfilled或onRejected， return了一个值x，那么promise2 => [[Resolve]](promise2, x).
        2.2.7.2 如果onFulfilled或者onRejected, throw了一个“exception” e，那么promise2一定会变成rejected状态，它的reason就是e
        2.2.7.3 如果onFulfilled不是一个函数，并且promise1是fulfilled状态，那么promise2一定是fulfilled状态，并且它的value是promise1的value
        2.2.7.4 如果onRejected不是一个函数， 并且promise1是rejected状态， 那么promise2一定是rejected状态，并且它的reason是promise1的reason

2.3 The Promise Resolution Procedure

[[Resolve]](promise, x) , 遵循下面的步骤

    2.3.1 promise和x指向同一个对象，会将promise状态变成rejected，并且reason是一个TypeError
    2.3.2 如果x是一个promise,会采纳它的状态
        2.3.2.1 如果x处于pending, 那么promise必须保持pending直到x变成fulfilled或者rejected
        2.3.2.2 如果x变成fulfilled，那么promise也变成fulfilled，它的value与x相同
        2.3.2.3 如果x变成rejected，那么promise也变成rejected，它的reason与x相同
    2.3.3 如果x是一个对象或者函数
        2.3.3.1 让then变成x.then
        2.3.3.2 如果检索属性x.then导致引发异常e，则promise变成rejected， reason为e
        2.3.3.3 如果then是一个函数，则用x作为this来调用它，第一个参数resolvePromise，第二个参数rejectPromise
            2.3.3.3.1 当resolvePromise被调用，并且传入y时，运行[[Resolve]]（promise，y）
            2.3.3.3.2 当rejectPromise传入r调用时，promise变成rejected，reason也为r
            2.3.3.3.3 如果同时调用resolvePromise和rejectPromise，或者对同一参数进行了多次调用，则第一个调用优先，而所有其他调用均被忽略
            2.3.3.3.4 如果调用then的过程中，抛出异常e
                2.3.3.3.4.1 如果已调用resolvePromise或rejectPromise，则将其忽略
                2.3.3.3.4.2 否则promise变成rejected，reason为e
        2.3.3.4 如果then不是一个方法， promise状态变成fulfilled，value为x
    2.3.4 如果x不是函数或者对象，promise变成fulfilled，value值为x
