# AlgorithmX

[![travis](https://travis-ci.com/algrx/algorithmx.svg)](https://travis-ci.com/algrx/algorithmx)
[![npm](https://img.shields.io/npm/v/algorithmx.svg)](https://www.npmjs.com/package/algorithmx)
[![codecov](https://codecov.io/gh/algrx/algorithmx/branch/master/graph/badge.svg)](https://codecov.io/gh/algrx/algorithmx)

<img src="https://raw.githubusercontent.com/algrx/algorithmx/master/img/logo.svg?sanitize=true" align="left" hspace="10" width="80px">

**AlgorithmX** is an event-driven network visualization library, built on top of <a href="https://github.com/d3/d3">D3</a> and <a href="https://github.com/tgdwyer/WebCola">WebCola</a>. It can be used to create highly customizable interactive networks, as well as animated algorithm simulations.
<br><br>

<img src="https://raw.githubusercontent.com/algrx/algorithmx/master/img/example.svg?sanitize=true" align="center" width="600px">

## Resources

-   <a href="https://algrx.github.io/">Website</a>
-   <a href='https://algrx.github.io/algorithmx/docs/js'>Documentation</a>
-   <a href="https://github.com/algrx/algorithmx-python">Python version</a>

## Installing

**Browser:**

```html
<script src="https://d3js.org/d3.v5.min.js"></script>
<script src="https://ialab.it.monash.edu/webcola/cola.min.js"></script>
<script src="https://unpkg.com/algorithmx"></script>
```

This will expose a global `algorithmx` variable.

**Module:**

Run `npm install algorithmx`. AlgorithmX is written in <a href="https://www.typescriptlang.org/">TypeScript</a>, and comes with complete type definitions. To use in a TypeScript or ES6 JavaScript project:

```javascript
import * as algorithmx from 'algorithmx';
```

## Example Usage

```js
// select a div with id 'output' for rendering the network
const canvas = algorithmx.canvas('output');

// add three blue nodes
canvas.nodes(['A', 'B', 'C']).add().color('blue');

// add an edge
canvas.edge(['A', 'C']).add();

// pause for half a second
canvas.pause(0.5);

// temporarily make node 'B' 1.5 times as large
canvas.node('B').highlight().size('1.5x');
```
