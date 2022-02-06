import { ARHitTest } from '../../packages/webar/components/ARHitTest';
import { ARScene } from '../../packages/webar/ARScene';
import { DepthScreen } from '../../packages/webar/components/DepthScreen';

function App() {
  return (
    <ARScene>
      {/* <DepthScreen /> */}
      <ARHitTest />
    </ARScene>
  );
}

export default App;
