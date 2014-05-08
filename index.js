'use strict';

var glslunit = require('./lib/glsl-compiler'),
    through = require('through'),
    glsl = require('glsl-optimizer'),
    fs = require('fs'),
    path = require('path'),
    falafel = require('falafel');

var target = glsl.TARGET_OPENGLES20,
    compiler = new glsl.Compiler(target);

module.exports = function (file) {

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
                            vertex = fs.readFileSync(vertexPath, 'utf8');

                        try {
                            var compiled = optimize(compile(vertex, fragment));
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
};

function optimize(shader) {
    var preamble = 'precision highp float;';
    var vertex_shader = new glsl.Shader(compiler,
        glsl.VERTEX_SHADER,
        preamble + '\n' + shader.vertex);

    if (vertex_shader.compiled()) {
        shader.vertex = vertex_shader.output();
    } else {
        throw new Error('failed to optimize vertex shader');
    }
    vertex_shader.dispose();

    var fragment_shader = new glsl.Shader(compiler,
        glsl.FRAGMENT_SHADER,
        preamble + '\n' + shader.fragment);
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
    return args[index].type == type && args[index].value;
}
