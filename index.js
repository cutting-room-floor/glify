var glslunit = require('./lib/glsl-compiler'),
    through = require('through'),
    fs = require('fs'),
    path = require('path'),
    falafel = require('falafel');

module.exports = function (file) {

    var data = '',
        dirname = path.dirname(file);

    return through(
        function write (buf) { data += buf; },
        function end() {
            var output = falafel(data, function (node) {
                if (isRequireFor(node, 'glify')) {
                    node.update('undefined');
                }
                if (isCallFor(node, 'glify')) {
                    var filePath = path.join(dirname, getArgOfType(node, 0, 'Literal')),
                        fragment = fs.readFileSync(filePath.replace('.*.', '.fragment.'), 'utf8'),
                        vertex = fs.readFileSync(filePath.replace('.*.', '.vertex.'), 'utf8');

                    var compiler = new glslunit.compiler.DemoCompiler(vertex, fragment),
                        result = compiler.compileProgram(),
                        compiled = {
                            vertex: glslunit.Generator.getSourceCode(result.vertexAst),
                            fragment: glslunit.Generator.getSourceCode(result.fragmentAst)
                        };
                    node.update(JSON.stringify(compiled));
                }
            });
            this.queue(String(output));
            this.queue(null);
        }
    );
};

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
