
import {join} from 'node:path';
import * as fs from 'node:fs';
import * as t from '@babel/types';
import * as babel from '@babel/core';


function electronConfig(config: string): t.ObjectProperty[] {
    let out: t.ObjectProperty[] = [];
    for (let data of config.split(' ')) {
        if (data.startsWith('[')) {
            out.push(...NOBLE_GASES[data.slice(1, -1)].map(node => t.cloneNode(node)));
        } else {
            let orbitalNum = parseInt(data);
            let index = orbitalNum.toString().length;
            let orbital = orbitalNum + data[index];
            let count = parseInt(data.slice(index + 1));
            out.push(t.objectProperty(t.stringLiteral(orbital), t.numericLiteral(count)));
        }
    }
    return out;
}

const NOBLE_GASES: {[key: string]: t.ObjectProperty[]} = {};
NOBLE_GASES['He'] = electronConfig('1s2');
NOBLE_GASES['Ne'] = electronConfig('[He] 2s2 2p6');
NOBLE_GASES['Ar'] = electronConfig('[Ne] 3s2 3p6');
NOBLE_GASES['Kr'] = electronConfig('[Ar] 3d10 4s2 4p6');
NOBLE_GASES['Xe'] = electronConfig('[Kr] 4d10 5s2 5p6');
NOBLE_GASES['Rn'] = electronConfig('[Xe] 4f14 5d10 6s2 6p6');


function assertNotSpreadElement(node: t.Node | null | undefined): asserts node is Exclude<t.Node, t.SpreadElement> {
    if (t.isSpreadElement(node)) {
        throw new Error('Cannot pass spread element anywhere inside element() function');
    }
}

let path = join(import.meta.dirname, 'index.js');
let code = fs.readFileSync(path).toString();
let result = babel.transformSync(code, {plugins: [
    function(): babel.PluginObj {
        return {
            visitor: {
                CallExpression(path) {
                    let callee = path.node.callee;
                    if (t.isIdentifier(callee) && callee.name === 'element') {
                        let args = path.node.arguments;
                        t.assertStringLiteral(args[3]);
                        t.assertObjectExpression(args[4]);
                        let newArgs = [args[0], args[1], args[2], t.objectExpression(electronConfig(args[3].value)), t.objectExpression(args[4].properties.map(prop => {
                            t.assertObjectProperty(prop);
                            t.assertArrayExpression(prop.value);
                            let args = prop.value.elements.slice();
                            let out: t.ObjectProperty[] = [];
                            if (t.isStringLiteral(args[0])) {
                                out.push(t.objectProperty(t.identifier('name'), args[0]));
                                args.shift();
                            }
                            assertNotSpreadElement(args[0]);
                            out.push(t.objectProperty(t.identifier('mass'), args[0]));
                            assertNotSpreadElement(args[1]);
                            if (args[1]) {
                                if (t.isStringLiteral(args[2])) {
                                    out.push(t.objectProperty(t.identifier('decay'), t.arrayExpression([args[1], args[2]])));
                                    if (args[3]) {
                                        assertNotSpreadElement(args[3]);
                                        out.push(t.objectProperty(t.identifier('abundance'), args[3]));
                                    }
                                } else {
                                    out.push(t.objectProperty(t.identifier('abundance'), args[1]));
                                }
                            }
                            return t.objectProperty(prop.key, t.objectExpression(out));
                        }))];
                        path.replaceWith(t.callExpression(
                            t.memberExpression(t.identifier('Object'), t.identifier('freeze')),
                            [t.newExpression(t.identifier('Element'), newArgs)],
                        ));
                    }
                }
            }
        }
    },
]});
if (!result || !result.code) {
    throw new Error('Code not present in Babel result');
}
fs.writeFileSync(path, result.code);
