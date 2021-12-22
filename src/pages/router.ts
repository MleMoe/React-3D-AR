import Index from './index';
import About from './about';
import FaceMesh from './face-mesh';
import ThreeApp from './three';
import VisApp from './visualization';

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
    path: '/vis',
    component: VisApp,
  },
];

export { routes };
