export const delayFunc = (time = 500, func) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        func();
        resolve();
      } catch (err) {
        reject(err);
      }
    }, time);
  });
};
