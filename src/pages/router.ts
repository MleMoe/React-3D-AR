import Index from './index';
import About from './about';
import FaceMesh from './face-mesh';

const routes = [
  {
    path: '/',
    component: Index,
  },
  {
    path: '/about',
    component: About,
  },
  {
    path: '/face-mesh',
    component: FaceMesh,
  },
];

export { routes };
