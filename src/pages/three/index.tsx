import { DepthScreen } from '../../components/ARContent/depthScreen';
import { ARHitTest } from '../../components/ARHitTest';
import { ARScene } from '../../packages/webar/ARScene';

function App() {
  return (
    <ARScene>
      {/* <DepthScreen /> */}
      <ARHitTest />
    </ARScene>
  );
}

export default App;
