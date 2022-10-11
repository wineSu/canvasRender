import {BaseElement} from './base';

/**
 * 图片绘制
 */
export class ImageElement extends BaseElement {
    constructor(props) {
        super(props);
    }

    render = (ctx) => {
        const {layout, style} = this.props;
        let {left, right, top, bottom, width, height} = layout;
    
        ctx.clearRect(left, top, width, height);
        ctx.save();

        this.loadImg(this.props['data-src'], (img) => {
            ctx.drawImage(img, left, top, width, height);
        });
        
        ctx.restore();
    }

    loadImg = (src, fn) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            fn(image)
        }
    }
}
