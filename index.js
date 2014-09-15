'use strict';

var glslunit = require('./lib/glsl-compiler'),
    through = require('through'),
    glsl = require('mapbox-glsl-optimizer'),
    fs = require('fs'),
    path = require('path'),
    falafel = require('falafel'),
    path = require('path'),
    callerPath = require('caller-path');

module.exports = function(a, b) {
    var base = callerPath();
    if (base.match(new RegExp('node_modules\\' + path.sep + 'browserify'))) {
        return browserify(a);
    } else {
        return node(a, b, base);
    }
};

function browserify(file) {
    var data = '',
        dirname = path.dirname(file);

    var stream = through(
        function write (buf) { data += buf; },
        function end() {
            try {
                var output = falafel(data, function (node) {
                    if (isRequireFor(node, 'glify')) {
                        node.update('undefined');
                    }
                    if (isCallFor(node, 'glify')) {
                        var filePath = path.join(dirname, getArgOfType(node, 0, 'Literal')),
                            fragmentPath = filePath.replace('.*.', '.fragment.'),
                            fragment = fs.readFileSync(fragmentPath, 'utf8'),
                            vertexPath = filePath.replace('.*.', '.vertex.'),
                            vertex = fs.readFileSync(vertexPath, 'utf8'),
                            prepend = getArgOfType(node, 1, 'Literal') || '';

                        prepend = 'precision mediump float;\n' + prepend;

                        try {
                            var compiled = optimize(compile(prepend + vertex, prepend + fragment), glsl.TARGET_OPENGLES20);
                            node.update(JSON.stringify(compiled));
                        } catch(e) {
                            stream.emit('error', 'Error compiling ' + filePath + '\n' + e);
                        }

                        stream.emit('file', fragmentPath);
                        stream.emit('file', vertexPath);
                    }
                });
                this.queue(String(output));
                this.queue(null);

            } catch(e) {
                stream.emit('error', 'Error falafeling ' + file + '\n' + e);
            }
        }
    );

    return stream;
}

function node(filePath, prepend, base) {
    var fragmentPath = path.resolve(base, '..', filePath.replace('.*.', '.fragment.')),
        fragment = fs.readFileSync(fragmentPath, 'utf8'),
        vertexPath = path.resolve(base, '..', filePath.replace('.*.', '.vertex.')),
        vertex = fs.readFileSync(vertexPath, 'utf8');
    prepend = prepend || '';
    prepend = '#version 120\n' + prepend;
    return optimize(compile(prepend + vertex, prepend + fragment), glsl.TARGET_OPENGL);
}

function optimize(shader, target) {
    var compiler = new glsl.Compiler(target);

    var vertex_shader = new glsl.Shader(compiler,
        glsl.VERTEX_SHADER,
        shader.vertex);

    if (vertex_shader.compiled()) {
        shader.vertex = vertex_shader.output();
    } else {
        throw new Error('failed to optimize vertex shader');
    }
    vertex_shader.dispose();

    var fragment_shader = new glsl.Shader(compiler,
        glsl.FRAGMENT_SHADER,
        shader.fragment);
    if (fragment_shader.compiled()) {
        shader.fragment = fragment_shader.output();
    } else {
        throw new Error('failed to optimize fragment shader');
    }
    fragment_shader.dispose();

    return shader;
}

function compile(vertex, fragment) {
    var compiler = new glslunit.compiler.DemoCompiler(vertex, fragment),
        result = compiler.compileProgram();
    return {
        vertex: glslunit.Generator.getSourceCode(result.vertexAst),
        fragment: glslunit.Generator.getSourceCode(result.fragmentAst)
    };
}

function isCallFor(node, name) {
    var callee = node.callee;
    return node.type == 'CallExpression' && callee.type == 'Identifier' && callee.name == name;
}

function isRequireFor(node, moduleName) {
    return isCallFor(node, 'require') && getArgOfType(node, 0, 'Literal') == moduleName;
}

function getArgOfType(node, index, type) {
    var args = node.arguments;
    return args[index] && args[index].type == type && args[index].value;
}
