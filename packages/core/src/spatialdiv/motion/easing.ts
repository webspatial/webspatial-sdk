import type { TimingFunction } from '../../types/animation'

/** Map normalized linear progress [0,1] to eased progress. */
export function applyEasing(t: number, easing: TimingFunction): number {
  const x = Math.min(1, Math.max(0, t))
  switch (easing) {
    case 'linear':
      return x
    case 'easeIn':
      return x * x * x
    case 'easeOut': {
      const u = 1 - x
      return 1 - u * u * u
    }
    case 'easeInOut':
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    default:
      return x
  }
}
