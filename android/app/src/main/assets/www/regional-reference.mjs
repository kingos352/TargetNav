// Upgrade only the former disabled Turkey reference, never an imported custom grid.
export function upgradeRegionalReference(state, profile) {
  if (!profile?.grid?.provisional || state.competitionId !== profile.id) return false;
  if (state.grid && (state.grid.id !== profile.id || state.grid.shortReady !== false)) return false;
  state.grid = structuredClone(profile.grid);
  state.method = 'grid';
  return true;
}
