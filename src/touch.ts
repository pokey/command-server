// From https://gist.githubusercontent.com/remarkablemark/17c9c6a22a41510b2edfa3041ccca95a/raw/b11f087313b4c6f32733989ee24d65e1b643f007/touch-promise.js

import { close, open, utimes } from "fs";

const touch = (path: string) => {
  return new Promise<void>((resolve, reject) => {
    const time = new Date();
    utimes(path, time, time, (err) => {
      if (err) {
        return open(path, "w", (err, fd) => {
          if (err) {
            return reject(err);
          }
          close(fd, (err) => (err ? reject(err) : resolve()));
        });
      }
      resolve();
    });
  });
};

export default touch;
