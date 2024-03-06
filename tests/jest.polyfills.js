/* eslint-disable no-undef */
const { TextDecoder, TextEncoder, ReadableStream } = require('node:util');

Reflect.set(globalThis, 'TextDecoder', TextDecoder);
Reflect.set(globalThis, 'TextEncoder', TextEncoder);
Reflect.set(globalThis, 'ReadableStream', ReadableStream);
