import React from 'react';
import { Link } from 'react-router-dom';
import { routes as routesList } from '../router';
import './index.scss';

export default function Index() {
  return (
    <div className='menu-container'>
      <div>
        {routesList.map((route, index) => (
          <div key={index}>
            <Link to={route.path}>{route.path}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
