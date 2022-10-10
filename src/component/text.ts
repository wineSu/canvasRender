export class TextElement {
    constructor(props) {
        this.props = props;
    }

    props: any
    
    render = () => {
        console.log('text', this.props)
    }
}
