import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  ShaderMaterial,
  DoubleSide
} from 'three'
import {Group} from '../../src/index'
import adaptiveBezierCurve from 'adaptive-bezier-curve'
import initLine2DGeometry from 'three-line-2d'
import strokeVertexShader from './strokeVertex.glsl'
import strokeFragmentShader from './strokeFragment.glsl'
import fillVertexShader from './fillVertex.glsl'
import fillFragmentShader from './fillFragment.glsl'

const Line2DGeometry = initLine2DGeometry({BufferAttribute, BufferGeometry})

// Given an array of y values, construct a smooth curve connecting those points.
function valuesToCurvePoints(values, totalWidth, totalHeight) {
  let p1 = []
  let c1 = []
  let c2 = []
  let p2 = []
  let maxValue = Math.max.apply(Math, values)
  let curveValues = []
  for (let i = 1; i < values.length; i++) {
    let xMult = totalWidth / (values.length - 1)
    let yMult = totalHeight / maxValue
    p1[0] = (i - 1) * xMult
    p1[1] = c1[1] = values[i - 1] * yMult
    c1[0] = c2[0] = (i - .5) * xMult
    c2[1] = p2[1] = values[i] * yMult
    p2[0] = i * xMult
    let segmentPoints = adaptiveBezierCurve(p1, c1, c2, p2)
    for (let j = (i === 1 ? 0 : 1); j < segmentPoints.length; j++) {
      curveValues.push(segmentPoints[j])
    }
  }
  return curveValues
}


// Facade for the curve.
export default class Curve extends Group {
  constructor(parent) {
    super(parent)

    // Use a single Line2D buffer geometry for both stroke and fill meshes
    let geometry = new Line2DGeometry()

    // Stroke mesh with custom shader material
    this.strokeMesh = new Mesh(geometry, new ShaderMaterial({
      uniforms: {
        thickness: {value: 1},
        color: {value: new Color()},
        opacity: {value: 1}
      },
      transparent: true,
      vertexShader: strokeVertexShader,
      fragmentShader: strokeFragmentShader,
      side: DoubleSide
    }))

    // Fill mesh with custom shader material
    this.fillMesh = new Mesh(geometry, new ShaderMaterial({
      uniforms: {
        color: {value: new Color()},
        opacity: {value: 1},
        gradientPercent: {value: 1},
        gradientFade: {value: 1}
      },
      transparent: true,
      vertexShader: fillVertexShader,
      fragmentShader: fillFragmentShader,
      side: DoubleSide
    }))

    // Add both meshes to the Group
    this.threeObject.add(this.strokeMesh, this.fillMesh)
  }

  afterUpdate() {
    // Update the shared geometry
    let geometry = this.strokeMesh.geometry
    geometry.update(valuesToCurvePoints(this.values, this.width, this.height))

    // Update the stroke mesh
    let hasStroke = this.strokeWidth && this.strokeColor && this.strokeOpacity > 0
    if (hasStroke) {
      let strokeUniforms = this.strokeMesh.material.uniforms
      strokeUniforms.color.value.set(this.strokeColor)
      strokeUniforms.opacity.value = this.strokeOpacity
      strokeUniforms.thickness.value = this.strokeWidth
    }
    this.strokeMesh.visible = !!hasStroke

    // Update the fill mesh
    let hasFill = this.fillColor && this.fillOpacity > 0
    if (hasFill) {
      let fillUniforms = this.fillMesh.material.uniforms
      fillUniforms.color.value.set(this.fillColor)
      fillUniforms.opacity.value = this.fillOpacity
      fillUniforms.gradientPercent.value = this.fillGradientPercent || 0
      fillUniforms.gradientFade.value = this.fillGradientFade || 1
    }
    this.fillMesh.visible = !!hasFill

    super.afterUpdate()
  }
}

// defaults
Object.assign(Curve.prototype, {
  width: 500,
  height: 100,
  strokeWidth: 2,
  strokeColor: 0xffffff,
  strokeOpacity: 1,
  fillColor: 0xffffff,
  fillOpacity: 0.5,
  fillGradientPercent: 1,
  fillGradientFade: 3
})