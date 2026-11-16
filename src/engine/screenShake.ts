export interface ScreenShakeState {
  intensity: number;
  duration: number;
  elapsed: number;
}

export function createScreenShakeState(): ScreenShakeState {
  return {
    intensity: 0,
    duration: 0,
    elapsed: 0,
  };
}

export function triggerScreenShakeState(
  state: ScreenShakeState,
  intensity: number,
  duration: number,
): void {
  if (intensity <= 0 || duration <= 0) return;
  const remainingRatio =
    state.duration > 0 ? Math.max(0, 1 - state.elapsed / state.duration) : 0;
  const currentEffective = state.intensity * remainingRatio;
  if (intensity >= currentEffective) {
    state.intensity = Math.min(7, intensity);
    state.duration = duration;
    state.elapsed = 0;
  }
}

export function stepScreenShakeState(state: ScreenShakeState, dt: number): void {
  if (state.duration <= 0 || state.intensity <= 0) return;
  state.elapsed += Math.max(0, dt);
  if (state.elapsed >= state.duration) {
    state.intensity = 0;
    state.duration = 0;
    state.elapsed = 0;
  }
}

export function sampleScreenShakeOffset(
  state: ScreenShakeState,
  timeSeconds: number,
): { x: number; y: number } {
  if (state.duration <= 0 || state.intensity <= 0) {
    return { x: 0, y: 0 };
  }
  const progress = Math.min(1, Math.max(0, state.elapsed / state.duration));
  const decay = (1 - progress) * (1 - progress);
  const amp = state.intensity * decay;
  if (amp < 0.08) {
    return { x: 0, y: 0 };
  }
  const x = Math.round(Math.sin(timeSeconds * 57.3) * amp);
  const y = Math.round(Math.cos(timeSeconds * 68.7 + 1.1) * amp * 0.85);
  return { x, y };
}
