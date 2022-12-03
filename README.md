# Espresso-Wasm-Web
This project runs the
[Espresso heuristic logic minimizer](https://en.wikipedia.org/wiki/Espresso_heuristic_logic_minimizer)
in your browser without the need to compile the project yourself or download a precompiled binary.

---

The source code of `espresso.wasm` comes from
[classabbyamp/espresso-logic](https://github.com/classabbyamp/espresso-logic),
which is based on the original code from
[University of California, Berkeley](https://embedded.eecs.berkeley.edu/pubs/downloads/espresso/index.htm).


## How it works
This project uses [WebAssembly](https://webassembly.org/) to run the C code of `espresso` in your browser.

Using the [zig](https://ziglang.org/) compiler, the C code is compiled to `wasm32-wasi`.


## License
This is published under the [MIT License](https://opensource.org/licenses/MIT).
