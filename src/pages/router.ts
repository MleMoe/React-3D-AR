import Index from './index';
import About from './about';
import FaceMesh from './face-mesh';
import ThreeApp from './three';

const routes = [
  {
    path: '/',
    component: ThreeApp,
  },
  {
    path: '/about',
    component: About,
  },
  {
    path: '/face-mesh',
    component: FaceMesh,
  },
  {
    path: '/three',
    component: ThreeApp,
  },
];

export { routes };
