import { ARHitTest } from '../../packages/coil-ar/components/ARHitTest'
import { ARScene } from '../../packages/coil-ar/ARScene'
import { DepthScreen } from '../../packages/coil-ar/components/DepthScreen'

function App() {
  return (
    <ARScene>
      {/* <DepthScreen /> */}
      <ARHitTest />
    </ARScene>
  )
}

export default App
