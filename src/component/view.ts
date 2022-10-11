import {BaseElement} from './base';

/**
 * 盒子绘制
 */
export class ViewElement extends BaseElement{
    constructor(props) {
        super(props)
    }

    render = (ctx) => {
        const {layout, style} = this.props;
        const {left, right, top, bottom, width, height} = layout;
        ctx.clearRect(left, top, width, height);
        ctx.save();

        if ( style.background ) {
            ctx.fillStyle = style.background;
            ctx.fillRect(left, top, width, height);
        }

        ctx.restore();
    }
}
