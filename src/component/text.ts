import {BaseElement} from './base';

/**
 * 文本绘制
 */
export class TextElement extends BaseElement {
    constructor(props) {
        super(props);
    }

    render = (ctx: CanvasRenderingContext2D) => {
        const {layout, style} = this.props;
        let {left, right, top, bottom, width, height} = layout;

        ctx.clearRect(left, top, width, height);
        ctx.save();

        if ( style.background ) {
            ctx.fillStyle = style.background;
            ctx.fillRect(left, top, width, height);
        }

        ctx.font = `${style.fontSize || 40}px "微软雅黑"`;
        ctx.fillStyle = `${style.color || 'black'}`;
        ctx.textBaseline = 'top';
        const text = this.props['data-value'];

        this.drawText(ctx, text, layout)
        ctx.restore();
    }

    drawText = (ctx, text, layout) => {
        let textWidth = 0;
        let startIndex = 0;
        let line = 0;
        for (let i = 0, len = text.length; i < len; i++) {
            textWidth += ctx.measureText(text[i]).width;
            if(textWidth > layout.width) {
                ctx.fillText(
                    text.substring(startIndex, i),
                    layout.left,
                    layout.top + line * layout.height + (line > 0 ? 10 : 0)
                );
                startIndex = i;
                textWidth = 0;
                line ++;
            } else {
                if(i === len - 1) {
                    ctx.fillText(
                        text.substring(startIndex, i + 1),
                        layout.left,
                        layout.top + line * layout.height + (line > 0 ? 10 : 0)
                    );
                }
            }
        }
    }
}
