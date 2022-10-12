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
        let {left, right, top, bottom, width, height} = layout;
        left = Math.floor(left);
        ctx.clearRect(left, top, width, height);
        ctx.save();

        if ( style.background ) {
            ctx.fillStyle = style.background;
            if(style.borderRadius) {
                this.drawRoundRect(ctx, style.borderRadius, left, top, width, height)
            } else {
                ctx.fillRect(left, top, width, height);
            }
        }

        ctx.restore();
    }

    drawRoundRect = (ctx, r, x, y, w, h) => {
        ctx.save();
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.clip();
        ctx.fillRect(x, y, w, h);
    }
}
