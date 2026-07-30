import { log } from '../utils/logger';

export function initCartToast(): () => void {
  log('cartToast', 'info', 'toast notifications handled by cartMediator');
  return () => {};
}
