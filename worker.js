'use strict';

const {init, WASI} = require('@wasmer/wasi');

const module_cache = {};
let wsmInitialized = false;

addEventListener('message', (event) => {
  executeEspresso(event.data.input, event.data.args)
      .then(postMessage);
});

/**
 * @param {string} input
 * @param {string[]} args
 * @return {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
async function executeEspresso(input, args) {
  if(!wsmInitialized) {
    await init();
    wsmInitialized = true;
  }

  const wasi = new WASI({env: {}, args: ['espresso', ...args, '/input.esp']});

  const file = wasi.fs.open('/input.esp', {read: true, write: true, create: true});
  file.writeString(input);
  file.flush();

  await instantiateModule(wasi, 'espresso.wasm');

  console.debug('Running Espresso...');
  const exitCode = wasi.start();
  console.debug('Espresso finished with exit code', exitCode);
  return {
    exitCode,
    stdout: wasi.getStdoutString(),
    stderr: wasi.getStderrString()
  };
}

/**
 * @param {string} moduleName
 * @return {Promise<WebAssembly.Module>}
 */
async function getModule(moduleName) {
  if (module_cache[moduleName]) {
    return module_cache[moduleName];
  }

  const wasm = await WebAssembly.compileStreaming(fetch(moduleName));
  module_cache[moduleName] = wasm;
  return wasm;
}

/**
 * @param {WASI} wasi
 * @param {string} moduleName
 * @return {Promise<void>}
 */
async function instantiateModule(wasi, moduleName) {
  const module = await getModule(moduleName);
  const instance = await WebAssembly.instantiate(module, wasi.getImports(module));

  await wasi.instantiate(instance, {});
}

exports.executeEspresso = executeEspresso;
