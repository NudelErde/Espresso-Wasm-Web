'use strict';

const {init, WASI} = require('@wasmer/wasi');

async function load_module(wasi, modulename) {
    // TODO chache module
    const module = await WebAssembly.compileStreaming(fetch(modulename));
    const instance = await WebAssembly.instantiate(module, wasi.getImports(module));

    await wasi.instantiate(instance, {});

    return wasi;
}

async function main() {

    await init();
    
    document.getElementById("espresso_run").addEventListener("click", async () => {
        let wasi = new WASI({env: {}, args: ["espresso", "/test.esp"]});
        let file = wasi.fs.open("/test.esp", {read: true, write: true, create: true});
        const input = document.getElementById("input").value;
        
        file.writeString(input);
        file.flush();
        
        await load_module(wasi, "/espresso.wasm");

        let exit_code = wasi.start();
        let stdout = wasi.getStdoutString();

        const output = document.getElementById("output");
        output.value = stdout;
    }, {
        passive: true
    });

}

main();