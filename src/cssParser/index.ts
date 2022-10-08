interface CssAttributes {
  [attribute: string]: string
}

interface Children {
  [attribute: string]: {
    children: Children,
    attributes: CssAttributes
  }
}

interface JSONNode {
  children: Children,
  attributes: CssAttributes
}

type tokenObj = {
  type: string,
  value: string
}

type tokenType = Array<tokenObj>

const commentX: RegExp = /\/\*[\s\S]*?\*\//g;
const WHITESPACE = /\s/;
const LETTERS = /[a-z0-9]/i;

// token 创建
const tokenizer = (cssString: string) => {
  let current: number = 0;
  const tokens: tokenType = [];
  const len: number = cssString.length;

  while (current < len) {
    let char = cssString[current];

    if (char === '#') {
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
        type: 'CONECT',
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
        value: value
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

    if (token.type === 'CONECT') {
      return {
        key: tokens[current - 1].value,
        value: tokens[++current].value
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

/**
 * css -> json 转换
 * 可以直接进行 parse 转换；也可以把目标当成一种结果语言（非中间表示数据结构），实现一个mini编译器
 * @param cssString 
 * @returns 
 */
export const cssParser = (
  cssString: string
): JSONNode => {
  const node: JSONNode = {
    children: {},
    attributes: {},
  };
  // 去掉注释和空格
  cssString = cssString.replace(commentX, '').trim();
  console.log(tokenizer(cssString))
  const ast = parser(tokenizer(cssString));
  console.log(ast)

  return node;
};
