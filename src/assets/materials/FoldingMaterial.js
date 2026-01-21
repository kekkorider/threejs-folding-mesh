import { Fn, uv, positionLocal, uniform, frontFacing, select, texture, rotate, length, smoothstep, sin, vec2, vec3, mix } from 'three/tsl'
import { MeshBasicNodeMaterial, DataTexture, DoubleSide } from 'three/webgpu'
import { easeInOutQuad } from 'tsl-easings'

const dummyTexture = new DataTexture(
  new Uint8Array([0, 0, 0, 0]),
  1, 1
)
dummyTexture.needsUpdate = true

export const map = texture(dummyTexture)
export const mapB = texture(dummyTexture)
export const FoldingMaterial = new MeshBasicNodeMaterial({
  side: DoubleSide,
  forceSinglePass: true,
})
export const progress = uniform(0.15)

const foldOne = Fn(() => {
  let pos = positionLocal.toVar()
  const jump = sin(progress.mul(Math.PI)).mul(0.25)

  const center = vec3(0, 0, 0)
  // const offset = uv().y.oneMinus()
  const offset = length(uv().sub(0.5)).mul(1.5)
  const smoothProgress = progress.sub(offset.mul(0.4)).div(0.6).clamp(0, 1)

  pos = rotate(pos.sub(center), vec3(easeInOutQuad(smoothProgress).mul(-Math.PI), 0, 0))
  pos = pos.add(center)
  pos.y.addAssign(jump)

  return pos
})

const foldTwo = Fn(() => {
  let pos = positionLocal.toVar()
  const radius = -0.8
  const center = vec3(0, 0, radius)

  let posSpherical = positionLocal.toVar()
  posSpherical = posSpherical.sub(center)
  posSpherical.yz = posSpherical.yz.normalize()

  const fastScale = smoothstep(0, 0.3, progress)
  const fastScaleBack = smoothstep(1, 0.7, progress)

  posSpherical = posSpherical.mul(vec3(0.5, 0.4, .65))
  posSpherical = rotate(posSpherical, vec3(easeInOutQuad(progress).mul(Math.PI * 2), 0, 0))

  // const finalPos = mix(pos, posSpherical, progress)
  const finalPos = mix(pos, posSpherical, fastScale.mul(fastScaleBack))

  return finalPos
})

FoldingMaterial.positionNode = Fn(() => {
  return foldOne()
})()

FoldingMaterial.colorNode = Fn(() => {
  const selectedUV = select(frontFacing, uv(), vec2(uv().x, uv().y.oneMinus()))

  const texA = texture(map, selectedUV)
  const texB = texture(mapB, selectedUV)

  return select(frontFacing, texA, texB)
})()
