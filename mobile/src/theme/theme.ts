import { DESIGN_TOKENS } from '@nocturne/shared';

// Mobile adaptation of Evreghen Command Center (DESIGN.md):
// dark frosted shell as frame, warm-neutral workspace, orange as signal.
export const theme = {
  colors: {
    ...DESIGN_TOKENS.colors,
    // shell = dark glass
    shell: 'rgba(0,0,0,0.70)',
    shellBorder: 'rgba(255,255,255,0.10)',
    onShell: '#FFFFFF',
    onShellMuted: 'rgba(255,255,255,0.70)',
    // surfaces inside shell stay dark for readability on phone
    surface: '#1C1917',
    surfaceSoft: '#292524',
    surfaceElevated: '#1C1917',
    onSurface: '#FAFAF9',
    onSurfaceMuted: '#B9B3AC',
    outline: '#44403C',
    outlineStrong: '#57534E',
  },
  spacing: DESIGN_TOKENS.spacing,
  rounded: DESIGN_TOKENS.rounded,
  type: DESIGN_TOKENS.typography,
} as const;

export type Theme = typeof theme;
