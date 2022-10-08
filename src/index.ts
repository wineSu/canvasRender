import Parser from './parser/index';
import {cssParser} from './cssParser/index';

const StyleContReg = /<style[^>]*>(.|\n)*<\/style>/gi;
const DelStyleTagReg= /(<\/?style.*?>)/gi;

/**
 * 通过自定义标签+style+canvas 实现一款渲染器，也可以理解为一个超级超级超级简单的“浏览器”
 * 主要目的是为了绘制并渲染一套可交互式的 ui
 * 详见 README.md
 */
class CanvasRender {
    constructor(){
        this.init();
        this.parse();
    }

    // 初始化，利用 web 实现
    init = () => {
        const canvas:HTMLCanvasElement = document.createElement('canvas');
        document.body.appendChild(canvas);
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
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
        const xmlObj = Parser(xml, parseConfig, true);
        console.log(xmlObj)
        const cssObj = cssParser(style);
        console.log(cssObj, 111)
    }
}

new CanvasRender();