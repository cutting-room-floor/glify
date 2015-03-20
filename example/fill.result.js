(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var glify = undefined;

var shader = {"vertex":"precision mediump float;attribute vec2 a_pos;uniform mat4 u_posmatrix;void main(){gl_Position=u_posmatrix*vec4(a_pos,0,1);gl_PointSize=2.;}","fragment":"precision mediump float;uniform vec4 u_color;void main(){gl_FragColor=u_color;}"};

},{}]},{},[1])