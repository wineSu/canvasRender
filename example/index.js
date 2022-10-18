(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  const getAllMatches = function (string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
          const allmatches = [];
          const len = match.length;
          for (let index = 0; index < len; index++) {
              allmatches.push(match[index]);
          }
          matches.push(allmatches);
          match = regex.exec(string);
      }
      return matches;
  };
  const doesMatch = function (string, regex) {
      const match = regex.exec(string);
      return !(match === null || typeof match === 'undefined');
  };
  const isExist = function (v) {
      return typeof v !== 'undefined';
  };
  const isEmptyObject = function (obj) {
      return Object.keys(obj).length === 0;
  };
  const merge = function (target, a, arrayMode) {
      if (a) {
          const keys = Object.keys(a);
          const len = keys.length;
          for (let i = 0; i < len; i++) {
              if (arrayMode === 'strict') {
                  target[keys[i]] = [a[keys[i]]];
              }
              else {
                  target[keys[i]] = a[keys[i]];
              }
          }
      }
  };
  const getValue = function (v) {
      if (isExist(v)) {
          return v;
      }
      else {
          return '';
      }
  };
  const buildOptions = function (options, defaultOptions, props) {
      const newOptions = {};
      if (!options) {
          return defaultOptions;
      }
      for (let i = 0; i < props.length; i++) {
          if (options[props[i]] !== undefined) {
              newOptions[props[i]] = options[props[i]];
          }
          else {
              newOptions[props[i]] = defaultOptions[props[i]];
          }
      }
      return newOptions;
  };

  const convertToJson = function (node, options) {
      const jObj = {
          name: node.tagname
      };
      if ((!node.child || isEmptyObject(node.child)) &&
          (!node.attrsMap || isEmptyObject(node.attrsMap))) {
          return isExist(node.val) && !!node.val ? node.val : jObj;
      }
      else {
          if (isExist(node.val)) {
              if (!(typeof node.val === 'string' &&
                  (node.val === '' || node.val === options.cdataPositionChar)) && options.textNodeName) {
                  if (options.arrayMode === 'strict') {
                      jObj[options.textNodeName] = [node.val];
                  }
                  else {
                      jObj[options.textNodeName] = node.val;
                  }
              }
          }
      }
      merge(jObj, node.attrsMap, options.arrayMode);
      jObj.children = [];
      node.children.forEach((child) => {
          jObj.children.push(convertToJson(child, options));
      });
      return jObj;
  };

  class xmlNode {
      constructor(tagname, parent, val) {
          this.addChild = (child) => {
              this.children.push(child);
              if (Array.isArray(this.child[child.tagname])) {
                  this.child[child.tagname].push(child);
              }
              else {
                  this.child[child.tagname] = [child];
              }
          };
          this.tagname = tagname;
          this.parent = parent;
          this.child = {};
          this.attrsMap = {};
          this.children = [];
          this.val = val;
          this.startIndex = 0;
      }
  }

  const TagType = { OPENING: 1, CLOSING: 2, SELF: 3, CDATA: 4 };
  let regx = '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|(([\\w:\\-._]*:)?([\\w:\\-._]+))([^>]*)>|((\\/)(([\\w:\\-._]*:)?([\\w:\\-._]+))\\s*>))([^<]*)';
  if (!Number.parseInt && window.parseInt) {
      Number.parseInt = window.parseInt;
  }
  if (!Number.parseFloat && window.parseFloat) {
      Number.parseFloat = window.parseFloat;
  }
  const defaultOptions$1 = {
      attributeNamePrefix: '@_',
      attrNodeName: false,
      textNodeName: '#text',
      ignoreAttributes: true,
      ignoreNameSpace: false,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: false,
      arrayMode: false,
      trimValues: true,
      cdataTagName: false,
      cdataPositionChar: '\\c',
      localeRange: '',
      tagValueProcessor: function (a) {
          return a;
      },
      attrValueProcessor: function (a) {
          return a;
      },
      stopNodes: []
  };
  const props$1 = [
      'attributeNamePrefix',
      'attrNodeName',
      'textNodeName',
      'ignoreAttributes',
      'ignoreNameSpace',
      'allowBooleanAttributes',
      'parseNodeValue',
      'parseAttributeValue',
      'arrayMode',
      'trimValues',
      'cdataTagName',
      'cdataPositionChar',
      'localeRange',
      'tagValueProcessor',
      'attrValueProcessor',
      'parseTrueNumberOnly',
      'stopNodes'
  ];
  const getTraversalObj = function (xmlData, options) {
      var _a, _b;
      xmlData = xmlData.replace(/<!--[\s\S]*?-->/g, '');
      const xmlObj = new xmlNode('canvas-xml');
      let currentNode = xmlObj;
      regx = regx.replace(/\[\\w/g, '[' + options.localeRange + '\\w');
      const tagsRegx = new RegExp(regx, 'g');
      let tag = tagsRegx.exec(xmlData);
      let nextTag = tagsRegx.exec(xmlData);
      while (tag) {
          const tagType = checkForTagType(tag);
          if (tagType === TagType.CLOSING) {
              if (currentNode.parent && tag[14]) {
                  currentNode.parent.val = getValue(currentNode.parent.val) + '' + processTagValue(tag, options, currentNode.parent.tagname);
              }
              if (((_a = options.stopNodes) === null || _a === void 0 ? void 0 : _a.length) && options.stopNodes.includes(currentNode.tagname)) {
                  currentNode.child = [];
                  if (currentNode.attrsMap == undefined) {
                      currentNode.attrsMap = {};
                  }
                  currentNode.val = xmlData.substr(currentNode.startIndex + 1, tag.index - currentNode.startIndex - 1);
              }
              currentNode = currentNode.parent;
          }
          else if (tagType === TagType.SELF) {
              if (currentNode && tag[14]) {
                  currentNode.val = getValue(currentNode.val) + '' + processTagValue(tag, options);
              }
              const childNode = new xmlNode(options.ignoreNameSpace ? tag[7] : tag[5], currentNode, '');
              if (tag[8] && tag[8].length > 0) {
                  tag[8] = tag[8].substr(0, tag[8].length - 1);
              }
              childNode.attrsMap = buildAttributesMap(tag[8], options);
              currentNode.addChild(childNode);
          }
          else {
              const childNode = new xmlNode(options.ignoreNameSpace ? tag[7] : tag[5], currentNode, processTagValue(tag, options));
              if (((_b = options.stopNodes) === null || _b === void 0 ? void 0 : _b.length) && options.stopNodes.includes(childNode.tagname)) {
                  childNode.startIndex = tag.index + tag[1].length;
              }
              childNode.attrsMap = buildAttributesMap(tag[8], options);
              currentNode.addChild(childNode);
              currentNode = childNode;
          }
          tag = nextTag;
          nextTag = tagsRegx.exec(xmlData);
      }
      return xmlObj;
  };
  function processTagValue(parsedTags, options, parentTagName) {
      const tagName = parsedTags[7] || parentTagName;
      let val = parsedTags[14];
      if (val) {
          if (options.trimValues) {
              val = val.trim();
          }
          val = options.tagValueProcessor(val, tagName);
          val = parseValue(val, options.parseNodeValue, options.parseTrueNumberOnly);
      }
      return val;
  }
  function checkForTagType(match) {
      if (match[10] === '/') {
          return TagType.CLOSING;
      }
      else if (typeof match[8] !== 'undefined' && match[8].substr(match[8].length - 1) === '/') {
          return TagType.SELF;
      }
      else {
          return TagType.OPENING;
      }
  }
  function resolveNameSpace(tagname, options) {
      if (options.ignoreNameSpace) {
          const tags = tagname.split(':');
          const prefix = tagname.charAt(0) === '/' ? '/' : '';
          if (tags[0] === 'xmlns') {
              return '';
          }
          if (tags.length === 2) {
              tagname = prefix + tags[1];
          }
      }
      return tagname;
  }
  function parseValue(val, shouldParse, parseTrueNumberOnly) {
      if (shouldParse && typeof val === 'string') {
          let parsed;
          if (val.trim() === '' || isNaN(val)) {
              parsed = val === 'true' ? true : val === 'false' ? false : val;
          }
          else {
              if (val.indexOf('0x') !== -1) {
                  parsed = Number.parseInt(val, 16);
              }
              else if (val.indexOf('.') !== -1) {
                  parsed = Number.parseFloat(val);
              }
              else {
                  parsed = Number.parseInt(val, 10);
              }
              if (parseTrueNumberOnly) {
                  parsed = String(parsed) === val ? parsed : val;
              }
          }
          return parsed;
      }
      else {
          if (isExist(val)) {
              return val;
          }
          else {
              return '';
          }
      }
  }
  const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?', 'g');
  function buildAttributesMap(attrStr, options) {
      if (!options.ignoreAttributes && typeof attrStr === 'string') {
          attrStr = attrStr.replace(/\r?\n/g, ' ');
          const matches = getAllMatches(attrStr, attrsRegx);
          const len = matches.length;
          const attrs = {};
          for (let i = 0; i < len; i++) {
              const attrName = resolveNameSpace(matches[i][1], options);
              if (attrName.length) {
                  if (matches[i][4] !== undefined) {
                      if (options.trimValues) {
                          matches[i][4] = matches[i][4].trim();
                      }
                      matches[i][4] = options.attrValueProcessor(matches[i][4], attrName);
                      attrs[options.attributeNamePrefix + attrName] = parseValue(matches[i][4], options.parseAttributeValue, options.parseTrueNumberOnly);
                  }
                  else if (options.allowBooleanAttributes) {
                      attrs[options.attributeNamePrefix + attrName] = true;
                  }
              }
          }
          if (!Object.keys(attrs).length) {
              return;
          }
          if (options.attrNodeName) {
              const attrCollection = {};
              attrCollection[options.attrNodeName] = attrs;
              return attrCollection;
          }
          return attrs;
      }
  }

  const defaultOptions = {
      allowBooleanAttributes: false,
      localeRange: 'a-zA-Z',
  };
  const props = ['allowBooleanAttributes', 'localeRange'];
  const validate = (xmlData, options) => {
      options = buildOptions(options, defaultOptions, props);
      const tags = [];
      let tagFound = false;
      if (xmlData[0] === '\ufeff') {
          xmlData = xmlData.substr(1);
      }
      const regxAttrName = new RegExp('^[_w][\\w\\-.:]*$'.replace('_w', '_' + options.localeRange));
      const regxTagName = new RegExp('^([w]|_)[\\w.\\-_:]*'.replace('([w', '([' + options.localeRange));
      for (let i = 0; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
              i++;
              if (xmlData[i] === '!') {
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
              }
              else {
                  let closingTag = false;
                  if (xmlData[i] === '/') {
                      closingTag = true;
                      i++;
                  }
                  let tagName = '';
                  for (; i < xmlData.length &&
                      xmlData[i] !== '>' &&
                      xmlData[i] !== ' ' &&
                      xmlData[i] !== '\t' &&
                      xmlData[i] !== '\n' &&
                      xmlData[i] !== '\r'; i++) {
                      tagName += xmlData[i];
                  }
                  tagName = tagName.trim();
                  if (tagName[tagName.length - 1] === '/') {
                      tagName = tagName.substring(0, tagName.length - 1);
                      continue;
                  }
                  if (!validateTagName(tagName, regxTagName)) {
                      return { err: { code: 'InvalidTag', msg: 'Tag ' + tagName + ' is an invalid name.' } };
                  }
                  const result = readAttributeStr(xmlData, i);
                  if (result === false) {
                      return { err: { code: 'InvalidAttr', msg: 'Attributes for "' + tagName + '" have open quote.' } };
                  }
                  let attrStr = result.value;
                  i = result.index;
                  if (attrStr[attrStr.length - 1] === '/') {
                      attrStr = attrStr.substring(0, attrStr.length - 1);
                      const isValid = validateAttributeString(attrStr, options, regxAttrName);
                      if (isValid === true) {
                          tagFound = true;
                      }
                      else {
                          return isValid;
                      }
                  }
                  else if (closingTag) {
                      if (!result.tagClosed) {
                          return {
                              err: { code: 'InvalidTag', msg: 'closing tag "' + tagName + "\" don't have proper closing." },
                          };
                      }
                      else if (attrStr.trim().length > 0) {
                          return {
                              err: { code: 'InvalidTag', msg: 'closing tag "' + tagName + "\" can't have attributes or invalid starting." },
                          };
                      }
                      else {
                          const otg = tags.pop();
                          if (tagName !== otg) {
                              return {
                                  err: { code: 'InvalidTag', msg: 'closing tag ' + otg + ' is expected inplace of ' + tagName + '.' },
                              };
                          }
                      }
                  }
                  else {
                      const isValid = validateAttributeString(attrStr, options, regxAttrName);
                      if (isValid !== true) {
                          return isValid;
                      }
                      tags.push(tagName);
                      tagFound = true;
                  }
                  for (i++; i < xmlData.length; i++) {
                      if (xmlData[i] === '<') {
                          if (xmlData[i + 1] === '!') {
                              i++;
                              i = readCommentAndCDATA(xmlData, i);
                              continue;
                          }
                          else {
                              break;
                          }
                      }
                  }
                  if (xmlData[i] === '<') {
                      i--;
                  }
              }
          }
          else {
              if (xmlData[i] === ' ' || xmlData[i] === '\t' || xmlData[i] === '\n' || xmlData[i] === '\r') {
                  continue;
              }
              return { err: { code: 'InvalidChar', msg: 'char ' + xmlData[i] + ' is not expected .' } };
          }
      }
      if (!tagFound) {
          return { err: { code: 'InvalidXml', msg: 'Start tag expected.' } };
      }
      else if (tags.length > 0) {
          return {
              err: { code: 'InvalidXml', msg: 'Invalid ' + JSON.stringify(tags, null, 4).replace(/\r?\n/g, '') + ' found.' },
          };
      }
      return true;
  };
  function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
          for (i += 3; i < xmlData.length; i++) {
              if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
                  i += 2;
                  break;
              }
          }
      }
      return i;
  }
  function readAttributeStr(xmlData, i) {
      let attrStr = '';
      let startChar = '';
      let tagClosed = false;
      const doubleQuote = '"';
      const singleQuote = "'";
      for (; i < xmlData.length; i++) {
          if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
              if (startChar === '') {
                  startChar = xmlData[i];
              }
              else if (startChar !== xmlData[i]) {
                  continue;
              }
              else {
                  startChar = '';
              }
          }
          else if (xmlData[i] === '>') {
              if (startChar === '') {
                  tagClosed = true;
                  break;
              }
          }
          attrStr += xmlData[i];
      }
      if (startChar !== '') {
          return false;
      }
      return { value: attrStr, index: i, tagClosed: tagClosed };
  }
  const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');
  function validateAttributeString(attrStr, options, regxAttrName) {
      const matches = getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
          if (matches[i][1].length === 0) {
              return { err: { code: 'InvalidAttr', msg: 'attribute ' + matches[i][2] + ' has no space in starting.' } };
          }
          else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
              return { err: { code: 'InvalidAttr', msg: 'boolean attribute ' + matches[i][2] + ' is not allowed.' } };
          }
          else if (matches[i][6] === undefined) {
              return { err: { code: "InvalidAttr", msg: "attribute " + matches[i][2] + " has no value assigned." } };
          }
          const attrName = matches[i][2];
          if (!validateAttrName(attrName, regxAttrName)) {
              return { err: { code: 'InvalidAttr', msg: 'attribute ' + attrName + ' is an invalid name.' } };
          }
          if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
              attrNames[attrName] = 1;
          }
          else {
              return { err: { code: 'InvalidAttr', msg: 'attribute ' + attrName + ' is repeated.' } };
          }
      }
      return true;
  }
  function validateAttrName(attrName, regxAttrName) {
      return doesMatch(attrName, regxAttrName);
  }
  function validateTagName(tagname, regxTagName) {
      return doesMatch(tagname, regxTagName);
  }

  const Parser = (xmlData, options, validationOption) => {
      if (validationOption) {
          if (validationOption === true)
              validationOption = {};
          const result = validate(xmlData, validationOption);
          if (result !== true) {
              throw Error(result.err.msg);
          }
      }
      const newOption = buildOptions(options, defaultOptions$1, props$1);
      return convertToJson(getTraversalObj(xmlData, newOption), newOption);
  };

  const commentX = /\/\*[\s\S]*?\*\//g;
  const WHITESPACE = /\s/;
  const LETTERS = /[a-z0-9-#]/i;
  const tokenizer = (cssString) => {
      let current = 0;
      const tokens = [];
      const len = cssString.length;
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
              tokens.push({
                  type: 'KEY',
                  value: Number(value) || value
              });
              continue;
          }
          throw new TypeError('类型不全，请补充其他token类型: ' + char);
      }
      return tokens;
  };
  const parser = (tokens) => {
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
                  value: tokens[++current].value
              };
          }
      };
      const ast = {
          type: 'Program',
          body: []
      };
      while (current < tokens.length) {
          if (tokens[current].type === 'CLASS' || tokens[current].type === 'ID') {
              ast.body.push(walk());
          }
          if (tokens[current].type === 'START') {
              while (tokens[++current].type !== 'END') {
                  const child = walk();
                  if (child) {
                      const last = ast.body.pop();
                      if (!last.children) {
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
  };
  const traverser = (ast, visitor) => {
      function traverseArray(array, parent) {
          array.forEach((child) => {
              traverseNode(child, parent);
          });
      }
      function traverseNode(node, parent) {
          var _a;
          (_a = visitor[node.type]) === null || _a === void 0 ? void 0 : _a.call(visitor, node, parent);
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
  };
  const transformer = (ast) => {
      const newAst = {
          type: 'StyleSheet',
          children: []
      };
      ast._context = newAst.children;
      const creatRule = (node, parent) => {
          const ruleData = {
              type: 'rule',
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
          node._context = ruleData;
      };
      traverser(ast, {
          IdSelector: creatRule,
          ClassSelector: creatRule,
          StyleText: (node, parent) => {
              const expression = {
                  type: 'Declaration',
                  property: node.name,
                  value: node.value,
              };
              parent._context.block.children.push(expression);
          }
      });
      return newAst;
  };
  const codeGenerator = (node) => {
      switch (node.type) {
          case 'StyleSheet':
              return `{${node.children.map(codeGenerator).join(',')}}`;
          case 'rule':
              return (`"${codeGenerator(node.prelude)}": {${codeGenerator(node.block)}}`);
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
  };
  const cssParser = (cssString) => {
      cssString = cssString.replace(commentX, '').trim();
      const ast = parser(tokenizer(cssString));
      const newAst = transformer(ast);
      const targetCode = JSON.parse(codeGenerator(newAst));
      return targetCode;
  };

  class BaseElement {
      constructor(props) {
          this.eventFrie = (e, eventName) => {
              var _a, _b, _c;
              (_b = (_a = this.props)[eventName]) === null || _b === void 0 ? void 0 : _b.call(_a, e);
              let p = this.props;
              while (p.parent) {
                  p = p.parent;
                  (_c = p[eventName]) === null || _c === void 0 ? void 0 : _c.call(p, this.props);
              }
          };
          this.props = props;
          const { layout, style, parent } = this.props;
          this.cache = Object.assign(Object.assign({}, layout), style);
          let { left, top } = layout;
          layout.left = Math.floor(left + parent.layout.left);
          layout.top = top + parent.layout.top;
          if (style.position === 'absolute') {
              layout.width = parent.layout.width;
          }
      }
  }

  class ViewElement extends BaseElement {
      constructor(props) {
          super(props);
          this.render = (ctx) => {
              const { layout, style } = this.props;
              let { left, right, top, bottom, width, height } = layout;
              ctx.clearRect(left, top, width, height);
              ctx.save();
              if (style.background) {
                  ctx.fillStyle = style.background;
                  if (style.borderRadius) {
                      this.drawRoundRect(ctx, style.borderRadius, left, top, width, height);
                  }
                  else {
                      ctx.fillRect(left, top, width, height);
                  }
              }
              ctx.restore();
          };
          this.drawRoundRect = (ctx, r, x, y, w, h) => {
              ctx.save();
              if (w < 2 * r)
                  r = w / 2;
              if (h < 2 * r)
                  r = h / 2;
              ctx.beginPath();
              ctx.moveTo(x + r, y);
              ctx.arcTo(x + w, y, x + w, y + h, r);
              ctx.arcTo(x + w, y + h, x, y + h, r);
              ctx.arcTo(x, y + h, x, y, r);
              ctx.arcTo(x, y, x + w, y, r);
              ctx.closePath();
              ctx.clip();
              ctx.fillRect(x, y, w, h);
              ctx.restore();
          };
      }
  }

  class TextElement extends BaseElement {
      constructor(props) {
          super(props);
          this.render = (ctx) => {
              const { layout, style } = this.props;
              let { left, right, top, bottom, width, height } = layout;
              ctx.clearRect(left, top, width, height);
              ctx.save();
              if (style.background) {
                  ctx.fillStyle = style.background;
                  ctx.fillRect(left, top, width, height);
              }
              ctx.font = `${style.fontSize || 40}px "微软雅黑"`;
              ctx.fillStyle = `${style.color || 'black'}`;
              ctx.textBaseline = 'top';
              const text = this.props['data-value'];
              this.drawText(ctx, text, layout);
              ctx.restore();
          };
          this.drawText = (ctx, text, layout) => {
              let textWidth = 0;
              let startIndex = 0;
              let line = 0;
              for (let i = 0, len = text.length; i < len; i++) {
                  textWidth += ctx.measureText(text[i]).width;
                  if (textWidth > layout.width) {
                      ctx.fillText(text.substring(startIndex, i), layout.left, layout.top + line * layout.height + (line > 0 ? 10 : 0));
                      startIndex = i;
                      textWidth = 0;
                      line++;
                  }
                  else {
                      if (i === len - 1) {
                          ctx.fillText(text.substring(startIndex, i + 1), layout.left, layout.top + line * layout.height + (line > 0 ? 10 : 0));
                      }
                  }
              }
          };
      }
  }

  class ImageElement extends BaseElement {
      constructor(props) {
          super(props);
          this.render = (ctx) => {
              const { layout, style } = this.props;
              let { left, right, top, bottom, width, height } = layout;
              ctx.clearRect(left, top, width, height);
              ctx.save();
              this.loadImg(this.props['data-src'], (img) => {
                  ctx.drawImage(img, left, top, width, height);
              });
              ctx.restore();
          };
          this.loadImg = (src, fn) => {
              const image = new Image();
              image.src = src;
              image.onload = () => {
                  fn(image);
              };
          };
      }
  }

  const angleToRad = (angle) => {
      return angle * (Math.PI / 180);
  };
  const radToAngle = (rad) => {
      return rad * (180 / Math.PI);
  };
  const EARTH_RAD = 6378137;
  const lngLatToMercator = (lng, lat) => {
      let x = angleToRad(lng) * EARTH_RAD;
      let rad = angleToRad(lat);
      let sin = Math.sin(rad);
      let y = (EARTH_RAD / 2) * Math.log((1 + sin) / (1 - sin));
      return [x, y];
  };
  const mercatorToLngLat = (x, y) => {
      let lng = radToAngle(x) / EARTH_RAD;
      let lat = radToAngle(2 * Math.atan(Math.exp(y / EARTH_RAD)) - Math.PI / 2);
      return [lng, lat];
  };
  const EARTH_PERIMETER = 2 * Math.PI * EARTH_RAD;
  const TILE_SIZE = 256;
  const getResolution = (n) => {
      const tileNums = Math.pow(2, n);
      const tileTotalPx = tileNums * TILE_SIZE;
      return EARTH_PERIMETER / tileTotalPx;
  };
  const resolutions = [];
  for (let i = 0; i <= 18; i++) {
      resolutions.push(getResolution(i));
  }
  const transformXY = (x, y, origin = 'topLeft') => {
      if (origin === 'topLeft') {
          x += EARTH_PERIMETER / 2;
          y = EARTH_PERIMETER / 2 - y;
      }
      return [x, y];
  };
  const getTileRowAndCol = (lng, lat, z, opt = {}) => {
      const [a, b] = (opt.lngLatToMercator || lngLatToMercator)(lng, lat);
      let [x, y] = transformXY(a, b, opt.origin);
      let resolution = (opt.resolutions || resolutions)[z];
      let row = Math.floor(x / resolution / TILE_SIZE);
      let col = Math.floor(y / resolution / TILE_SIZE);
      return [row, col];
  };
  const getPxFromLngLat = (lng, lat, z, opt = {}) => {
      const [a, b] = (opt.lngLatToMercator || lngLatToMercator)(lng, lat);
      let [_x, _y] = transformXY(a, b, opt.origin);
      let resolution = (opt.resolutions || resolutions)[z];
      let x = Math.floor(_x / resolution);
      let y = Math.floor(_y / resolution);
      return [x, y];
  };
  const getTileUrl = (x, y, z) => {
      let domainIndexList = [1, 2, 3, 4];
      let domainIndex = domainIndexList[Math.floor(Math.random() * domainIndexList.length)];
      return `https://webrd0${domainIndex}.is.autonavi.com/appmaptile?x=${x}&y=${y}&z=${z}&lang=zh_cn&size=1&scale=1&style=8`;
  };
  const clipPosition = (position, img) => {
      const { x, y, width, height, left, top } = position;
      if (x < left || y < top) {
          if (x + TILE_SIZE > left + width) {
              return {
                  x: 0,
                  y: top - y,
                  w: left + width - x,
                  h: TILE_SIZE - top + y,
                  originX: x,
                  originY: top,
                  originW: left + width - x,
                  originH: TILE_SIZE - top + y,
              };
          }
          if (y + TILE_SIZE > top + height) {
              return {
                  x: left - x,
                  y: 0,
                  w: TILE_SIZE - left + x,
                  h: height + top - y,
                  originX: left,
                  originY: y,
                  originW: TILE_SIZE - left + x,
                  originH: height + top - y,
              };
          }
          return {
              x: Math.max(left - x, 0),
              y: Math.max(top - y, 0),
              w: Math.max(TILE_SIZE - left + x, TILE_SIZE),
              h: Math.max(TILE_SIZE - top + y, TILE_SIZE),
              originX: Math.max(left, x),
              originY: Math.max(top, y),
              originW: Math.max(TILE_SIZE - left + x, TILE_SIZE),
              originH: Math.max(TILE_SIZE - top + y, TILE_SIZE),
          };
      }
      if (x + TILE_SIZE > left + width || y + TILE_SIZE > top + height) {
          return {
              x: 0,
              y: 0,
              w: Math.min(width + left - x, TILE_SIZE),
              h: Math.min(height + top - y, TILE_SIZE),
              originX: x,
              originY: y,
              originW: Math.min(width + left - x, TILE_SIZE),
              originH: Math.min(height + top - y, TILE_SIZE),
          };
      }
      return {
          x, y
      };
  };
  function shallowEqual(object1, object2) {
      const keys1 = Object.keys(object1);
      const keys2 = Object.keys(object2);
      if (keys1.length !== keys2.length) {
          return false;
      }
      for (let index = 0; index < keys1.length; index++) {
          const val1 = object1[keys1[index]];
          const val2 = object2[keys2[index]];
          if (val1 !== val2) {
              return false;
          }
      }
      return true;
  }

  class Tile {
      constructor({ ctx, row, col, zoom, position, shouldRender }) {
          this.ctx = ctx;
          this.row = row;
          this.col = col;
          this.zoom = zoom;
          this.position = position;
          this.shouldRender = shouldRender;
          this.url = "";
          this.cacheKey = this.row + "_" + this.col + "_" + this.zoom;
          this.img = null;
          this.loaded = false;
          this.timer = null;
          this.createUrl();
          this.load();
      }
      createUrl() {
          this.url = getTileUrl(this.row, this.col, this.zoom);
      }
      load() {
          this.img = new Image();
          this.img.src = this.url;
          this.timer = setTimeout(() => {
              this.createUrl();
              this.load();
          }, 1000);
          this.img.onload = () => {
              this.timer && clearTimeout(this.timer);
              this.loaded = true;
              this.render();
          };
      }
      render() {
          if (!this.loaded || !this.shouldRender(this.cacheKey)) {
              return;
          }
          if (this.img) {
              const { x, y, w, h, originX, originY, originW, originH } = clipPosition(this.position, this.img);
              if (typeof w !== 'undefined'
                  && typeof h !== 'undefined'
                  && typeof originX !== 'undefined'
                  && typeof originY !== 'undefined'
                  && originW
                  && originH) {
                  this.ctx.drawImage(this.img, x, y, w, h, originX, originY, originW, originH);
              }
              else {
                  this.ctx.drawImage(this.img, x, y);
              }
          }
      }
      updatePos(x, y) {
          this.position.x = x;
          this.position.y = y;
          return this;
      }
  }
  class MapElement extends BaseElement {
      constructor(props) {
          super(props);
          this.render = (ctx) => {
              const { layout, style } = this.props;
              let { left, right, top, bottom, width, height } = layout;
              ctx.save();
              ctx.clearRect(left, top, width, height);
              if (style.background) {
                  ctx.fillStyle = style.background;
                  ctx.fillRect(left, top, width, height);
              }
              this.renderTiles(left, top, width, height, ctx);
              ctx.restore();
              this.bindMouseMove(left, top, width, height, ctx);
          };
          this.renderTiles = (left, top, width, height, ctx) => {
              const [originX, originY] = this.data.center;
              const [x, y] = lngLatToMercator(originX, originY);
              let centerTile = getTileRowAndCol(x, y, this.data.zoom);
              let centerTilePos = [
                  centerTile[0] * TILE_SIZE,
                  centerTile[1] * TILE_SIZE,
              ];
              let centerPos = getPxFromLngLat(originX, originY, this.data.zoom);
              let offset = [
                  centerPos[0] - centerTilePos[0],
                  centerPos[1] - centerTilePos[1],
              ];
              let rowMinNum = Math.ceil((width / 2 - offset[0]) / TILE_SIZE);
              let colMinNum = Math.ceil((height / 2 - offset[1]) / TILE_SIZE);
              let rowMaxNum = Math.ceil((width / 2 - (TILE_SIZE - offset[0])) / TILE_SIZE);
              let colMaxNum = Math.ceil((height / 2 - (TILE_SIZE - offset[1])) / TILE_SIZE);
              this.data.currentTileCache = {};
              for (let i = -rowMinNum; i <= rowMaxNum; i++) {
                  for (let j = -colMinNum; j <= colMaxNum; j++) {
                      let row = centerTile[0] + i;
                      let col = centerTile[1] + j;
                      let x = i * TILE_SIZE - Number(offset[0]) + width / 2 + left;
                      let y = j * TILE_SIZE - Number(offset[1]) + height / 2 + top;
                      let cacheKey = row + "_" + col + "_" + this.data.zoom;
                      this.data.currentTileCache[cacheKey] = true;
                      if (this.data.tileCache[cacheKey]) {
                          this.data.tileCache[cacheKey].updatePos(x, y).render();
                      }
                      else {
                          this.data.tileCache[cacheKey] = new Tile({
                              ctx,
                              row,
                              col,
                              zoom: this.data.zoom,
                              position: {
                                  x, y, left, top, width, height
                              },
                              shouldRender: (key) => {
                                  return this.data.currentTileCache[key];
                              },
                          });
                      }
                  }
              }
          };
          this.bindMouseMove = (left, top, width, height, ctx) => {
              let pageX = 0;
              let pageY = 0;
              this.props.on('touchstart', (e) => {
                  pageX = e.targetTouches[0].pageX;
                  pageY = e.targetTouches[0].pageY;
              });
              this.props.on('touchmove', (e) => {
                  let mx = Number(e.targetTouches[0].pageX - pageX) * resolutions[this.data.zoom];
                  let my = Number(e.targetTouches[0].pageY - pageY) * resolutions[this.data.zoom];
                  const [lon, lat] = this.data.center;
                  let [x, y] = lngLatToMercator(lon, lat);
                  this.data.center = mercatorToLngLat(x - mx, my + y);
                  ctx.clearRect(left, top, width, height);
                  this.renderTiles(left, top, width, height, ctx);
              });
          };
          this.data = {
              isMousedown: false,
              tileCache: {},
              currentTileCache: {},
              center: props['data-center'].split(','),
              zoom: 14,
              minZoom: 3,
              maxZoom: 18,
              lastZoom: 0,
              scale: 1,
              scaleTmp: 1,
          };
      }
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var cssLayout = createCommonjsModule(function (module, exports) {
  // UMD (Universal Module Definition)
  // See https://github.com/umdjs/umd for reference
  //
  // This file uses the following specific UMD implementation:
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  (function(root, factory) {
    {
      // Node. Does not work with strict CommonJS, but
      // only CommonJS-like environments that support module.exports,
      // like Node.
      module.exports = factory();
    }
  }(commonjsGlobal, function() {
    /**
   * Copyright (c) 2014, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   */

  var computeLayout = (function() {

    var CSS_UNDEFINED;

    var CSS_DIRECTION_INHERIT = 'inherit';
    var CSS_DIRECTION_LTR = 'ltr';
    var CSS_DIRECTION_RTL = 'rtl';

    var CSS_FLEX_DIRECTION_ROW = 'row';
    var CSS_FLEX_DIRECTION_ROW_REVERSE = 'row-reverse';
    var CSS_FLEX_DIRECTION_COLUMN = 'column';
    var CSS_FLEX_DIRECTION_COLUMN_REVERSE = 'column-reverse';

    var CSS_JUSTIFY_FLEX_START = 'flex-start';
    var CSS_JUSTIFY_CENTER = 'center';
    var CSS_JUSTIFY_FLEX_END = 'flex-end';
    var CSS_JUSTIFY_SPACE_BETWEEN = 'space-between';
    var CSS_JUSTIFY_SPACE_AROUND = 'space-around';

    var CSS_ALIGN_FLEX_START = 'flex-start';
    var CSS_ALIGN_CENTER = 'center';
    var CSS_ALIGN_FLEX_END = 'flex-end';
    var CSS_ALIGN_STRETCH = 'stretch';

    var CSS_POSITION_RELATIVE = 'relative';
    var CSS_POSITION_ABSOLUTE = 'absolute';

    var leading = {
      'row': 'left',
      'row-reverse': 'right',
      'column': 'top',
      'column-reverse': 'bottom'
    };
    var trailing = {
      'row': 'right',
      'row-reverse': 'left',
      'column': 'bottom',
      'column-reverse': 'top'
    };
    var pos = {
      'row': 'left',
      'row-reverse': 'right',
      'column': 'top',
      'column-reverse': 'bottom'
    };
    var dim = {
      'row': 'width',
      'row-reverse': 'width',
      'column': 'height',
      'column-reverse': 'height'
    };

    // When transpiled to Java / C the node type has layout, children and style
    // properties. For the JavaScript version this function adds these properties
    // if they don't already exist.
    function fillNodes(node) {
      if (!node.layout || node.isDirty) {
        node.layout = {
          width: undefined,
          height: undefined,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        };
      }

      if (!node.style) {
        node.style = {};
      }

      if (!node.children) {
        node.children = [];
      }
      node.children.forEach(fillNodes);
      return node;
    }

    function isUndefined(value) {
      return value === undefined;
    }

    function isRowDirection(flexDirection) {
      return flexDirection === CSS_FLEX_DIRECTION_ROW ||
             flexDirection === CSS_FLEX_DIRECTION_ROW_REVERSE;
    }

    function isColumnDirection(flexDirection) {
      return flexDirection === CSS_FLEX_DIRECTION_COLUMN ||
             flexDirection === CSS_FLEX_DIRECTION_COLUMN_REVERSE;
    }

    function getLeadingMargin(node, axis) {
      if (node.style.marginStart !== undefined && isRowDirection(axis)) {
        return node.style.marginStart;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.marginLeft;   break;
        case 'row-reverse':    value = node.style.marginRight;  break;
        case 'column':         value = node.style.marginTop;    break;
        case 'column-reverse': value = node.style.marginBottom; break;
      }

      if (value !== undefined) {
        return value;
      }

      if (node.style.margin !== undefined) {
        return node.style.margin;
      }

      return 0;
    }

    function getTrailingMargin(node, axis) {
      if (node.style.marginEnd !== undefined && isRowDirection(axis)) {
        return node.style.marginEnd;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.marginRight;  break;
        case 'row-reverse':    value = node.style.marginLeft;   break;
        case 'column':         value = node.style.marginBottom; break;
        case 'column-reverse': value = node.style.marginTop;    break;
      }

      if (value != null) {
        return value;
      }

      if (node.style.margin !== undefined) {
        return node.style.margin;
      }

      return 0;
    }

    function getLeadingPadding(node, axis) {
      if (node.style.paddingStart !== undefined && node.style.paddingStart >= 0
          && isRowDirection(axis)) {
        return node.style.paddingStart;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.paddingLeft;   break;
        case 'row-reverse':    value = node.style.paddingRight;  break;
        case 'column':         value = node.style.paddingTop;    break;
        case 'column-reverse': value = node.style.paddingBottom; break;
      }

      if (value != null && value >= 0) {
        return value;
      }

      if (node.style.padding !== undefined && node.style.padding >= 0) {
        return node.style.padding;
      }

      return 0;
    }

    function getTrailingPadding(node, axis) {
      if (node.style.paddingEnd !== undefined && node.style.paddingEnd >= 0
          && isRowDirection(axis)) {
        return node.style.paddingEnd;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.paddingRight;  break;
        case 'row-reverse':    value = node.style.paddingLeft;   break;
        case 'column':         value = node.style.paddingBottom; break;
        case 'column-reverse': value = node.style.paddingTop;    break;
      }

      if (value != null && value >= 0) {
        return value;
      }

      if (node.style.padding !== undefined && node.style.padding >= 0) {
        return node.style.padding;
      }

      return 0;
    }

    function getLeadingBorder(node, axis) {
      if (node.style.borderStartWidth !== undefined && node.style.borderStartWidth >= 0
          && isRowDirection(axis)) {
        return node.style.borderStartWidth;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.borderLeftWidth;   break;
        case 'row-reverse':    value = node.style.borderRightWidth;  break;
        case 'column':         value = node.style.borderTopWidth;    break;
        case 'column-reverse': value = node.style.borderBottomWidth; break;
      }

      if (value != null && value >= 0) {
        return value;
      }

      if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
        return node.style.borderWidth;
      }

      return 0;
    }

    function getTrailingBorder(node, axis) {
      if (node.style.borderEndWidth !== undefined && node.style.borderEndWidth >= 0
          && isRowDirection(axis)) {
        return node.style.borderEndWidth;
      }

      var value = null;
      switch (axis) {
        case 'row':            value = node.style.borderRightWidth;  break;
        case 'row-reverse':    value = node.style.borderLeftWidth;   break;
        case 'column':         value = node.style.borderBottomWidth; break;
        case 'column-reverse': value = node.style.borderTopWidth;    break;
      }

      if (value != null && value >= 0) {
        return value;
      }

      if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
        return node.style.borderWidth;
      }

      return 0;
    }

    function getLeadingPaddingAndBorder(node, axis) {
      return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
    }

    function getTrailingPaddingAndBorder(node, axis) {
      return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
    }

    function getBorderAxis(node, axis) {
      return getLeadingBorder(node, axis) + getTrailingBorder(node, axis);
    }

    function getMarginAxis(node, axis) {
      return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
    }

    function getPaddingAndBorderAxis(node, axis) {
      return getLeadingPaddingAndBorder(node, axis) +
          getTrailingPaddingAndBorder(node, axis);
    }

    function getJustifyContent(node) {
      if (node.style.justifyContent) {
        return node.style.justifyContent;
      }
      return 'flex-start';
    }

    function getAlignContent(node) {
      if (node.style.alignContent) {
        return node.style.alignContent;
      }
      return 'flex-start';
    }

    function getAlignItem(node, child) {
      if (child.style.alignSelf) {
        return child.style.alignSelf;
      }
      if (node.style.alignItems) {
        return node.style.alignItems;
      }
      return 'stretch';
    }

    function resolveAxis(axis, direction) {
      if (direction === CSS_DIRECTION_RTL) {
        if (axis === CSS_FLEX_DIRECTION_ROW) {
          return CSS_FLEX_DIRECTION_ROW_REVERSE;
        } else if (axis === CSS_FLEX_DIRECTION_ROW_REVERSE) {
          return CSS_FLEX_DIRECTION_ROW;
        }
      }

      return axis;
    }

    function resolveDirection(node, parentDirection) {
      var direction;
      if (node.style.direction) {
        direction = node.style.direction;
      } else {
        direction = CSS_DIRECTION_INHERIT;
      }

      if (direction === CSS_DIRECTION_INHERIT) {
        direction = (parentDirection === undefined ? CSS_DIRECTION_LTR : parentDirection);
      }

      return direction;
    }

    function getFlexDirection(node) {
      if (node.style.flexDirection) {
        return node.style.flexDirection;
      }
      return CSS_FLEX_DIRECTION_COLUMN;
    }

    function getCrossFlexDirection(flexDirection, direction) {
      if (isColumnDirection(flexDirection)) {
        return resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);
      } else {
        return CSS_FLEX_DIRECTION_COLUMN;
      }
    }

    function getPositionType(node) {
      if (node.style.position) {
        return node.style.position;
      }
      return 'relative';
    }

    function isFlex(node) {
      return (
        getPositionType(node) === CSS_POSITION_RELATIVE &&
        node.style.flex > 0
      );
    }

    function isFlexWrap(node) {
      return node.style.flexWrap === 'wrap';
    }

    function getDimWithMargin(node, axis) {
      return node.layout[dim[axis]] + getMarginAxis(node, axis);
    }

    function isDimDefined(node, axis) {
      return node.style[dim[axis]] !== undefined && node.style[dim[axis]] >= 0;
    }

    function isPosDefined(node, pos) {
      return node.style[pos] !== undefined;
    }

    function isMeasureDefined(node) {
      return node.style.measure !== undefined;
    }

    function getPosition(node, pos) {
      if (node.style[pos] !== undefined) {
        return node.style[pos];
      }
      return 0;
    }

    function boundAxis(node, axis, value) {
      var min = {
        'row': node.style.minWidth,
        'row-reverse': node.style.minWidth,
        'column': node.style.minHeight,
        'column-reverse': node.style.minHeight
      }[axis];

      var max = {
        'row': node.style.maxWidth,
        'row-reverse': node.style.maxWidth,
        'column': node.style.maxHeight,
        'column-reverse': node.style.maxHeight
      }[axis];

      var boundValue = value;
      if (max !== undefined && max >= 0 && boundValue > max) {
        boundValue = max;
      }
      if (min !== undefined && min >= 0 && boundValue < min) {
        boundValue = min;
      }
      return boundValue;
    }

    function fmaxf(a, b) {
      if (a > b) {
        return a;
      }
      return b;
    }

    // When the user specifically sets a value for width or height
    function setDimensionFromStyle(node, axis) {
      // The parent already computed us a width or height. We just skip it
      if (node.layout[dim[axis]] !== undefined) {
        return;
      }
      // We only run if there's a width or height defined
      if (!isDimDefined(node, axis)) {
        return;
      }

      // The dimensions can never be smaller than the padding and border
      node.layout[dim[axis]] = fmaxf(
        boundAxis(node, axis, node.style[dim[axis]]),
        getPaddingAndBorderAxis(node, axis)
      );
    }

    function setTrailingPosition(node, child, axis) {
      child.layout[trailing[axis]] = node.layout[dim[axis]] -
          child.layout[dim[axis]] - child.layout[pos[axis]];
    }

    // If both left and right are defined, then use left. Otherwise return
    // +left or -right depending on which is defined.
    function getRelativePosition(node, axis) {
      if (node.style[leading[axis]] !== undefined) {
        return getPosition(node, leading[axis]);
      }
      return -getPosition(node, trailing[axis]);
    }

    function layoutNodeImpl(node, parentMaxWidth, /*css_direction_t*/parentDirection) {
      var/*css_direction_t*/ direction = resolveDirection(node, parentDirection);
      var/*(c)!css_flex_direction_t*//*(java)!int*/ mainAxis = resolveAxis(getFlexDirection(node), direction);
      var/*(c)!css_flex_direction_t*//*(java)!int*/ crossAxis = getCrossFlexDirection(mainAxis, direction);
      var/*(c)!css_flex_direction_t*//*(java)!int*/ resolvedRowAxis = resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);

      // Handle width and height style attributes
      setDimensionFromStyle(node, mainAxis);
      setDimensionFromStyle(node, crossAxis);

      // Set the resolved resolution in the node's layout
      node.layout.direction = direction;

      // The position is set by the parent, but we need to complete it with a
      // delta composed of the margin and left/top/right/bottom
      node.layout[leading[mainAxis]] += getLeadingMargin(node, mainAxis) +
        getRelativePosition(node, mainAxis);
      node.layout[trailing[mainAxis]] += getTrailingMargin(node, mainAxis) +
        getRelativePosition(node, mainAxis);
      node.layout[leading[crossAxis]] += getLeadingMargin(node, crossAxis) +
        getRelativePosition(node, crossAxis);
      node.layout[trailing[crossAxis]] += getTrailingMargin(node, crossAxis) +
        getRelativePosition(node, crossAxis);

      // Inline immutable values from the target node to avoid excessive method
      // invocations during the layout calculation.
      var/*int*/ childCount = node.children.length;
      var/*float*/ paddingAndBorderAxisResolvedRow = getPaddingAndBorderAxis(node, resolvedRowAxis);

      if (isMeasureDefined(node)) {
        var/*bool*/ isResolvedRowDimDefined = !isUndefined(node.layout[dim[resolvedRowAxis]]);

        var/*float*/ width = CSS_UNDEFINED;
        if (isDimDefined(node, resolvedRowAxis)) {
          width = node.style.width;
        } else if (isResolvedRowDimDefined) {
          width = node.layout[dim[resolvedRowAxis]];
        } else {
          width = parentMaxWidth -
            getMarginAxis(node, resolvedRowAxis);
        }
        width -= paddingAndBorderAxisResolvedRow;

        // We only need to give a dimension for the text if we haven't got any
        // for it computed yet. It can either be from the style attribute or because
        // the element is flexible.
        var/*bool*/ isRowUndefined = !isDimDefined(node, resolvedRowAxis) && !isResolvedRowDimDefined;
        var/*bool*/ isColumnUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) &&
          isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_COLUMN]]);

        // Let's not measure the text if we already know both dimensions
        if (isRowUndefined || isColumnUndefined) {
          var/*css_dim_t*/ measureDim = node.style.measure(
            /*(c)!node->context,*/
            /*(java)!layoutContext.measureOutput,*/
            width
          );
          if (isRowUndefined) {
            node.layout.width = measureDim.width +
              paddingAndBorderAxisResolvedRow;
          }
          if (isColumnUndefined) {
            node.layout.height = measureDim.height +
              getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
          }
        }
        if (childCount === 0) {
          return;
        }
      }

      var/*bool*/ isNodeFlexWrap = isFlexWrap(node);

      var/*css_justify_t*/ justifyContent = getJustifyContent(node);

      var/*float*/ leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
      var/*float*/ leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
      var/*float*/ paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
      var/*float*/ paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

      var/*bool*/ isMainDimDefined = !isUndefined(node.layout[dim[mainAxis]]);
      var/*bool*/ isCrossDimDefined = !isUndefined(node.layout[dim[crossAxis]]);
      var/*bool*/ isMainRowDirection = isRowDirection(mainAxis);

      var/*int*/ i;
      var/*int*/ ii;
      var/*css_node_t**/ child;
      var/*(c)!css_flex_direction_t*//*(java)!int*/ axis;

      var/*css_node_t**/ firstAbsoluteChild = null;
      var/*css_node_t**/ currentAbsoluteChild = null;

      var/*float*/ definedMainDim = CSS_UNDEFINED;
      if (isMainDimDefined) {
        definedMainDim = node.layout[dim[mainAxis]] - paddingAndBorderAxisMain;
      }

      // We want to execute the next two loops one per line with flex-wrap
      var/*int*/ startLine = 0;
      var/*int*/ endLine = 0;
      // var/*int*/ nextOffset = 0;
      var/*int*/ alreadyComputedNextLayout = 0;
      // We aggregate the total dimensions of the container in those two variables
      var/*float*/ linesCrossDim = 0;
      var/*float*/ linesMainDim = 0;
      var/*int*/ linesCount = 0;
      while (endLine < childCount) {
        // <Loop A> Layout non flexible children and count children by type

        // mainContentDim is accumulation of the dimensions and margin of all the
        // non flexible children. This will be used in order to either set the
        // dimensions of the node if none already exist, or to compute the
        // remaining space left for the flexible children.
        var/*float*/ mainContentDim = 0;

        // There are three kind of children, non flexible, flexible and absolute.
        // We need to know how many there are in order to distribute the space.
        var/*int*/ flexibleChildrenCount = 0;
        var/*float*/ totalFlexible = 0;
        var/*int*/ nonFlexibleChildrenCount = 0;

        // Use the line loop to position children in the main axis for as long
        // as they are using a simple stacking behaviour. Children that are
        // immediately stacked in the initial loop will not be touched again
        // in <Loop C>.
        var/*bool*/ isSimpleStackMain =
            (isMainDimDefined && justifyContent === CSS_JUSTIFY_FLEX_START) ||
            (!isMainDimDefined && justifyContent !== CSS_JUSTIFY_CENTER);
        var/*int*/ firstComplexMain = (isSimpleStackMain ? childCount : startLine);

        // Use the initial line loop to position children in the cross axis for
        // as long as they are relatively positioned with alignment STRETCH or
        // FLEX_START. Children that are immediately stacked in the initial loop
        // will not be touched again in <Loop D>.
        var/*bool*/ isSimpleStackCross = true;
        var/*int*/ firstComplexCross = childCount;

        var/*css_node_t**/ firstFlexChild = null;
        var/*css_node_t**/ currentFlexChild = null;

        var/*float*/ mainDim = leadingPaddingAndBorderMain;
        var/*float*/ crossDim = 0;

        var/*float*/ maxWidth;
        for (i = startLine; i < childCount; ++i) {
          child = node.children[i];
          child.lineIndex = linesCount;

          child.nextAbsoluteChild = null;
          child.nextFlexChild = null;

          var/*css_align_t*/ alignItem = getAlignItem(node, child);

          // Pre-fill cross axis dimensions when the child is using stretch before
          // we call the recursive layout pass
          if (alignItem === CSS_ALIGN_STRETCH &&
              getPositionType(child) === CSS_POSITION_RELATIVE &&
              isCrossDimDefined &&
              !isDimDefined(child, crossAxis)) {
            child.layout[dim[crossAxis]] = fmaxf(
              boundAxis(child, crossAxis, node.layout[dim[crossAxis]] -
                paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, crossAxis)
            );
          } else if (getPositionType(child) === CSS_POSITION_ABSOLUTE) {
            // Store a private linked list of absolutely positioned children
            // so that we can efficiently traverse them later.
            if (firstAbsoluteChild === null) {
              firstAbsoluteChild = child;
            }
            if (currentAbsoluteChild !== null) {
              currentAbsoluteChild.nextAbsoluteChild = child;
            }
            currentAbsoluteChild = child;

            // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
            // left and right or top and bottom).
            for (ii = 0; ii < 2; ii++) {
              axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
              if (!isUndefined(node.layout[dim[axis]]) &&
                  !isDimDefined(child, axis) &&
                  isPosDefined(child, leading[axis]) &&
                  isPosDefined(child, trailing[axis])) {
                child.layout[dim[axis]] = fmaxf(
                  boundAxis(child, axis, node.layout[dim[axis]] -
                    getPaddingAndBorderAxis(node, axis) -
                    getMarginAxis(child, axis) -
                    getPosition(child, leading[axis]) -
                    getPosition(child, trailing[axis])),
                  // You never want to go smaller than padding
                  getPaddingAndBorderAxis(child, axis)
                );
              }
            }
          }

          var/*float*/ nextContentDim = 0;

          // It only makes sense to consider a child flexible if we have a computed
          // dimension for the node.
          if (isMainDimDefined && isFlex(child)) {
            flexibleChildrenCount++;
            totalFlexible += child.style.flex;

            // Store a private linked list of flexible children so that we can
            // efficiently traverse them later.
            if (firstFlexChild === null) {
              firstFlexChild = child;
            }
            if (currentFlexChild !== null) {
              currentFlexChild.nextFlexChild = child;
            }
            currentFlexChild = child;

            // Even if we don't know its exact size yet, we already know the padding,
            // border and margin. We'll use this partial information, which represents
            // the smallest possible size for the child, to compute the remaining
            // available space.
            nextContentDim = getPaddingAndBorderAxis(child, mainAxis) +
              getMarginAxis(child, mainAxis);

          } else {
            maxWidth = CSS_UNDEFINED;
            if (!isMainRowDirection) {
              if (isDimDefined(node, resolvedRowAxis)) {
                maxWidth = node.layout[dim[resolvedRowAxis]] -
                  paddingAndBorderAxisResolvedRow;
              } else {
                maxWidth = parentMaxWidth -
                  getMarginAxis(node, resolvedRowAxis) -
                  paddingAndBorderAxisResolvedRow;
              }
            }

            // This is the main recursive call. We layout non flexible children.
            if (alreadyComputedNextLayout === 0) {
              layoutNode(/*(java)!layoutContext, */child, maxWidth, direction);
            }

            // Absolute positioned elements do not take part of the layout, so we
            // don't use them to compute mainContentDim
            if (getPositionType(child) === CSS_POSITION_RELATIVE) {
              nonFlexibleChildrenCount++;
              // At this point we know the final size and margin of the element.
              nextContentDim = getDimWithMargin(child, mainAxis);
            }
          }

          // The element we are about to add would make us go to the next line
          if (isNodeFlexWrap &&
              isMainDimDefined &&
              mainContentDim + nextContentDim > definedMainDim &&
              // If there's only one element, then it's bigger than the content
              // and needs its own line
              i !== startLine) {
            nonFlexibleChildrenCount--;
            alreadyComputedNextLayout = 1;
            break;
          }

          // Disable simple stacking in the main axis for the current line as
          // we found a non-trivial child. The remaining children will be laid out
          // in <Loop C>.
          if (isSimpleStackMain &&
              (getPositionType(child) !== CSS_POSITION_RELATIVE || isFlex(child))) {
            isSimpleStackMain = false;
            firstComplexMain = i;
          }

          // Disable simple stacking in the cross axis for the current line as
          // we found a non-trivial child. The remaining children will be laid out
          // in <Loop D>.
          if (isSimpleStackCross &&
              (getPositionType(child) !== CSS_POSITION_RELATIVE ||
                  (alignItem !== CSS_ALIGN_STRETCH && alignItem !== CSS_ALIGN_FLEX_START) ||
                  isUndefined(child.layout[dim[crossAxis]]))) {
            isSimpleStackCross = false;
            firstComplexCross = i;
          }

          if (isSimpleStackMain) {
            child.layout[pos[mainAxis]] += mainDim;
            if (isMainDimDefined) {
              setTrailingPosition(node, child, mainAxis);
            }

            mainDim += getDimWithMargin(child, mainAxis);
            crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
          }

          if (isSimpleStackCross) {
            child.layout[pos[crossAxis]] += linesCrossDim + leadingPaddingAndBorderCross;
            if (isCrossDimDefined) {
              setTrailingPosition(node, child, crossAxis);
            }
          }

          alreadyComputedNextLayout = 0;
          mainContentDim += nextContentDim;
          endLine = i + 1;
        }

        // <Loop B> Layout flexible children and allocate empty space

        // In order to position the elements in the main axis, we have two
        // controls. The space between the beginning and the first element
        // and the space between each two elements.
        var/*float*/ leadingMainDim = 0;
        var/*float*/ betweenMainDim = 0;

        // The remaining available space that needs to be allocated
        var/*float*/ remainingMainDim = 0;
        if (isMainDimDefined) {
          remainingMainDim = definedMainDim - mainContentDim;
        } else {
          remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
        }

        // If there are flexible children in the mix, they are going to fill the
        // remaining space
        if (flexibleChildrenCount !== 0) {
          var/*float*/ flexibleMainDim = remainingMainDim / totalFlexible;
          var/*float*/ baseMainDim;
          var/*float*/ boundMainDim;

          // If the flex share of remaining space doesn't meet min/max bounds,
          // remove this child from flex calculations.
          currentFlexChild = firstFlexChild;
          while (currentFlexChild !== null) {
            baseMainDim = flexibleMainDim * currentFlexChild.style.flex +
                getPaddingAndBorderAxis(currentFlexChild, mainAxis);
            boundMainDim = boundAxis(currentFlexChild, mainAxis, baseMainDim);

            if (baseMainDim !== boundMainDim) {
              remainingMainDim -= boundMainDim;
              totalFlexible -= currentFlexChild.style.flex;
            }

            currentFlexChild = currentFlexChild.nextFlexChild;
          }
          flexibleMainDim = remainingMainDim / totalFlexible;

          // The non flexible children can overflow the container, in this case
          // we should just assume that there is no space available.
          if (flexibleMainDim < 0) {
            flexibleMainDim = 0;
          }

          currentFlexChild = firstFlexChild;
          while (currentFlexChild !== null) {
            // At this point we know the final size of the element in the main
            // dimension
            currentFlexChild.layout[dim[mainAxis]] = boundAxis(currentFlexChild, mainAxis,
              flexibleMainDim * currentFlexChild.style.flex +
                  getPaddingAndBorderAxis(currentFlexChild, mainAxis)
            );

            maxWidth = CSS_UNDEFINED;
            if (isDimDefined(node, resolvedRowAxis)) {
              maxWidth = node.layout[dim[resolvedRowAxis]] -
                paddingAndBorderAxisResolvedRow;
            } else if (!isMainRowDirection) {
              maxWidth = parentMaxWidth -
                getMarginAxis(node, resolvedRowAxis) -
                paddingAndBorderAxisResolvedRow;
            }

            // And we recursively call the layout algorithm for this child
            layoutNode(/*(java)!layoutContext, */currentFlexChild, maxWidth, direction);

            child = currentFlexChild;
            currentFlexChild = currentFlexChild.nextFlexChild;
            child.nextFlexChild = null;
          }

        // We use justifyContent to figure out how to allocate the remaining
        // space available
        } else if (justifyContent !== CSS_JUSTIFY_FLEX_START) {
          if (justifyContent === CSS_JUSTIFY_CENTER) {
            leadingMainDim = remainingMainDim / 2;
          } else if (justifyContent === CSS_JUSTIFY_FLEX_END) {
            leadingMainDim = remainingMainDim;
          } else if (justifyContent === CSS_JUSTIFY_SPACE_BETWEEN) {
            remainingMainDim = fmaxf(remainingMainDim, 0);
            if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 !== 0) {
              betweenMainDim = remainingMainDim /
                (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
            } else {
              betweenMainDim = 0;
            }
          } else if (justifyContent === CSS_JUSTIFY_SPACE_AROUND) {
            // Space on the edges is half of the space between elements
            betweenMainDim = remainingMainDim /
              (flexibleChildrenCount + nonFlexibleChildrenCount);
            leadingMainDim = betweenMainDim / 2;
          }
        }

        // <Loop C> Position elements in the main axis and compute dimensions

        // At this point, all the children have their dimensions set. We need to
        // find their position. In order to do that, we accumulate data in
        // variables that are also useful to compute the total dimensions of the
        // container!
        mainDim += leadingMainDim;

        for (i = firstComplexMain; i < endLine; ++i) {
          child = node.children[i];

          if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
              isPosDefined(child, leading[mainAxis])) {
            // In case the child is position absolute and has left/top being
            // defined, we override the position to whatever the user said
            // (and margin/border).
            child.layout[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
              getLeadingBorder(node, mainAxis) +
              getLeadingMargin(child, mainAxis);
          } else {
            // If the child is position absolute (without top/left) or relative,
            // we put it at the current accumulated offset.
            child.layout[pos[mainAxis]] += mainDim;

            // Define the trailing position accordingly.
            if (isMainDimDefined) {
              setTrailingPosition(node, child, mainAxis);
            }

            // Now that we placed the element, we need to update the variables
            // We only need to do that for relative elements. Absolute elements
            // do not take part in that phase.
            if (getPositionType(child) === CSS_POSITION_RELATIVE) {
              // The main dimension is the sum of all the elements dimension plus
              // the spacing.
              mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
              // The cross dimension is the max of the elements dimension since there
              // can only be one element in that cross dimension.
              crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
            }
          }
        }

        var/*float*/ containerCrossAxis = node.layout[dim[crossAxis]];
        if (!isCrossDimDefined) {
          containerCrossAxis = fmaxf(
            // For the cross dim, we add both sides at the end because the value
            // is aggregate via a max function. Intermediate negative values
            // can mess this computation otherwise
            boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross),
            paddingAndBorderAxisCross
          );
        }

        // <Loop D> Position elements in the cross axis
        for (i = firstComplexCross; i < endLine; ++i) {
          child = node.children[i];

          if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
              isPosDefined(child, leading[crossAxis])) {
            // In case the child is absolutely positionned and has a
            // top/left/bottom/right being set, we override all the previously
            // computed positions to set it correctly.
            child.layout[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
              getLeadingBorder(node, crossAxis) +
              getLeadingMargin(child, crossAxis);

          } else {
            var/*float*/ leadingCrossDim = leadingPaddingAndBorderCross;

            // For a relative children, we're either using alignItems (parent) or
            // alignSelf (child) in order to determine the position in the cross axis
            if (getPositionType(child) === CSS_POSITION_RELATIVE) {
              /*eslint-disable */
              // This variable is intentionally re-defined as the code is transpiled to a block scope language
              var/*css_align_t*/ alignItem = getAlignItem(node, child);
              /*eslint-enable */
              if (alignItem === CSS_ALIGN_STRETCH) {
                // You can only stretch if the dimension has not already been set
                // previously.
                if (isUndefined(child.layout[dim[crossAxis]])) {
                  child.layout[dim[crossAxis]] = fmaxf(
                    boundAxis(child, crossAxis, containerCrossAxis -
                      paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
                    // You never want to go smaller than padding
                    getPaddingAndBorderAxis(child, crossAxis)
                  );
                }
              } else if (alignItem !== CSS_ALIGN_FLEX_START) {
                // The remaining space between the parent dimensions+padding and child
                // dimensions+margin.
                var/*float*/ remainingCrossDim = containerCrossAxis -
                  paddingAndBorderAxisCross - getDimWithMargin(child, crossAxis);

                if (alignItem === CSS_ALIGN_CENTER) {
                  leadingCrossDim += remainingCrossDim / 2;
                } else { // CSS_ALIGN_FLEX_END
                  leadingCrossDim += remainingCrossDim;
                }
              }
            }

            // And we apply the position
            child.layout[pos[crossAxis]] += linesCrossDim + leadingCrossDim;

            // Define the trailing position accordingly.
            if (isCrossDimDefined) {
              setTrailingPosition(node, child, crossAxis);
            }
          }
        }

        linesCrossDim += crossDim;
        linesMainDim = fmaxf(linesMainDim, mainDim);
        linesCount += 1;
        startLine = endLine;
      }

      // <Loop E>
      //
      // Note(prenaux): More than one line, we need to layout the crossAxis
      // according to alignContent.
      //
      // Note that we could probably remove <Loop D> and handle the one line case
      // here too, but for the moment this is safer since it won't interfere with
      // previously working code.
      //
      // See specs:
      // http://www.w3.org/TR/2012/CR-css3-flexbox-20120918/#layout-algorithm
      // section 9.4
      //
      if (linesCount > 1 && isCrossDimDefined) {
        var/*float*/ nodeCrossAxisInnerSize = node.layout[dim[crossAxis]] -
            paddingAndBorderAxisCross;
        var/*float*/ remainingAlignContentDim = nodeCrossAxisInnerSize - linesCrossDim;

        var/*float*/ crossDimLead = 0;
        var/*float*/ currentLead = leadingPaddingAndBorderCross;

        var/*css_align_t*/ alignContent = getAlignContent(node);
        if (alignContent === CSS_ALIGN_FLEX_END) {
          currentLead += remainingAlignContentDim;
        } else if (alignContent === CSS_ALIGN_CENTER) {
          currentLead += remainingAlignContentDim / 2;
        } else if (alignContent === CSS_ALIGN_STRETCH) {
          if (nodeCrossAxisInnerSize > linesCrossDim) {
            crossDimLead = (remainingAlignContentDim / linesCount);
          }
        }

        var/*int*/ endIndex = 0;
        for (i = 0; i < linesCount; ++i) {
          var/*int*/ startIndex = endIndex;

          // compute the line's height and find the endIndex
          var/*float*/ lineHeight = 0;
          for (ii = startIndex; ii < childCount; ++ii) {
            child = node.children[ii];
            if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
              continue;
            }
            if (child.lineIndex !== i) {
              break;
            }
            if (!isUndefined(child.layout[dim[crossAxis]])) {
              lineHeight = fmaxf(
                lineHeight,
                child.layout[dim[crossAxis]] + getMarginAxis(child, crossAxis)
              );
            }
          }
          endIndex = ii;
          lineHeight += crossDimLead;

          for (ii = startIndex; ii < endIndex; ++ii) {
            child = node.children[ii];
            if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
              continue;
            }

            var/*css_align_t*/ alignContentAlignItem = getAlignItem(node, child);
            if (alignContentAlignItem === CSS_ALIGN_FLEX_START) {
              child.layout[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
            } else if (alignContentAlignItem === CSS_ALIGN_FLEX_END) {
              child.layout[pos[crossAxis]] = currentLead + lineHeight - getTrailingMargin(child, crossAxis) - child.layout[dim[crossAxis]];
            } else if (alignContentAlignItem === CSS_ALIGN_CENTER) {
              var/*float*/ childHeight = child.layout[dim[crossAxis]];
              child.layout[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
            } else if (alignContentAlignItem === CSS_ALIGN_STRETCH) {
              child.layout[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
              // TODO(prenaux): Correctly set the height of items with undefined
              //                (auto) crossAxis dimension.
            }
          }

          currentLead += lineHeight;
        }
      }

      var/*bool*/ needsMainTrailingPos = false;
      var/*bool*/ needsCrossTrailingPos = false;

      // If the user didn't specify a width or height, and it has not been set
      // by the container, then we set it via the children.
      if (!isMainDimDefined) {
        node.layout[dim[mainAxis]] = fmaxf(
          // We're missing the last padding at this point to get the final
          // dimension
          boundAxis(node, mainAxis, linesMainDim + getTrailingPaddingAndBorder(node, mainAxis)),
          // We can never assign a width smaller than the padding and borders
          paddingAndBorderAxisMain
        );

        if (mainAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
            mainAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
          needsMainTrailingPos = true;
        }
      }

      if (!isCrossDimDefined) {
        node.layout[dim[crossAxis]] = fmaxf(
          // For the cross dim, we add both sides at the end because the value
          // is aggregate via a max function. Intermediate negative values
          // can mess this computation otherwise
          boundAxis(node, crossAxis, linesCrossDim + paddingAndBorderAxisCross),
          paddingAndBorderAxisCross
        );

        if (crossAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
            crossAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
          needsCrossTrailingPos = true;
        }
      }

      // <Loop F> Set trailing position if necessary
      if (needsMainTrailingPos || needsCrossTrailingPos) {
        for (i = 0; i < childCount; ++i) {
          child = node.children[i];

          if (needsMainTrailingPos) {
            setTrailingPosition(node, child, mainAxis);
          }

          if (needsCrossTrailingPos) {
            setTrailingPosition(node, child, crossAxis);
          }
        }
      }

      // <Loop G> Calculate dimensions for absolutely positioned elements
      currentAbsoluteChild = firstAbsoluteChild;
      while (currentAbsoluteChild !== null) {
        // Pre-fill dimensions when using absolute position and both offsets for
        // the axis are defined (either both left and right or top and bottom).
        for (ii = 0; ii < 2; ii++) {
          axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;

          if (!isUndefined(node.layout[dim[axis]]) &&
              !isDimDefined(currentAbsoluteChild, axis) &&
              isPosDefined(currentAbsoluteChild, leading[axis]) &&
              isPosDefined(currentAbsoluteChild, trailing[axis])) {
            currentAbsoluteChild.layout[dim[axis]] = fmaxf(
              boundAxis(currentAbsoluteChild, axis, node.layout[dim[axis]] -
                getBorderAxis(node, axis) -
                getMarginAxis(currentAbsoluteChild, axis) -
                getPosition(currentAbsoluteChild, leading[axis]) -
                getPosition(currentAbsoluteChild, trailing[axis])
              ),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(currentAbsoluteChild, axis)
            );
          }

          if (isPosDefined(currentAbsoluteChild, trailing[axis]) &&
              !isPosDefined(currentAbsoluteChild, leading[axis])) {
            currentAbsoluteChild.layout[leading[axis]] =
              node.layout[dim[axis]] -
              currentAbsoluteChild.layout[dim[axis]] -
              getPosition(currentAbsoluteChild, trailing[axis]);
          }
        }

        child = currentAbsoluteChild;
        currentAbsoluteChild = currentAbsoluteChild.nextAbsoluteChild;
        child.nextAbsoluteChild = null;
      }
    }

    function layoutNode(node, parentMaxWidth, parentDirection) {
      node.shouldUpdate = true;

      var direction = node.style.direction || CSS_DIRECTION_LTR;
      var skipLayout =
        !node.isDirty &&
        node.lastLayout &&
        node.lastLayout.requestedHeight === node.layout.height &&
        node.lastLayout.requestedWidth === node.layout.width &&
        node.lastLayout.parentMaxWidth === parentMaxWidth &&
        node.lastLayout.direction === direction;

      if (skipLayout) {
        node.layout.width = node.lastLayout.width;
        node.layout.height = node.lastLayout.height;
        node.layout.top = node.lastLayout.top;
        node.layout.left = node.lastLayout.left;
      } else {
        if (!node.lastLayout) {
          node.lastLayout = {};
        }

        node.lastLayout.requestedWidth = node.layout.width;
        node.lastLayout.requestedHeight = node.layout.height;
        node.lastLayout.parentMaxWidth = parentMaxWidth;
        node.lastLayout.direction = direction;

        // Reset child layouts
        node.children.forEach(function(child) {
          child.layout.width = undefined;
          child.layout.height = undefined;
          child.layout.top = 0;
          child.layout.left = 0;
        });

        layoutNodeImpl(node, parentMaxWidth, parentDirection);

        node.lastLayout.width = node.layout.width;
        node.lastLayout.height = node.layout.height;
        node.lastLayout.top = node.layout.top;
        node.lastLayout.left = node.layout.left;
      }
    }

    return {
      layoutNodeImpl: layoutNodeImpl,
      computeLayout: layoutNode,
      fillNodes: fillNodes
    };
  })();

  // This module export is only used for the purposes of unit testing this file. When
  // the library is packaged this file is included within css-layout.js which forms
  // the public API.
  {
    module.exports = computeLayout;
  }


    return function(node) {
      /*eslint-disable */
      // disabling ESLint because this code relies on the above include
      computeLayout.fillNodes(node);
      computeLayout.computeLayout(node);
      /*eslint-enable */
    };
  }));
  });
  cssLayout.computeLayout;

  function _getElementsById(tree, list = [], id) {
      Object.keys(tree.children).forEach(key => {
          const child = tree.children[key];
          if (child.idName === id) {
              list.push(child);
          }
          if (Object.keys(child.children).length) {
              _getElementsById(child, list, id);
          }
      });
      return list;
  }
  function _getElementsByClassName(tree, list = [], className) {
      Object.keys(tree.children).forEach(key => {
          const child = tree.children[key];
          if (child.className.split(/\s+/).indexOf(className) > -1) {
              list.push(child);
          }
          if (Object.keys(child.children).length) {
              _getElementsByClassName(child, list, className);
          }
      });
      return list;
  }
  function isClick(touchMsg) {
      const start = touchMsg.touchstart;
      const end = touchMsg.touchend;
      if (!start
          || !end
          || !start.timeStamp
          || !end.timeStamp
          || start.pageX === undefined
          || start.pageY === undefined
          || end.pageX === undefined
          || end.pageY === undefined) {
          return false;
      }
      const startPosX = start.pageX;
      const startPosY = start.pageY;
      const endPosX = end.pageX;
      const endPosY = end.pageY;
      const touchTimes = end.timeStamp - start.timeStamp;
      return !!(Math.abs(endPosY - startPosY) < 30
          && Math.abs(endPosX - startPosX) < 30
          && touchTimes < 300);
  }

  let updateCallbacks = [];
  let scheduler = Promise.resolve();
  function schedule(callback) {
      if (updateCallbacks.length === 0) {
          scheduler.then(flush);
      }
      updateCallbacks.push(callback);
  }
  function flush() {
      const callback = updateCallbacks.pop();
      if (typeof callback === 'function') {
          callback();
      }
      updateCallbacks.length = 0;
  }

  const StyleContReg = /<style[^>]*>(.|\n)*<\/style>/gi;
  const DelStyleTagReg = /(<\/?style.*?>)/gi;
  const mapElement = {
      view: ViewElement,
      text: TextElement,
      images: ImageElement,
      map: MapElement
  };
  class CanvasRender {
      constructor() {
          this.init = () => {
              const canvas = document.createElement('canvas');
              document.body.appendChild(canvas);
              canvas.width = document.documentElement.clientWidth;
              canvas.height = document.documentElement.clientHeight;
              this.ctx = canvas.getContext('2d');
              this.touchStart = this.eventHandler('touchstart');
              this.touchEnd = this.eventHandler('touchend');
              this.touchMove = this.eventHandler('touchmove');
          };
          this.getTempCont = () => {
              var _a;
              const temp = document.getElementsByTagName('template')[0];
              const div = document.createElement('tempDiv');
              div.appendChild(temp.content);
              const cont = div.innerHTML;
              (_a = div.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(div);
              const res = {
                  style: '',
                  xml: ''
              };
              res.xml = cont.replace(StyleContReg, (css) => {
                  res.style = css.replace(DelStyleTagReg, '');
                  return '';
              });
              return res;
          };
          this.initRender = (frist) => {
              const layoutTree = this.layoutTree(this.tree);
              this.renderElement(layoutTree);
              frist && this.bindEvents();
          };
          this.repaintRender = () => {
              this.resetLayoutData(this.tree);
              this.initRender(false);
          };
          this.resetLayoutData = (renderTree) => {
              var _a;
              renderTree.layout = null;
              renderTree.lastLayout = null;
              renderTree.shouldUpdate = null;
              renderTree.lineIndex = null;
              renderTree.nextAbsoluteChild = null;
              renderTree.nextFlexChild = null;
              delete renderTree.layout;
              delete renderTree.lastLayout;
              delete renderTree.shouldUpdate;
              delete renderTree.lineIndex;
              delete renderTree.nextAbsoluteChild;
              delete renderTree.nextFlexChild;
              (_a = renderTree.children) === null || _a === void 0 ? void 0 : _a.map((child) => {
                  this.resetLayoutData(child);
              });
              return renderTree;
          };
          this.renderTree = (domTree, cssTree) => {
              let children = domTree.children || [];
              children.forEach((childNode) => {
                  let attr = childNode.attr || {};
                  const id = attr.id || '';
                  const args = Object.keys(attr)
                      .reduce((obj, key) => {
                      const value = attr[key];
                      const attribute = `data-${key}`;
                      if (key === 'id') {
                          obj.style = Object.assign(obj.style, cssTree[id] || {});
                          return obj;
                      }
                      if (key === 'class') {
                          obj.style = value.split(/\s+/).reduce((res, oneClass) => {
                              return Object.assign(res, cssTree[oneClass]);
                          }, obj.style);
                          return obj;
                      }
                      if (value === 'true') {
                          obj[attribute] = true;
                      }
                      else if (value === 'false') {
                          obj[attribute] = false;
                      }
                      else {
                          obj[attribute] = value;
                      }
                      return obj;
                  }, { style: childNode.style || {} });
                  args.idName = id;
                  args.className = attr.class || '';
                  const { background, color } = domTree.style || {};
                  if (background || color) {
                      args.style = Object.assign({ background,
                          color }, args.style);
                  }
                  if (childNode['#text']) {
                      childNode.children.push({
                          name: 'text',
                          style: {
                              height: 40,
                          },
                          'data-value': childNode['#text']
                      });
                  }
                  Object.assign(childNode, args);
                  if ((childNode.name === 'text')) {
                      childNode.style.fontSize = childNode.style.fontSize || domTree.style.fontSize || 40;
                      childNode.style.height = childNode.style.fontSize;
                  }
                  this.renderTree(childNode, cssTree);
              });
              return domTree;
          };
          this.layoutTree = (renderTree) => {
              renderTree.style = {
                  width: document.documentElement.clientWidth
              };
              cssLayout(renderTree);
              return renderTree;
          };
          this.parse = () => {
              let parseConfig = {
                  attributeNamePrefix: "",
                  attrNodeName: "attr",
                  textNodeName: "#text",
                  ignoreAttributes: false,
                  ignoreNameSpace: true,
                  allowBooleanAttributes: true,
                  parseNodeValue: false,
                  parseAttributeValue: false,
                  trimValues: true,
                  parseTrueNumberOnly: false,
              };
              const { style, xml } = this.getTempCont();
              const xmlObj = Parser(xml, parseConfig, true);
              const cssObj = cssParser(style);
              return {
                  xmlObj,
                  cssObj
              };
          };
          this.renderElement = (tree) => {
              var _a;
              (_a = tree.children) === null || _a === void 0 ? void 0 : _a.map((child) => {
                  child.parent = tree;
                  if (!child.ele || this.shouldUpdate(child)) {
                      const ele = new mapElement[child.name](child);
                      child.setStyle = (cssobj) => { this.setStyle(child, cssobj); };
                      child.eventsFrie = ele.eventFrie;
                      child.on = (name, callback) => {
                          child[name] = callback;
                      };
                      ele.render(this.ctx);
                      child.ele = ele;
                  }
                  this.renderElement(child);
              });
          };
          this.shouldUpdate = (child) => {
              if (!child.ele) {
                  return true;
              }
              const { layout, style } = child;
              const cache = child.ele.cache;
              if (shallowEqual(Object.assign(Object.assign({}, layout), style), cache)) {
                  return false;
              }
              child.ele = null;
              child.setStyle = null;
              child.eventsFrie = null;
              child.on = null;
              return true;
          };
          this.setStyle = (child, cssobj) => {
              Object.assign(child.style, cssobj);
              schedule(() => {
                  this.repaintRender();
              });
          };
          this.getElementsById = (id) => {
              return _getElementsById(this.tree, [], id);
          };
          this.getElementsByClassName = (className) => {
              return _getElementsByClassName(this.tree, [], className);
          };
          this.init();
          const { xmlObj, cssObj } = this.parse();
          this.tree = this.renderTree(xmlObj, cssObj);
          this.touchMsg = {};
          this.initRender(true);
      }
      getChildByPos(tree, x, y, itemList) {
          let list = Object.keys(tree.children);
          for (let i = 0; i < list.length; i++) {
              const child = tree.children[list[i]];
              const { left: X, top: Y, width, height } = child.layout;
              if ((X <= x && x <= X + width) && (Y <= y && y <= Y + height)) {
                  itemList.push(child);
                  if (Object.keys(child.children).length) {
                      this.getChildByPos(child, x, y, itemList);
                  }
              }
          }
      }
      eventHandler(eventName) {
          return (e) => {
              var _a, _b, _c;
              const touch = (e.touches && e.touches[0]) || e;
              if (!touch || !touch.pageX || !touch.pageY) {
                  return;
              }
              if (!touch.timeStamp) {
                  touch.timeStamp = e.timeStamp;
              }
              const list = [];
              if (touch) {
                  this.getChildByPos(this.tree, touch.pageX, touch.pageY, list);
              }
              if (!list.length) {
                  list.push(this.tree);
              }
              const item = list[list.length - 1];
              if (eventName === 'touchstart' || eventName === 'touchend') {
                  this.touchMsg[eventName] = touch;
              }
              if (eventName === 'touchstart' && item) {
                  (_a = item.eventsFrie) === null || _a === void 0 ? void 0 : _a.call(item, e, eventName);
              }
              if ((eventName === 'touchend' && isClick(this.touchMsg)) && item) {
                  (_b = item.eventsFrie) === null || _b === void 0 ? void 0 : _b.call(item, e, eventName);
              }
              if (eventName === 'touchmove' && item) {
                  (_c = item.eventsFrie) === null || _c === void 0 ? void 0 : _c.call(item, e, eventName);
              }
          };
      }
      bindEvents() {
          document.ontouchstart = this.touchStart;
          document.ontouchmove = this.touchMove;
          document.onmouseup = this.touchEnd;
          document.onmouseleave = this.touchEnd;
      }
  }
  window.canvasRender = new CanvasRender();

}));
//# sourceMappingURL=index.js.map
