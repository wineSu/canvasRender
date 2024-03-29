/**
 * 组件基础类
 */
export class BaseElement {
    props: any

    cache: any

    constructor(props) {
        this.props = props;

        const {layout, style, parent} = this.props;

        this.cache = {
            ...layout,
            ...style
        }


        let {left, top} = layout;

        // padding 计算误差校正
        layout.left = Math.floor(left + parent.layout.left);
        layout.top = top + parent.layout.top;

        // 定位校正宽度
        if(style.position === 'absolute') {
            layout.width = parent.layout.width;
        }
    }

    eventFrie = (e, eventName) => {
        this.props[eventName]?.(e);
        let p = this.props;
        while(p.parent) {
            p = p.parent;
            p[eventName]?.(this.props);
        }
    }
}
