export class xmlNode {
  tagname: string;
  parent: any;
  child: any;
  attrsMap: any;
  children: any; 
  val: any;
  startIndex: number;

  constructor(tagname: string, parent?: any, val?: any){
    this.tagname = tagname;
    this.parent = parent;
    this.child = {}; //child tags
    this.attrsMap = {}; //attributes map
    this.children = [];
    this.val = val; //text only
    this.startIndex = 0;
  }
  addChild = (child: any) => {
    this.children.push(child);
    if (Array.isArray(this.child[child.tagname])) {
      this.child[child.tagname].push(child);
    } else {
      this.child[child.tagname] = [child];
    }
  };
}