import { doesNotMatch, buildOptions, doesMatch, getAllMatches } from './util';
import {X2jOptionsOptional} from './type';

const defaultOptions = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  localeRange: 'a-zA-Z',
};

const props = ['allowBooleanAttributes', 'localeRange'];

export const validate = (xmlData: string, options: X2jOptionsOptional) => {
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
      } else {
        let closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        let tagName = '';
        for (
          ;
          i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r';
          i++
        ) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          continue;
        }
        if (!validateTagName(tagName, regxTagName)) {
          return {err: {code: 'InvalidTag', msg: 'Tag ' + tagName + ' is an invalid name.'}};
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return {err: {code: 'InvalidAttr', msg: 'Attributes for "' + tagName + '" have open quote.'}};
        }
        let attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options, regxAttrName);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            return isValid;
          }
        } else if (closingTag) {
          if(!result.tagClosed){
            return {
              err: {code: 'InvalidTag', msg: 'closing tag "' + tagName + "\" don't have proper closing."},
            };
          }else if (attrStr.trim().length > 0) {
            return {
              err: {code: 'InvalidTag', msg: 'closing tag "' + tagName + "\" can't have attributes or invalid starting."},
            };
          } else {
            const otg = tags.pop();
            if (tagName !== otg) {
              return {
                err: {code: 'InvalidTag', msg: 'closing tag ' + otg + ' is expected inplace of ' + tagName + '.'},
              };
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options, regxAttrName);
          if (isValid !== true) {
            return isValid;
          }
          tags.push(tagName);
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else {
              break;
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if (xmlData[i] === ' ' || xmlData[i] === '\t' || xmlData[i] === '\n' || xmlData[i] === '\r') {
        continue;
      }
      return {err: {code: 'InvalidChar', msg: 'char ' + xmlData[i] + ' is not expected .'}};
    }
  }

  if (!tagFound) {
    return {err: {code: 'InvalidXml', msg: 'Start tag expected.'}};
  } else if (tags.length > 0) {
    return {
      err: {code: 'InvalidXml', msg: 'Invalid ' + JSON.stringify(tags, null, 4).replace(/\r?\n/g, '') + ' found.'},
    };
  }

  return true;
};

/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData: string, i: number) {
  var start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      var tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return {err: {code: 'InvalidXml', msg: 'XML declaration allowed only at the start of the document.'}};
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}

function readCommentAndCDATA(xmlData: string, i: number) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === 'D' &&
    xmlData[i + 2] === 'O' &&
    xmlData[i + 3] === 'C' &&
    xmlData[i + 4] === 'T' &&
    xmlData[i + 5] === 'Y' &&
    xmlData[i + 6] === 'P' &&
    xmlData[i + 7] === 'E'
  ) {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === '[' &&
    xmlData[i + 2] === 'C' &&
    xmlData[i + 3] === 'D' &&
    xmlData[i + 4] === 'A' &&
    xmlData[i + 5] === 'T' &&
    xmlData[i + 6] === 'A' &&
    xmlData[i + 7] === '['
  ) {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }

  return i;
}

var doubleQuote = '"';
var singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData: string, i: number) {
  let attrStr = '';
  let startChar = '';
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
        //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
        continue;
      } else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
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

  return {value: attrStr, index: i, tagClosed: tagClosed};
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr: string, options: X2jOptionsOptional, regxAttrName: RegExp) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {} as any;

  for (let i = 0; i < matches.length; i++) {
    //console.log(matches[i]);

    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return {err: {code: 'InvalidAttr', msg: 'attribute ' + matches[i][2] + ' has no space in starting.'}};
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return {err: {code: 'InvalidAttr', msg: 'boolean attribute ' + matches[i][2] + ' is not allowed.'}};
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName, regxAttrName)) {
      return {err: {code: 'InvalidAttr', msg: 'attribute ' + attrName + ' is an invalid name.'}};
    }
    /*if (!attrNames.hasOwnProperty(attrName)) {*/
    if ( !Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return {err: {code: 'InvalidAttr', msg: 'attribute ' + attrName + ' is repeated.'}};
    }
  }

  return true;
}

function validateAttrName(attrName: string, regxAttrName: RegExp) {
  // const validAttrRegxp = new RegExp(regxAttrName);
  return doesMatch(attrName, regxAttrName);
}

function validateTagName(tagname: string, regxTagName: RegExp) {
  return !doesNotMatch(tagname, regxTagName);
}
