
export function _getElementsById(tree, list = [] as any, id) {
    Object.keys(tree.children).forEach(key => {
      const child = tree.children[key];
  
      if ( child.idName === id ) {
        list.push(child);
      }
  
      if ( Object.keys(child.children).length ) {
        _getElementsById(child, list, id);
      }
    });
  
    return list;
}
  
export function _getElementsByClassName(tree, list = [] as any, className) {
    Object.keys(tree.children).forEach(key => {
      const child = tree.children[key];
  
      if ( child.className.split(/\s+/).indexOf(className) > -1 ) {
        list.push(child);
      }
  
      if ( Object.keys(child.children).length ) {
        _getElementsByClassName(child, list, className);
      }
    });
  
    return list;
}
