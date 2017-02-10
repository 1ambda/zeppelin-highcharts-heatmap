import Visualization from 'zeppelin-vis'
import PassthroughTransformation from 'zeppelin-tabledata/passthrough'

export default class helloworld extends Visualization {
    constructor(targetElem, config) {
        super(targetElem, config)
        this.passthrough = new PassthroughTransformation(config)
    }

    render(tableData) {
        this.targetElem.html('Hello world!')
    }

    getTransformation() {
        return this.passthrough
    }
}