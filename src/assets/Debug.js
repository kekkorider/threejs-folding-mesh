import { Pane } from 'tweakpane'

import { progress } from '@/assets/materials/FoldingMaterial'

const pane = new Pane({
  container: document.getElementById('tweakpane-container'),
})

pane.addBinding(progress, 'value', { label: 'Progress', min: 0, max: 1, step: 0.01 })
