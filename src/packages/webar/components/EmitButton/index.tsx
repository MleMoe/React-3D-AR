import { ButtonHTMLAttributes, FC, HTMLAttributes, ReactNode } from 'react';
import { Observer } from '../../../three-react/observer';
import './index.scss';

type PlaceButtonProps = {
  type: string;
  svgNode: ReactNode;
  uiObserver: Observer;
} & HTMLAttributes<any>;
export const EmitButton: FC<PlaceButtonProps> = ({
  type,
  svgNode,
  uiObserver,
  className,
  onClick,
  ...rest
}) => {
  return (
    <button
      className={'button-place ' + className ?? ''}
      onClick={(event) => {
        uiObserver?.emit(type);
        onClick?.(event);
      }}
    >
      {svgNode}
    </button>
  );
};
