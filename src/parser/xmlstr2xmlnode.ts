import { getValue, buildOptions, isExist, getAllMatches } from './util';
import {xmlNode} from './xmlNode';
import {X2jOptionsOptional, GetTraversalObj} from './type';

const TagType = {OPENING: 1, CLOSING: 2, SELF: 3, CDATA: 4};
let regx =
  '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|(([\\w:\\-._]*:)?([\\w:\\-._]+))([^>]*)>|((\\/)(([\\w:\\-._]*:)?([\\w:\\-._]+))\\s*>))([^<]*)';

//polyfill
if (!Number.parseInt && window.parseInt) {
  Number.parseInt = window.parseInt;
}
if (!Number.parseFloat && window.parseFloat) {
  Number.parseFloat = window.parseFloat;
}

export const defaultOptions: X2jOptionsOptional  = {
  attributeNamePrefix: '@_',
  attrNodeName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false, //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseNodeValue: true,
  parseAttributeValue: false,
  arrayMode: false,
  trimValues: true, //Trim string values of tag and attributes
  cdataTagName: false,
  cdataPositionChar: '\\c',
  localeRange: '',
  tagValueProcessor: function(a) {
    return a;
  },
  attrValueProcessor: function(a) {
    return a;
  },
  stopNodes: []
  //decodeStrict: false,
};

export const props = [
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

export const getTraversalObj:GetTraversalObj = function(xmlData, options) {
  xmlData = xmlData.replace(/<!--[\s\S]*?-->/g, ''); //Remove  comments

  const xmlObj = new xmlNode('canvas-xml');
  let currentNode = xmlObj;

  regx = regx.replace(/\[\\w/g, '[' + options.localeRange + '\\w');
  const tagsRegx = new RegExp(regx, 'g');
  let tag = tagsRegx.exec(xmlData);
  let nextTag = tagsRegx.exec(xmlData);
  while (tag) {
    const tagType = checkForTagType(tag);

    if (tagType === TagType.CLOSING) {
      //add parsed data to parent node
      if (currentNode.parent && tag[14]) {
        currentNode.parent.val = getValue(currentNode.parent.val) + '' + processTagValue(tag, options, currentNode.parent.tagname);
      }
      if (options.stopNodes?.length && options.stopNodes.includes(currentNode.tagname)) {
        currentNode.child = []
        if (currentNode.attrsMap == undefined) { currentNode.attrsMap = {}}
        currentNode.val = xmlData.substr(currentNode.startIndex + 1, tag.index - currentNode.startIndex - 1)
      }
      currentNode = currentNode.parent;
    } else if (tagType === TagType.SELF) {
      if (currentNode && tag[14]) {
        currentNode.val = getValue(currentNode.val) + '' + processTagValue(tag, options);
      }

      const childNode = new xmlNode(options.ignoreNameSpace ? tag[7] : tag[5], currentNode, '');
      if (tag[8] && tag[8].length > 0) {
        tag[8] = tag[8].substr(0, tag[8].length - 1);
      }
      childNode.attrsMap = buildAttributesMap(tag[8], options);
      currentNode.addChild(childNode);
    } else {
      //TagType.OPENING
      const childNode = new xmlNode(
        options.ignoreNameSpace ? tag[7] : tag[5],
        currentNode,
        processTagValue(tag, options)
      );
      if (options.stopNodes?.length && options.stopNodes.includes(childNode.tagname)) {
        childNode.startIndex=tag.index + tag[1].length
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

function processTagValue(parsedTags: any, options: any, parentTagName?: string) {
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

function checkForTagType(match: any) {
  if (match[10] === '/') {
    return TagType.CLOSING;
  } else if (typeof match[8] !== 'undefined' && match[8].substr(match[8].length - 1) === '/') {
    return TagType.SELF;
  } else {
    return TagType.OPENING;
  }
}

function resolveNameSpace(tagname: any, options: X2jOptionsOptional) {
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

function parseValue(val: string, shouldParse: boolean, parseTrueNumberOnly: boolean) {
  if (shouldParse && typeof val === 'string') {
    let parsed;
    if (val.trim() === '' || isNaN(val as any)) {
      parsed = val === 'true' ? true : val === 'false' ? false : val;
    } else {
      if (val.indexOf('0x') !== -1) {
        //support hexa decimal
        parsed = Number.parseInt(val, 16);
      } else if (val.indexOf('.') !== -1) {
        parsed = Number.parseFloat(val);
      } else {
        parsed = Number.parseInt(val, 10);
      }
      if (parseTrueNumberOnly) {
        parsed = String(parsed) === val ? parsed : val;
      }
    }
    return parsed;
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}

const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?', 'g');

function buildAttributesMap(attrStr: string, options: any) {
  if (!options.ignoreAttributes && typeof attrStr === 'string') {
    attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {} as any;
    for (let i = 0; i < len; i++) {
      const attrName = resolveNameSpace(matches[i][1], options);
      if (attrName.length) {
        if (matches[i][4] !== undefined) {
          if (options.trimValues) {
            matches[i][4] = matches[i][4].trim();
          }
          matches[i][4] = options.attrValueProcessor(matches[i][4], attrName);
          attrs[options.attributeNamePrefix + attrName] = parseValue(
            matches[i][4],
            options.parseAttributeValue,
            options.parseTrueNumberOnly
          );
        } else if (options.allowBooleanAttributes) {
          attrs[options.attributeNamePrefix + attrName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (options.attrNodeName) {
      const attrCollection = {} as any;
      attrCollection[options.attrNodeName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
