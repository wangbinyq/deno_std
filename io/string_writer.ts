// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Writer, WriterSync } from "./types.ts";

const decoder = new TextDecoder();

/**
 * Writer utility for buffering string chunks.
 *
 * @example
 * ```ts
 * import {
 *   copyN,
 *   StringReader,
 *   StringWriter,
 * } from "@std/io";
 * import { copy } from "@std/io/copy";
 *
 * const w = new StringWriter("base");
 * const r = new StringReader("0123456789");
 * await copyN(r, w, 4); // copy 4 bytes
 *
 * // Number of bytes read
 * console.log(w.toString()); //base0123
 *
 * await copy(r, w); // copy all
 * console.log(w.toString()); // base0123456789
 * ```
 *
 * **Output:**
 *
 * ```text
 * base0123
 * base0123456789
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export class StringWriter implements Writer, WriterSync {
  #chunks: Uint8Array[] = [];
  #byteLength = 0;
  #cache: string | undefined;
  #base: string;

  constructor(base = "") {
    const c = new TextEncoder().encode(base);
    this.#chunks.push(c);
    this.#byteLength += c.byteLength;
    this.#base = base;
  }

  write(p: Uint8Array): Promise<number> {
    return Promise.resolve(this.writeSync(p));
  }

  writeSync(p: Uint8Array): number {
    this.#chunks.push(new Uint8Array(p));
    this.#byteLength += p.byteLength;
    this.#cache = undefined;
    return p.byteLength;
  }

  toString(): string {
    if (this.#cache) {
      return this.#cache;
    }
    const buf = new Uint8Array(this.#byteLength);
    let offs = 0;
    for (const chunk of this.#chunks) {
      buf.set(chunk, offs);
      offs += chunk.byteLength;
    }
    this.#cache = decoder.decode(buf);
    return this.#cache;
  }
}
