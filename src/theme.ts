import { Platform } from 'react-native';

/** Identidade NutriScan: verde-floresta profundo + verde-folha vibrante sobre neutros quentes. */
export const c = {
  bg: '#F4F7F4', card: '#FFFFFF', ink: '#10261A', text: '#10261A', muted: '#6B7C72', border: '#E3EAE4',
  primary: '#0B6B3A', accent: '#34D27B', mint: '#E6F4EA',
  protein: '#0E9AA7', carbs: '#F2B134', fat: '#F2735B',
};
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const type = {
  title: { fontSize: 22, fontWeight: '800', color: c.ink, letterSpacing: -0.3 },
  section: { fontSize: 17, fontWeight: '700', color: c.ink },
  body: { fontSize: 15, color: c.ink },
  caption: { fontSize: 13, color: c.muted },
} as const;
export const shadow = Platform.select({
  ios: { shadowColor: '#0B3D22', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: { elevation: 3, shadowColor: '#0B3D22' },
})!;
export const MAX_W = 640; // limita largura em tablets
