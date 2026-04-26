/**
 * Brand tokens for transactional emails.
 *
 * Sampled from the bread icon — the email palette intentionally uses warmer
 * tones than pure neutrals. Two reasons:
 *
 * 1) Brand consistency. The site is set in warm cream/orange; emails should
 *    feel like they came from the same place.
 * 2) Dark-mode survival. Apple Mail and Gmail mobile auto-invert based on
 *    pixel sampling. Pure black/white surfaces get inverted hardest and look
 *    harsh. Warm near-blacks invert to soft creams that still read fine.
 *
 * Keep in mind: Outlook desktop strips most of this anyway. Test across
 * clients before assuming colors render.
 */
export const brand = {
  // Brand crust palette — sampled from the bread icon
  crust: '#E07F14', // primary — CTAs
  crustDeep: '#AC5811', // accent — wordmark, hyperlinks (warmer than crust, less saturated)
  golden: '#F5B03E', // unused for text (insufficient contrast); reserved for decorative accents

  // Ink (text) — warm tones, not pure black/gray
  ink: '#2A1F14', // body — warm near-black
  inkMuted: '#6B5A47', // secondary — warm mid-gray
  inkSubtle: '#9C8B78', // captions, footer fine print

  // Surfaces — bread crumb palette
  surface: '#FFFFFF', // card background
  surfaceRaised: '#FFF7E8', // page background — Crumb light
  surfaceOverlay: '#FFEBCA', // inset blocks — Crumb

  // Header — matches website nav
  headerBg: '#3D2817', // dark brown background
  headerText: '#FFFFFF', // white text & icon

  // Lines
  border: '#E8DDC8', // warm subtle border on cream

  // Status (kept neutral; not brand-tinted to preserve readability)
  success: '#0F7A45',
  successBg: '#E8F5EE',
  warn: '#A65A0A',
  warnBg: '#FBF1E1',
  danger: '#B42318',
  dangerBg: '#FBEAE7',
} as const;
