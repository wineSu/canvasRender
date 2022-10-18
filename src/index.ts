import Parser from './parser';
import {cssParser} from './cssParser';
import {ViewElement, TextElement, ImageElement, MapElement} from './component';
import computeLayout from 'css-layout';
import {_getElementsById, _getElementsByClassName, isClick} from './api';
import {schedule} from './schedule';
import {shallowEqual} from './util';

interface mapElement {
    view: typeof ViewElement;
    text: typeof TextElement;
    images: typeof ImageElement;
    map: typeof MapElement;
}

type StringResult = () => {
    style: string,
    xml: string
}

interface XmlObj {
    children: any;
    lastLayout?: any;
    layout?: any;
    name: string;
    shouldUpdate?: boolean;
    style: any
}

type Params = {
    [key: string]: string;
}

type CssObj = Record<string, Params>;

type ParseResult = () => {
    xmlObj: XmlObj,
    cssObj: CssObj
}

const StyleContReg: RegExp = /<style[^>]*>(.|\n)*<\/style>/gi;
const DelStyleTagReg: RegExp = /(<\/?style.*?>)/gi;

const mapElement: mapElement = {
    view: ViewElement,
    text: TextElement,
    images: ImageElement,
    map: MapElement
}

/**
 * 通过自定义DSL标签+style+canvas 实现一款渲染器，也可以理解为一个超级超级超级简单的“浏览器”
 * 主要目的是为了绘制并渲染一套可交互式的 ui
 * 详见 README.md
 */
class CanvasRender {
    constructor(){
        this.init();
        const {xmlObj, cssObj} = this.parse();
        // 渲染树
        this.tree = this.renderTree(xmlObj, cssObj);
        this.touchMsg = {};
        this.initRender(true);
    }

    private ctx: CanvasRenderingContext2D | null
    private tree: any

    // 事件相关
    private touchStart: (e: MouseEvent | TouchEvent) => void
    private touchEnd: (e: MouseEvent) => void
    private touchMove: (e: TouchEvent) => void
    private touchMsg: {
        [key: string]: MouseEvent
    }

    /**
     * 初始化 web根结点
     */
    private init = () => {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        document.body.appendChild(canvas);
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
        this.ctx = canvas.getContext('2d');

        this.touchStart = this.eventHandler('touchstart');
        this.touchEnd = this.eventHandler('touchend');
        this.touchMove = this.eventHandler('touchmove');
    }

    /**
     * 获取模板内容：包含 css和xml
     * @returns {style: string, xmlCont: string}
     */
    private getTempCont: StringResult = () => {
        const temp: HTMLTemplateElement = document.getElementsByTagName('template')[0];
        const div: HTMLElement = document.createElement('tempDiv');
        div.appendChild( temp.content );
        const cont = div.innerHTML;
        // todo 增加script解析，实现一套渲染钩子
        div.parentNode?.removeChild(div);
        // 将style和xml拆分开
        const res = {
            style: '',
            xml: ''
        }
        res.xml = cont.replace(StyleContReg, (css) => {
            res.style = css.replace(DelStyleTagReg, '')
            return '';
        });
        return res;
    }

    /**
     * 初始绘制
     */
    private initRender = (frist) => {
        // 计算布局树 利用 css-layout(yoga) 布局引擎
        const layoutTree = this.layoutTree(this.tree);
        // 拿到布局树中间结构后，利用 canvas api 绘制不同组件，也可以迁移至其他平台绘制
        this.renderElement(layoutTree);

        frist && this.bindEvents();
    }

    /**
     * 重绘 & 回流
     */
    private repaintRender = () => {
        this.resetLayoutData(this.tree);
        this.initRender(false);
    }

    /**
     * layout 数据重置，再次计算布局树
     * @param renderTree 
     */
    private resetLayoutData = (renderTree) => {
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
        renderTree.children?.map((child) => {
            this.resetLayoutData(child);
        });
        return renderTree;
    }

    /**
     * 渲染树
     * @param domTree 
     * @param cssTree 
     * @returns 
     */
    private renderTree = (domTree: any, cssTree: any) => {
        let children = domTree.children || [];

        // 递归处理
        children.forEach((childNode: any) => {
            let attr = childNode.attr || {};
            const id = attr.id || '';
            // 合并样式和dom节点
            const args = Object.keys(attr)
                .reduce((obj: any, key) => {
                    const value = attr[key];
                    const attribute = `data-${key}`;

                    if (key === 'id' ) {
                        obj.style = Object.assign(obj.style, cssTree[id] || {})
                        return obj
                    }

                    if (key === 'class') {
                        obj.style = value.split(/\s+/).reduce((res: any, oneClass: any) => {
                            return Object.assign(res, cssTree[oneClass])
                        }, obj.style)

                        return obj
                    }
                    
                    // 属性值
                    if (value === 'true') {
                        obj[attribute] = true
                    } else if (value === 'false') {
                        obj[attribute] = false
                    } else {
                        obj[attribute] = value
                    }

                    return obj;
                }, {style:childNode.style || {}});

            args.idName = id;
            args.className = attr.class || '';

            // 部分属性继承
            const {background, color} = domTree.style || {};
            if(background || color) {
                args.style = {
                    background,
                    color,
                    ...args.style
                }
            }

            if(childNode['#text']) {
                childNode.children.push({
                    name: 'text',
                    style: {
                        height: 40,
                    },
                    'data-value': childNode['#text']
                })
            }

            Object.assign(childNode, args);

            if((childNode.name === 'text')) {
                childNode.style.fontSize = childNode.style.fontSize || domTree.style.fontSize ||40;
                childNode.style.height = childNode.style.fontSize;
            }

            this.renderTree(childNode, cssTree);
        });
        return domTree;
    }

    /**
     * 布局树
     * @param renderTree 
     * @returns 
     */
    private layoutTree = (renderTree) => {
        // 修正下最外部盒子宽度，方便后续子元素 flex 设置
        renderTree.style = {
            width: document.documentElement.clientWidth
        }
        computeLayout(renderTree);
        return renderTree;
    }

    /**
     * 编译出 domtree 和 cssobj
     * @returns {xmlObj, cssObj}
     */
    private parse: ParseResult = () => {
        let parseConfig = {
            attributeNamePrefix : "",
            attrNodeName: "attr", //default is 'false'
            textNodeName : "#text",
            ignoreAttributes : false,
            ignoreNameSpace : true,
            allowBooleanAttributes : true,
            parseNodeValue : false,
            parseAttributeValue : false,
            trimValues: true,
            parseTrueNumberOnly: false,
        };
        const {style, xml} = this.getTempCont();
        // dom 树获取
        const xmlObj: XmlObj = Parser(xml, parseConfig, true);
        // csstree
        const cssObj: CssObj = cssParser(style);
        return {
            xmlObj,
            cssObj
        }
    }

    /**
     * 遍历布局树渲染组件, 追加节点、父子关系
     */
    private renderElement = (tree) => {
        tree.children?.map((child) => {
            child.parent = tree;
            
            if(!child.ele || this.shouldUpdate(child)) {
                const ele = new mapElement[child.name](child);
                
                child.setStyle = (cssobj) => {this.setStyle(child, cssobj)};
                child.eventsFrie = ele.eventFrie;
                child.on = (name, callback) => {
                    child[name] = callback;
                }
                
                ele.render(this.ctx);
                child.ele = ele;
            }
            this.renderElement(child);
        })
    }

    private shouldUpdate = (child) => {
        // 初次渲染
        if(!child.ele) {
            return true;
        }

        const {layout, style} = child;
        const cache = child.ele.cache;

        if(shallowEqual({
            ...layout,
            ...style
        }, cache)) {
            return false;
        }

        child.ele = null;
        child.setStyle = null;
        child.eventsFrie = null;
        child.on = null;

        return true;
    }

    /**
     * 样式外部设置
     * @param child 
     * @param cssobj 
     */
    private setStyle = (child, cssobj) => {
        Object.assign(child.style, cssobj)
        // 批量更新
        schedule(() => {
            this.repaintRender();
        });
    }

    /**
     * id 选择
     * @param id 
     * @returns 
     */
    public getElementsById = (id) => {
        return _getElementsById(this.tree, [], id);
    }
    
    /**
     * class 选择
     * @param className 
     * @returns 
     */
    public getElementsByClassName = (className) => {
        return _getElementsByClassName(this.tree, [], className);
    }

    private getChildByPos(tree, x, y, itemList) {
        let list = Object.keys(tree.children);
    
        for ( let i = 0; i < list.length;i++ ) {
            const child = tree.children[list[i]];
            const {left: X, top: Y, width, height} = child.layout;

            if (( X <= x && x <= X + width) && ( Y <= y && y <= Y + height )) {
                itemList.push(child);
                if ( Object.keys(child.children).length ) {
                    this.getChildByPos(child, x, y, itemList);
                } 
            }
        }
    }

    private eventHandler(eventName) {
        return (e) => {
            const touch = (e.touches && e.touches[0]) || e;

            if ( !touch || !touch.pageX || !touch.pageY ) {
                return;
            }

            if ( !touch.timeStamp )  {
                touch.timeStamp = e.timeStamp;
            }
        
            const list: any[] = [];
            if (touch) {
                this.getChildByPos(this.tree, touch.pageX, touch.pageY, list);
            }

            if (!list.length) {
                list.push(this.tree);
            }

            const item = list[list.length - 1];
            if ( eventName === 'touchstart' || eventName === 'touchend' ) {
                this.touchMsg[eventName] = touch;
            }

            if (eventName === 'touchstart' && item) {
                item.eventsFrie?.(e, eventName);
            }
            
            if ((eventName === 'touchend' && isClick(this.touchMsg)) && item) {
                item.eventsFrie?.(e, eventName);
            }

            if (eventName === 'touchmove' && item) {
                item.eventsFrie?.(e, eventName);
            }
        }
    }

    /**
     * 事件绑定
     * @returns 
     */
    private bindEvents() {
        document.ontouchstart = this.touchStart;
        document.ontouchmove  = this.touchMove;
        document.onmouseup    = this.touchEnd;
        document.onmouseleave = this.touchEnd;
    }
}

(window as any).canvasRender = new CanvasRender();
