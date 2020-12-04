import { pipeline } from "stream";

const streamPipeline = async <T extends NodeJS.ReadWriteStream[]>(
  ...args: [
    readStream: NodeJS.ReadableStream,
    ...transformStreams: T,
    writeStream: NodeJS.WritableStream
  ]
): Promise<void> => {
  return new Promise((resolve, reject) => {
    pipeline(
      ...((args as unknown) as [NodeJS.ReadableStream, NodeJS.WritableStream]),
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

export default streamPipeline;
