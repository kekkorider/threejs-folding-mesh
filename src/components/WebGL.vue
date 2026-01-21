<template>
	<canvas
		class="canvas"
		ref="canvas"
		:width="windowWidth"
		:height="windowHeight"
	/>
</template>

<script setup>
import { useTemplateRef, onMounted, nextTick, watch } from 'vue'
import {
	useWindowSize,
	useDevicePixelRatio,
	useUrlSearchParams,
	get,
} from '@vueuse/core'
import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls'

import { useGSAP } from '@/composables/useGSAP'
import { FoldingMaterial } from '@/assets/materials'
import { map as materialMap } from '@/assets/materials/FoldingMaterial'
import { textureLoader } from '@/assets/loaders'

const canvasRef = useTemplateRef('canvas')
let perfPanel, scene, camera, renderer, mesh, controls

const { width: windowWidth, height: windowHeight } = useWindowSize()
const { pixelRatio: dpr } = useDevicePixelRatio()
const params = useUrlSearchParams('history')

const { gsap } = useGSAP()

const textures = new Map()

//
// Lifecycle
//
onMounted(async () => {
	await nextTick()

	createScene()
	createCamera()
	await createRenderer()
	await loadTextures()

	createMesh()

	createControls()

	gsap.ticker.fps(60)

	if (Object.hasOwn(params, 'debug')) {
		await import('@/assets/Debug')

		if (!renderer.isWebGPURenderer) {
			const { ThreePerf } = await import('three-perf')

			perfPanel = new ThreePerf({
				anchorX: 'left',
				anchorY: 'top',
				domElement: document.body,
				renderer,
			})
		}
	}

	await gsap.delayedCall(0.5, () => {})

	gsap.ticker.add(time => {
		perfPanel?.begin()

		updateScene(time)
		renderer.render(scene, camera)

		perfPanel?.end()
	})
})

//
// Watchers
//
watch(dpr, value => {
	renderer.setPixelRatio(value)
})

watch([windowWidth, windowHeight], value => {
	camera.aspect = value[0] / value[1]
	camera.updateProjectionMatrix()

	renderer.setSize(value[0], value[1])
})

//
// Methods
//
function updateScene(time = 0) {
	controls?.update()
}

function createScene() {
	scene = new THREE.Scene()
}

function createCamera() {
	camera = new THREE.PerspectiveCamera(
		40,
		get(windowWidth) / get(windowHeight),
		0.1,
		100,
	)

	camera.position.set(0, 0, 4)
}

async function createRenderer() {
	renderer = new THREE.WebGPURenderer({
		canvas: get(canvasRef),
		alpha: true,
		antialias: true,
		powerPreference: 'high-performance',
	})

	renderer.setClearColor(0x121212, 1)
	renderer.setSize(get(windowWidth), get(windowHeight))

	if (Object.hasOwn(params, 'debug')) {
		const { Inspector } = await import('three/addons/inspector/Inspector')

		renderer.inspector = new Inspector()
	}

	await renderer.init()
}

async function loadTextures() {
	const texture = await textureLoader.load(
		'/pexels-anderson-alves-2158767102-35601549.jpg',
	)

	textures.set('map', texture)

	materialMap.value = textures.get('map')
}

function createControls() {
	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
}

function createMesh() {
	const geometry = new THREE.PlaneGeometry(1.28, 1.92, 10, 100)
	const material = FoldingMaterial

	mesh = new THREE.Mesh(geometry, material)

	scene.add(mesh)
}
</script>

<style scoped>
.canvas {
	height: 100dvh;
	width: 100dvw;
}
</style>
