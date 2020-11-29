import { Readable } from "stream";

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    stream.on("data", (buffer) => {
      buffers.push(buffer);
    });
    stream.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    stream.on("error", (err) => reject(err));
  });
};

export default streamToBuffer;
