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

const commentX: RegExp = /\/\*[\s\S]*?\*\//g;

// token 创建
const tokenizer = (cssString: string) => {
    let current: number = 0;
    const tokens: any[] = [];
    const len: number = cssString.length;

    while (current < len) {
        const char = cssString[current];
        console.log(char)
        current ++;
    }

    return tokens;
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

    return node;
};
