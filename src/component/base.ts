/**
 * 组件基础类
 */
export class BaseElement {
    props: any

    constructor(props) {
        this.props = props;

        const {layout, style, parent} = this.props;
        let {left, top} = layout;

        // padding 计算误差校正
        layout.left = left + parent.layout.left;
        layout.top = top + parent.layout.top;

        // 定位校正宽度
        if(style.position === 'absolute') {
            layout.width = parent.layout.width;
        }
    }

    eventFrie = (e) => {
        this.props.click?.(e);
        let p = this.props;
        while(p.parent) {
            p = p.parent;
            p.click?.(this.props);
        }
    }
}
