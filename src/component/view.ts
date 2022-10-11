export class ViewElement {
    constructor(props) {
        this.props = props;
    }

    props: any
    
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
