'use strict';

document.getElementById('espresso_run')
    .addEventListener('click', async () => {
      const input = document.getElementById('input').value;
      const argsString = document.getElementById('args').value;

      // regex src: https://stackoverflow.com/a/43766456
      const userArgs = [...argsString.matchAll(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g)].map(m => m[0]);

      const espressoResult = await executeEspresso(input, userArgs);

      let exit_code = espressoResult.exitCode;
      let stdout = espressoResult.stdout;

      const output = document.getElementById('output');
      output.value = stdout;
    }, {passive: true});

let workerRunning = false;
let worker;

/**
 * @param {string} input
 * @param {string[]} args
 * @return {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
async function executeEspresso(input, args) {
  if (workerRunning) {
    throw new Error('Worker is already busy');
  }
  workerRunning = true;

  if (!window.Worker) {
    const {executeEspresso} = require('./worker');
    const espressoResult = await executeEspresso(input, args);
    workerRunning = false;
    return espressoResult;
  }

  if (!worker) {
    worker = new Worker('./bundle-worker.js', {name: 'espresso-runner'});
  }

  return new Promise((resolve, reject) => {
    worker.postMessage({input, args});

    worker.addEventListener('message', (event) => {
      workerRunning = false;

      resolve(event.data);
    }, {once: true, passive: true});
    worker.addEventListener('error', (event) => {
      workerRunning = false;
      reject(event);
    }, {once: true, passive: true});
  });
}
