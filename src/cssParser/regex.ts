export const selX = /([^\s\;\{\}][^\;\{\}]*)\{/g;
export const endX = /\}/g;
export const lineX = /([^\;\{\}]*)\;/g;
export const commentX = /\/\*[\s\S]*?\*\//g;
export const lineAttrX = /([^\:]+):([^\;]*);/;

// This is used, a concatenation of all above. We use alternation to
// capture.
export const altX = /(\/\*[\s\S]*?\*\/)|([^\s\;\{\}][^\;\{\}]*(?=\{))|(\})|([^\;\{\}]+\;(?!\s*\*\/))/gim;

const capComment = 1;
const capSelector = 2;
const capEnd = 3;
const capAttr = 4;

const defaultArgs = {
  ordered: false,
  comments: false,
  stripComments: false,
  split: false,
};

export interface CssAttributes {
  [attribute: string]: string
}

export interface Children {
  [attribute: string]: {
    children: Children,
    attributes: CssAttributes
  }
}

export interface JSONNode {
  children: Children,
  attributes: CssAttributes
}

const isEmpty = function (x: Record<any, any>): boolean {
    return typeof x == 'undefined' || x.length == 0 || x == null;
};  

export const cssParser = (
  cssString: string,
  args = defaultArgs
): JSONNode => {
  const node: any = {
    children: {},
    attributes: {},
  };
  let match: any = null;
  let count = 0;

  if (args.stripComments) {
    args.comments = false;
    cssString = cssString.replace(commentX, '');
  }

  while ((match = altX.exec(cssString)) != null) {
    if (!isEmpty(match[capComment]) && args.comments) {
      // Comment
      node[count++] = match[capComment].trim();
    } else if (!isEmpty(match[capSelector])) {
      // New node, we recurse
      const name = match[capSelector].trim();
      // This will return when we encounter a closing brace
      const newNode = cssParser(cssString, args);
      if (args.ordered) {
        // Since we must use key as index to keep order and not
        // name, this will differentiate between a Rule Node and an
        // Attribute, since both contain a name and value pair.
        node[count++] = { name, value: newNode, type: 'rule' };
      } else {
        const bits = args.split ? name.split(',') : [name];
        for (const i in bits) {
          const sel = bits[i].trim();
          if (sel in node.children) {
            for (const att in newNode.attributes) {
              node.children[sel].attributes[att] = newNode.attributes[att];
            }
          } else {
            node.children[sel] = newNode;
          }
        }
      }
    } else if (!isEmpty(match[capEnd])) {
      // Node has finished
      return node;
    } else if (!isEmpty(match[capAttr])) {
      const line = match[capAttr].trim();
      const attr = lineAttrX.exec(line);
      if (attr) {
        // Attribute
        const name = attr[1].trim();
        const value = attr[2].trim();
        if (args.ordered) {
          node[count++] = { name, value, type: 'attr' };
        } else {
          if (name in node.attributes) {
            const currVal = node.attributes[name];
            if (!(currVal instanceof Array)) {
              node.attributes[name] = [currVal];
            }
            node.attributes[name].push(value);
          } else {
            node.attributes[name] = value;
          }
        }
      } else {
        // Semicolon terminated line
        node[count++] = line;
      }
    }
  }

  return node;
};
