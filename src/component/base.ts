/**
 * 组件基础类
 */
export class BaseElement {
    props: any

    constructor(props) {
        this.props = props;

        const {layout} = this.props;
        let {left, top} = layout;

        // padding 计算误差校正
        layout.left = left + this.props.parent.layout.left;
        layout.top = top + this.props.parent.layout.top;
    }
}
