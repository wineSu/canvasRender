import {parse, X2jOptionsOptional} from './type';
import {convertToJson} from './node2json';
import {getTraversalObj, defaultOptions, props} from './xmlstr2xmlnode';
import {buildOptions} from './util';
import {validate} from './validator';

const Parser:parse = (xmlData, options, validationOption) => {
   if( validationOption){
     if(validationOption === true) validationOption = {}

     const result = validate(xmlData, validationOption);
     if (result !== true) {
       throw Error( result.err.msg)
     }
   }
  const newOption: X2jOptionsOptional = buildOptions(options, defaultOptions, props);
  return convertToJson(getTraversalObj(xmlData, newOption), newOption);
};

export default Parser;