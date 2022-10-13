
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

export function isClick(touchMsg) {
    const start= touchMsg.touchstart;
    const end = touchMsg.touchend;
  
    if (!start
      || !end
      || !start.timeStamp
      || !end.timeStamp
      || start.pageX === undefined
      || start.pageY === undefined
      || end.pageX === undefined
      || end.pageY === undefined
    ) {
      return false;
    }
  
    const startPosX = start.pageX;
    const startPosY = start.pageY;
  
    const endPosX   = end.pageX;
    const endPosY   = end.pageY;
  
    const touchTimes = end.timeStamp - start.timeStamp;
  
    return !!(Math.abs(endPosY - startPosY) < 30
      && Math.abs(endPosX - startPosX) < 30
      && touchTimes < 300);
  }
  