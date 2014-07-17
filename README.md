[![Build Status](https://travis-ci.org/mapbox/glify.svg)](https://travis-ci.org/mapbox/glify)

# glify

Compiles and links GLSL shaders with [glsl-unit](https://code.google.com/p/glsl-unit/) and
optimizes with [glsl-optimizer](https://github.com/mapbox/glsl-optimizer).

It can be used either as a browserify transform or as a regular node module.

## Install

    npm install --save-dev glify

## Example

```js
var glify = require('glify');
var shader = glify('./fill.*.glsl');
```

In node, `shader` will be an object with `vertex` and `fragment` properties containing
optimized GLSL source from `fill.vertex.glsl` and `fill.fragment.glsl` files.

With browserify, you can run `browserify -t glify foo.js > bar.js` and `bar.js` will
contain:

```js
var shader = {"vertex":"precision mediump float;attribute vec2 a_pos;uniform mat4 u_posmatrix;void main(){gl_Position=u_posmatrix*vec4(a_pos,0,1);gl_PointSize=2.;}","fragment":"precision mediump float;uniform vec4 u_color;void main(){gl_FragColor=u_color;}"};
```

## Prepend

You can prepend `#define`s to the source:

```
var lineShader = glify('./line.*.glsl', '#define FOO bar');
```
