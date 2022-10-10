import Parser from './parser';
import {cssParser} from './cssParser';
import {ViewElement, TextElement} from './component';
import computeLayout from 'css-layout';

const StyleContReg = /<style[^>]*>(.|\n)*<\/style>/gi;
const DelStyleTagReg= /(<\/?style.*?>)/gi;

const mapElement = {
    view: ViewElement,
    text: TextElement
}

/**
 * 通过自定义标签+style+canvas 实现一款渲染器，也可以理解为一个超级超级超级简单的“浏览器”
 * 主要目的是为了绘制并渲染一套可交互式的 ui
 * 详见 README.md
 */
class CanvasRender {
    constructor(){
        this.init();
        const {xmlObj, cssObj} = this.parse();
        // 渲染树
        const renderTree = this.renderTree(xmlObj, cssObj);
        // 计算布局树 利用 css-layout(yoga) 布局引擎
        const layoutTree = this.layoutTree(renderTree);
        // 拿到布局树中间结构后，利用 canvas api 绘制不同组件，也可以迁移至其他平台绘制
        this.renderElement(layoutTree);
    }

    ctx: CanvasRenderingContext2D | null

    /**
     * 初始化 web根结点
     */
    init = () => {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        document.body.appendChild(canvas);
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * 获取模板内容：包含 css和xml
     * @returns {style: string, xmlCont: string}
     */
    getTempCont = () => {
        const temp: HTMLTemplateElement = document.getElementsByTagName('template')[0];
        const div: HTMLElement = document.createElement('tempDiv');
        div.appendChild( temp.content );
        const cont = div.innerHTML;
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
     * 渲染树
     * @param domTree 
     * @param cssTree 
     * @returns 
     */
    renderTree = (domTree: any, cssTree: any) => {
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
                }, {style:{}});

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
                    style: {},
                    'data-value': childNode['#text']
                })
            }

            Object.assign(childNode, args);
            this.renderTree(childNode, cssTree);
        });
        return domTree;
    }

    /**
     * 布局树
     * @param renderTree 
     * @returns 
     */
    layoutTree = (renderTree) => {
        computeLayout(renderTree)
        return renderTree;
    }

    /**
     * 编译出 domtree 和 cssobj
     * @returns {xmlObj, cssObj}
     */
    parse = () => {
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
        const xmlObj = Parser(xml, parseConfig, true);
        // csstree
        const cssObj = cssParser(style);
        return {
            xmlObj,
            cssObj
        }
    }

    /**
     * 遍历布局树渲染组件, 追加节点、父子关系
     */
    renderElement = (tree) => {
        tree.children?.map((child) => {
            child.parent = tree;
            const ele = new mapElement[child.name](child);
            ele.render(this.ctx);
            this.renderElement(child);
        })
    }
}

new CanvasRender();
