import Index from './index'
import About from './about'
import FaceMesh from './face-mesh'
import ThreeApp from './three'
import VisApp from './visualization'
import { ARGO } from './ar-go'
import DataApp from './data-analysis'

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
  {
    path: '/data',
    component: DataApp,
  },
]

export { routes }
