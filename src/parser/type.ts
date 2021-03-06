export type X2jOptions = {
  attributeNamePrefix: string;
  attrNodeName: false | string;
  textNodeName: string;
  ignoreAttributes: boolean;
  ignoreNameSpace: boolean;
  allowBooleanAttributes: boolean;
  parseNodeValue: boolean;
  parseAttributeValue: boolean;
  arrayMode: boolean | 'strict';
  trimValues: boolean;
  cdataTagName: false | string;
  cdataPositionChar: string;
  localeRange:  string;
  parseTrueNumberOnly: boolean;
  tagValueProcessor: (tagValue: string, tagName: string) => string;
  attrValueProcessor: (attrValue: string, attrName: string) => string;
  stopNodes: string[];
};
export type X2jOptionsOptional = Partial<X2jOptions>;
type validationOptions = {
  allowBooleanAttributes: boolean;
  localeRange: string;
};
type validationOptionsOptional = Partial<validationOptions>;
export type J2xOptions = {
  attributeNamePrefix: string;
  attrNodeName: false | string;
  textNodeName: string;
  ignoreAttributes: boolean;
  cdataTagName: false | string;
  cdataPositionChar: string;
  format: boolean;
  indentBy: string;
  supressEmptyNode: boolean;
  tagValueProcessor: (tagValue: string) => string;
  attrValueProcessor: (attrValue: string) => string;
};
type J2xOptionsOptional = Partial<J2xOptions>;

type ESchema = string | object | Array<string|object>;

type ValidationError = {
  err: { code: string; msg: string };
};

export type parse = (xmlData: string, options?: X2jOptionsOptional, validationOptions?: validationOptionsOptional | boolean) => any;
export type convert2nimn = (
  node: any,
  e_schema: ESchema,
  options?: X2jOptionsOptional
) => any;
export type GetTraversalObj = (
  xmlData: string,
  options: X2jOptionsOptional
) => any;
export type ConvertToJson = (node: any, options: X2jOptionsOptional) => any;
export type convertToJsonString = (
  node: any,
  options?: X2jOptionsOptional
) => string;
export type validate = (
  xmlData: string,
  options?: validationOptionsOptional
) => true | ValidationError;
export type parseToNimn = (
  xmlData: string,
  schema: any,
  options: Partial<X2jOptions>
) => any;

export abstract class j2xParser {
  constructor(options: J2xOptionsOptional){};
  abstract parse(options: any): any;
}