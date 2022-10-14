interface CssAttributes {
  [attribute: string]: string
}

interface Children {
  [attribute: string]: {
    children: Children,
    attributes: CssAttributes
  }
}

type tokenObj = {
  type: string,
  value: string | number
}

type tokenType = Array<tokenObj>

const commentX: RegExp = /\/\*[\s\S]*?\*\//g;
const WHITESPACE = /\s/;
const LETTERS = /[a-z0-9-#]/i;

// token 创建
const tokenizer = (cssString: string) => {
  let current: number = 0;
  const tokens: tokenType = [];
  const len: number = cssString.length;

  while (current < len) {
    let char = cssString[current];

    if (char === '#' && (cssString[current - 2] !== ':')) {
      tokens.push({
        type: 'ID',
        value: '#'
      });
      current++;
      continue;
    }

    if (char === '.') {
      tokens.push({
        type: 'CLASS',
        value: '.'
      });
      current++;
      continue;
    }

    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    if (char === '{') {
      tokens.push({
        type: 'START',
        value: '{'
      });
      current++;
      continue;
    }

    if (char === '}') {
      tokens.push({
        type: 'END',
        value: '}'
      });
      current++;
      continue;
    }

    if (char === ':') {
      tokens.push({
        type: 'MARKS',
        value: ':'
      });
      current++;
      continue;
    }

    if (char === ';') {
      tokens.push({
        type: 'SPLIT',
        value: ';'
      });
      current++;
      continue;
    }

    if (LETTERS.test(char)) {
      let value = '';
      while (LETTERS.test(char)) {
        value += char;
        char = cssString[++current];
      }

      // 区分类名、样式key、样式value

      tokens.push({
        type: 'KEY',
        value: Number(value) || value
      });
      continue;
    }

    throw new TypeError('类型不全，请补充其他token类型: ' + char);
  }

  return tokens;
}

// 接受 token 数组，然后把它转化为 AST
const parser = (tokens: tokenType) => {

  let current = 0;

  const walk = () => {
    let token = tokens[current];
    if (token.type === 'ID') {
      return {
        type: 'IdSelector',
        name: tokens[++current].value
      };
    }

    if (token.type === 'CLASS') {
      return {
        type: 'ClassSelector',
        name: tokens[++current].value
      };
    }

    if (token.type === 'MARKS') {
      return {
        type: 'StyleText',
        name: tokens[current - 1].value,
        value: tokens[++current].value // todo 支持 多个值 1px solid #ddd
      };
    }
  }

  const ast = {
    type: 'Program',
    body: [] as any
  };

  while (current < tokens.length) {
    if (tokens[current].type === 'CLASS' || tokens[current].type === 'ID') {
      ast.body.push(walk());
    }

    if (tokens[current].type === 'START') {
      while(tokens[++current].type !== 'END') {
        const child = walk();
        if(child) {
          const last = ast.body.pop();
          if(!last.children) {
            last.children = [];
          }
          last.children.push(child);
          ast.body.push(last);
        }
      }
    }
    current++;
  }

  return ast;
}

// 访问器
const traverser = (ast: any, visitor: any) => {

  function traverseArray(array: any[], parent: any) {
    array.forEach((child: any) => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node: { type: string; body: any; children: any; }, parent: any) {
    
    // 钩子执行
    visitor[node.type]?.(node, parent);

    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;

      case 'IdSelector':
      case 'ClassSelector':
        traverseArray(node.children, node);
        break;

      case 'StyleText':
        break;

      default:
        throw new TypeError(node.type);
    }
  }
  traverseNode(ast, null);
}

// transform 简约 ast 转为 简化版的csssheet
const transformer = (ast: any) => {

  const newAst = {
    type: 'StyleSheet',
    children: []
  };

  ast._context = newAst.children;

  const creatRule = (node: any, parent: any) => {
    const ruleData = {
      type: 'rule',
      // 暂时只需要一个标记匹配样式，没有完善实现此字段
      prelude: {
        type: node.type,
        name: node.name
      },
      block: {
        type: 'block',
        children: []
      }
    };
    parent._context.push(ruleData);

    // 建立父子关系
    node._context = ruleData;
  }

  traverser(ast, {

    IdSelector: creatRule,

    ClassSelector: creatRule,

    StyleText: (node: any, parent: any) => {
      
      const expression = {
        type: 'Declaration',
        property: node.name,
        value: node.value,
      };
      parent._context.block.children.push(expression);
    }
  });

  // 最后返回创建好的新 AST。
  return newAst;
};

// 生成目标代码
const codeGenerator: (node: any) => string = (node) => {

  switch (node.type) {
    case 'StyleSheet':
      return `{${node.children.map(codeGenerator).join(',')}}`;

    case 'rule':
      return (
        `"${codeGenerator(node.prelude)}": {${codeGenerator(node.block)}}`
      );

    case 'block':
        return node.children.map(codeGenerator).join(',');

    case 'Declaration':
        return typeof node.value === 'number' ? `"${node.property}":${node.value}` : `"${node.property}":"${node.value}"`;
      
    case 'IdSelector':
    case 'ClassSelector':
      return node.name;
   
    default:
      throw new TypeError(node.type);
  }
}

/**
 * css -> json 转换
 * 可以直接进行 parse 转换；也可以把目标当成一种结果语言（非中间表示数据结构），实现一个mini编译器
 * @param cssString 
 * @returns 
 */
export const cssParser = (
  cssString: string
) => {
  // 去掉注释和空格
  cssString = cssString.replace(commentX, '').trim();
  const ast = parser(tokenizer(cssString));
  const newAst = transformer(ast);
  const targetCode = JSON.parse(codeGenerator(newAst));
  return targetCode;
};
