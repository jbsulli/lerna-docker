import { Readable } from "stream";

import { packFile, ITarEntryOptions, packStream } from "./pack";

export interface ITarFileSource extends ITarEntryOptions {
  src: () => string | Buffer | Readable;
}

// TODO: glob, directory, symlink
export type TarSource = ITarFileSource;

function isTarFileSource(src: TarSource): src is ITarFileSource {
  return "src" in src;
}

const readTarSource = (files: Iterable<TarSource>) => {
  const iterate = files[Symbol.iterator]();
  let options: ITarEntryOptions | undefined;
  let stream: Readable | undefined;

  const getNext = (): Buffer | Readable | string | undefined => {
    const next = iterate.next();

    // are we done yet?
    if (next.done) {
      options = undefined;
      return;
    }

    // should have a new file
    const currentFile = next.value;

    // file source?
    if (isTarFileSource(currentFile)) {
      const { src: newSrc, ...newOptions } = currentFile;
      options = newOptions;
      return newSrc();
    }

    // unhandled type
    throw new Error("Unsupported tar entry");
  };

  const read = (size: number): Buffer | null => {
    if (!stream) {
      const src = getNext();

      // no more files?
      if (!options) return null;

      // TODO: check for links and directories here
      if (!src) {
        throw new Error(`Missing file source for ${options.name}`);
      }

      // already have the file in memory?
      if (!(src instanceof Readable)) {
        const result = packFile(src, options);
        return result;
      }

      // must be a stream
      stream = packStream(src, options);
    }

    const chunk = stream.read(size);

    if (chunk === null) {
      // done with file so clear the stream and start reading a new file
      stream = undefined;
      return read(size);
    }

    return chunk;
  };

  return read;
};

class Tar extends Readable {
  public promise: Promise<void>;
  private readFiles: (size: number) => Buffer | null;
  private done = false;

  constructor(files: Iterable<TarSource>) {
    super();
    this.readFiles = readTarSource(files);
  }

  _read(size) {
    try {
      let chunk: Buffer | null;
      do {
        if (this.done) {
          this.push(null);
          return;
        }

        chunk = this.readFiles(size);

        if (chunk === null) {
          // we have processed all the files
          this.done = true;

          // Add the tail padding
          chunk = Buffer.alloc(1024);
        }
      } while (this.push(chunk));
    } catch (err: unknown) {
      this.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

const tar = (files: Iterable<TarSource>): Tar => {
  return new Tar(files);
};

export default tar;
