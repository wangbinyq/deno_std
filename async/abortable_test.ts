// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { abortable } from "./abortable.ts";

Deno.test("abortable() handles promise", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const result = await abortable(promise, c.signal);
  assertEquals(result, "Hello");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with aborted signal after delay", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  setTimeout(() => c.abort(), 50);
  const error = await assertRejects(
    () => abortable(promise, c.signal),
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with aborted signal after delay with reason", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  setTimeout(() => c.abort(new Error("This is my reason")), 50);
  await assertRejects(
    () => abortable(promise, c.signal),
    Error,
    "This is my reason",
  );
  clearTimeout(t);
});

Deno.test("abortable() handles promise with already aborted signal", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  c.abort();
  const error = await assertRejects(
    async () => {
      await abortable(promise, c.signal);
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with already aborted signal with reason", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  c.abort(new Error("This is my reason"));
  await assertRejects(
    () => abortable(promise, c.signal),
    Error,
    "This is my reason",
  );
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable()", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  const items = await Array.fromAsync(abortable(a(), c.signal));
  assertEquals(items, ["Hello", "World"]);
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable() handles aborted signal after delay", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  setTimeout(() => c.abort(), 50);
  const items: string[] = [];
  const error = await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  assertEquals(items, ["Hello"]);
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable() handles already aborted signal", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  c.abort();
  const items: string[] = [];
  const error = await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  assertEquals(items, []);
  clearTimeout(t);
});
