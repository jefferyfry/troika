import { extendAsFlexNode, Object3DFacade } from '../../src/index'
import { Mesh, MeshStandardMaterial, SphereBufferGeometry, TextureLoader } from 'three'


class FlexboxGlobe extends Object3DFacade {
  constructor(parent) {
    super(parent, new Mesh(
      new SphereBufferGeometry(0.5, 64, 64),
      new MeshStandardMaterial({
        map: new TextureLoader().load('globe/texture_day.jpg')
      })
    ))
  }

  afterUpdate() {
    this.threeObject.visible = this.offsetWidth != null

    // Center the globe within the layed out box
    this.x = this.offsetLeft + this.offsetWidth / 2
    this.y = -(this.offsetTop + this.offsetHeight / 2)
    this.scaleX = this.scaleY = this.scaleZ = Math.min(this.clientWidth, this.clientHeight)
    super.afterUpdate()
  }
}

export default extendAsFlexNode(FlexboxGlobe)
