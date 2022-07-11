import { isExist, isEmptyObject, merge } from './util';
import {ConvertToJson} from './type';

export const convertToJson:ConvertToJson = function (node, options) {
  const jObj = {
    name: node.tagname
  } as any;

  //when no child node or attr is present
  if (
    (!node.child || isEmptyObject(node.child)) &&
    (!node.attrsMap || isEmptyObject(node.attrsMap))
  ) {
    return isExist(node.val) && !!node.val ? node.val : jObj
  } else {
    //otherwise create a textnode if node has some text
    if (isExist(node.val)) {
      if (
        !(
          typeof node.val === 'string' &&
          (node.val === '' || node.val === options.cdataPositionChar)
        ) && options.textNodeName
      ) {
        if (options.arrayMode === 'strict') {
          jObj[options.textNodeName] = [node.val]
        } else {
          jObj[options.textNodeName] = node.val
        }
      }
    }
  }

  merge(jObj, node.attrsMap, options.arrayMode)

  jObj.children = []
  node.children.forEach((child: any) => {
    jObj.children.push(convertToJson(child, options))
  })

  return jObj
}
