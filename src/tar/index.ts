import { Readable } from "stream";

import { packFile, ITarEntryOptions } from "./pack";

export interface ITarFileSource extends ITarEntryOptions {
  src: () => string | Buffer;
}

export interface ITarFileStream extends ITarEntryOptions {
  stream: () => ReadableStream;
}

// add glob, directory, symlink

export type TarFileSource = ITarFileSource | ITarFileStream;
export type TarSource = TarFileSource;

function isTarFileSource(src: TarSource): src is ITarFileSource {
  return "src" in src;
}

const getNextTarSource = (files: Iterable<TarSource>) => {
  const iterate = files[Symbol.iterator]();

  const getNext = (): TarSource | undefined => {
    const next = iterate.next();
    if (next.done) return undefined;
    return next.value;
  };

  return getNext;
};

class Tar extends Readable {
  public promise: Promise<void>;
  private currentFile: TarSource | undefined;
  private getNext: () => TarSource | undefined;

  constructor(files: Iterable<TarSource>) {
    super();
    this.getNext = getNextTarSource(files);
  }

  _read() {
    if (!this.currentFile) {
      this.currentFile = this.getNext();

      if (!this.currentFile) {
        // we're done!
        this.push(Buffer.alloc(1024));
        this.push(null);
        return;
      }

      if (isTarFileSource(this.currentFile)) {
        const { src, ...header } = this.currentFile;
        this.push(packFile(src(), header));
        this.currentFile = undefined;
        return;
      }

      throw new Error("Unhandled");
    }
  }
}

const tar = (files: Iterable<TarSource>): Tar => {
  return new Tar(files);
};

export default tar;
