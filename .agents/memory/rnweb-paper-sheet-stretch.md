---
name: RN Web paper-sheet stretch
description: Why variable-height paper sheets must use a CSS background, not an absoluteFill stretched Image, on React Native Web.
---

# RN Web paper-sheet stretch

On React Native Web, an `<Image resizeMode="stretch">` placed with `StyleSheet.absoluteFill` (inset:0) inside a content-sized container does NOT stretch a large PNG to the content box — the replaced `<img>` renders at its **intrinsic** size and overflows. With `overflow:visible` on the container it bleeds over sibling blocks below it.

**Why:** This was invisible for the original small textures (e.g. paper_main 310×250) because intrinsic ≈ content, so the latent overflow was tiny. It became severe when large textures were introduced (sheet_gradient 736×423, sheet_cutout 568×442): a ~180px favorite card's gradient bled ~240px down and painted dark sibling text on brown; cutout sections failed to cover their lower rows.

**How to apply:** For any paper sheet whose height is driven by variable content, render the texture as a CSS background on web instead of an Image:
- `webStyle({ backgroundImage: 'url("<uri>")', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', filter: 'drop-shadow(...)' })` on the content container. `background-size: 100% 100%` always matches the box at any height; `drop-shadow` still follows the PNG alpha edge. Fall back to the absoluteFill stretched `<Image>` on native.
- This is the `StretchSheet` component in `components/TornPaper.tsx`; the older `TornSheet` keeps the Image approach and is fine only for fixed/small-texture sheets. The latent intrinsic-size bleed still exists in `TornSheet` — don't give it a large or dark texture.

**Asset URI gotcha:** `Image.resolveAssetSource(mod)` throws `is not a function` under this RN Web setup. Use `Asset.fromModule(mod).uri` (`expo-asset`) — it resolves synchronously at render on web (CSS backgrounds need no download). A repo patch (`patches/expo-asset+12.0.12.patch`) handles the https dev-server scheme.
