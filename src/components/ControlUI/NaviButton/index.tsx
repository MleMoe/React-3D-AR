import { FC } from 'react';
import './index.scss';

type NaviButtonProps = {
  onClick?: (...args: any[]) => void;
};
export const NaviButton: FC<NaviButtonProps> = ({ children }) => {
  return (
    <button className='button-navi'>
      <svg
        viewBox='0 0 1024 1024'
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='22'
        height='22'
      >
        {children}
      </svg>
    </button>
  );
};
