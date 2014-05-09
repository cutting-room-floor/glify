[![Build Status](https://travis-ci.org/mapbox/glify.svg)](https://travis-ci.org/mapbox/glify)

# glify

A [browserify](http://browserify.org/) transform that grabs fragment and
vertex shaders, compiles and links them with [glsl-unit](https://code.google.com/p/glsl-unit/),
optimizes with [glsl-optimizer](https://github.com/kkaefer/glsl-optimizer), and dumps JSON for browsers.

## install

    npm install --save-dev glify

## use

    browserify -t glify foo.js > bar.js

## example

```js
var glify = require('glify');

var shader = glify('./fill.*.glsl');

var lineShader = glify('./line.*.glsl', '#define FOO bar');
```

becomes

```js
var shader = {"vertex":"precision mediump float;attribute vec2 a_pos;uniform mat4 u_posmatrix;void main(){gl_Position=u_posmatrix*vec4(a_pos,0,1);gl_PointSize=2.;}","fragment":"precision mediump float;uniform vec4 u_color;void main(){gl_FragColor=u_color;}"};
```
