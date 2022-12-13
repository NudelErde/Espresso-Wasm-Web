'use strict';

document.getElementById('espresso_run')
    .addEventListener('click', async () => {
      const input = document.getElementById('input').value;
      const argsString = document.getElementById('args').value;

      // regex src: https://stackoverflow.com/a/43766456
      const userArgs = [...argsString.matchAll(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g)].map(m => m[0]);

      const output = document.getElementById('output');
      try {
        const espressoResult = await executeEspresso(input, userArgs);
        output.value = espressoResult.stdout;
      } catch (err) {
        output.value = 'Error ' + err;
        throw err;
      }
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
  setLoadingUi(workerRunning);
  await sleep(0);

  const shouldUseWebWorker = document.getElementById('use_web_worker').checked;
  if (!shouldUseWebWorker || !window.Worker) {
    const {executeEspresso} = require('./worker');
    const espressoResult = await executeEspresso(input, args);

    workerRunning = false;
    setLoadingUi(workerRunning);

    return espressoResult;
  }

  if (!worker) {
    worker = new Worker('./bundle-worker.js', {name: 'espresso-runner'});
  }

  return new Promise((resolve, reject) => {
    worker.postMessage({input, args});

    let messageListener;
    const errorListener = (event) => {
      workerRunning = false;
      setLoadingUi(workerRunning);

      worker.removeEventListener('message', messageListener, {once: true, passive: true});
      reject(event);
    };
    messageListener = (event) => {
      workerRunning = false;
      setLoadingUi(workerRunning);

      worker.removeEventListener('error', errorListener, {once: true, passive: true});
      resolve(event.data);
    };


    worker.addEventListener('message', messageListener, {once: true, passive: true});
    worker.addEventListener('error', errorListener, {once: true, passive: true});
  });
}

function setLoadingUi(loading) {
  if (loading) {
    document.getElementById('espresso_run').setAttribute('disabled', '');
    document.getElementById('output').setAttribute('disabled', '');
    document.getElementById('output').value = 'Loading...';
  } else {
    document.getElementById('espresso_run').removeAttribute('disabled');
    document.getElementById('output').removeAttribute('disabled');
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
