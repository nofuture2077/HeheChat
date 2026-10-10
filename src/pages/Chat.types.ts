import { ReactComponentLike } from 'prop-types';

export type OverlayDrawer = {
  name: string;
  component: ReactComponentLike;
  position: 'bottom' | 'left' | 'right' | 'top';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  props?: any;
};
