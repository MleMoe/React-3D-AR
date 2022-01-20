import Index from './index';
import About from './about';
import FaceMesh from './face-mesh';
import ThreeApp from './three';
import VisApp from './visualization';
import { ARGO } from './ar-go';

const routes = [
  {
    path: '/',
    component: ARGO,
  },
  {
    path: '/three',
    component: ThreeApp,
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
