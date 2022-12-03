'use strict';

const {init, WASI} = require('@wasmer/wasi');

const module_cache = {};

async function get_module(modulename) {
    if (module_cache[modulename]) {
        return module_cache[modulename];
    }
    const wasm = await WebAssembly.compileStreaming(fetch(modulename));
    module_cache[modulename] = wasm;
    return wasm;
}

async function get_instance(wasi, modulename) {
    const module = await get_module(modulename);
    const instance = await WebAssembly.instantiate(module, wasi.getImports(module));

    await wasi.instantiate(instance, {});

    return wasi;
}

async function main() {

    await init();

    document.getElementById("espresso_run").addEventListener("click", async () => {
        const input = document.getElementById("input").value;
        const argsString = document.getElementById("args").value;

        // regex src: https://stackoverflow.com/a/43766456
        const userArgs = [...argsString.matchAll(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g)].map(m => m[0]);

        let wasi = new WASI({env: {}, args: ["espresso", ...userArgs, "/input.esp"]});

        let file = wasi.fs.open("/input.esp", {read: true, write: true, create: true});
        file.writeString(input);
        file.flush();

        await get_instance(wasi, "espresso.wasm");

        let exit_code = wasi.start();
        let stdout = wasi.getStdoutString();

        const output = document.getElementById("output");
        output.value = stdout;
    }, {
        passive: true
    });

}

main()
    .catch((err) => {
        console.error(err);
        alert('Failed to load Espresso-WASM module');
    });
