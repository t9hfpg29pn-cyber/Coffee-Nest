import cv2
import numpy as np
import os

ASSETS = "attached_assets"
OUT = "/tmp/icon_extract"
os.makedirs(OUT, exist_ok=True)


def tile_mask(gray, thr):
    m = (gray < thr).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    return m


def detect_tiles(img, thr=216, min_h_frac=0.35, min_w_frac=0.0, ar=(0.6, 1.7),
                 min_area_frac=0.01, yband=None, abs_min_h=0):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    m = tile_mask(gray, thr)
    n, lbl, stats, cent = cv2.connectedComponentsWithStats(m, 8)
    out = []
    for i in range(1, n):
        x, y, ww, hh, area = stats[i]
        cy = cent[i][1]
        if yband and not (yband[0] <= cy <= yband[1]):
            continue
        if hh < h * min_h_frac or hh < abs_min_h:
            continue
        if ww < w * min_w_frac:
            continue
        aspect = ww / hh
        if not (ar[0] <= aspect <= ar[1]):
            continue
        if area < h * w * min_area_frac:
            continue
        out.append([int(x), int(y), int(ww), int(hh), float(cent[i][0]), float(cent[i][1])])
    return out, m


def sort_grid(tiles, row_tol=40):
    tiles = sorted(tiles, key=lambda b: b[5])
    rows = []
    for t in tiles:
        placed = False
        for r in rows:
            if abs(r[0][5] - t[5]) < row_tol:
                r.append(t); placed = True; break
        if not placed:
            rows.append([t])
    for r in rows:
        r.sort(key=lambda b: b[4])
    return rows


def crop_tile(img, box, thr=216, pad=10, feather=3):
    x, y, ww, hh, cx, cy = box
    H, W = img.shape[:2]
    x0 = max(0, x - pad); y0 = max(0, y - pad)
    x1 = min(W, x + ww + pad); y1 = min(H, y + hh + pad)
    crop = img[y0:y1, x0:x1]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    m = (gray < thr).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    # keep only largest component, fill holes
    n, lbl, stats, cent = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = (lbl == biggest).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    alpha = np.zeros_like(m)
    cv2.drawContours(alpha, cnts, -1, 255, thickness=cv2.FILLED)
    if feather:
        alpha = cv2.GaussianBlur(alpha, (0, 0), feather)
    b, g, r = cv2.split(crop)
    rgba = cv2.merge([b, g, r, alpha])
    # tight crop to alpha bbox
    ys, xs = np.where(alpha > 8)
    if len(xs):
        rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return rgba


def montage(tiles_rgba, cols, cell=160, save="/tmp/icon_extract/montage.png", labels=None):
    rows = (len(tiles_rgba) + cols - 1) // cols
    canvas = np.full((rows * cell, cols * cell, 3), 60, np.uint8)
    for i, t in enumerate(tiles_rgba):
        r, c = divmod(i, cols)
        th = t[:, :, 3:4].astype(float) / 255
        rgb = t[:, :, :3].astype(float)
        comp = (rgb * th + 60 * (1 - th)).astype(np.uint8)
        sc = min((cell - 20) / comp.shape[1], (cell - 20) / comp.shape[0])
        comp = cv2.resize(comp, (int(comp.shape[1] * sc), int(comp.shape[0] * sc)))
        oy = r * cell + (cell - comp.shape[0]) // 2
        ox = c * cell + (cell - comp.shape[1]) // 2
        canvas[oy:oy + comp.shape[0], ox:ox + comp.shape[1]] = comp
        if labels:
            cv2.putText(canvas, labels[i], (c * cell + 4, r * cell + cell - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    cv2.imwrite(save, canvas)
    print("montage", save, len(tiles_rgba), "tiles")


SHEETS = {
    "nav": dict(file="image_1781265868709.png", thr=224, min_h_frac=0.35, cols=9),
    "actions": dict(file="image_1781265882019.png", thr=226, min_h_frac=0.35, cols=7),
    "rkc": dict(file="image_1781265873473.png", thr=224, min_h_frac=0.35, cols=2),
    "grinders": dict(file="image_1781265887220.png", thr=224, min_h_frac=0.3, ar=(0.4, 2.2), cols=2),
    "cat": dict(file="ChatGPT_Image_12._Juni_2026,_13_43_39_1781265851154.png", thr=226,
                min_h_frac=0.0, abs_min_h=55, ar=(0.65, 1.5), min_area_frac=0.0010,
                yband=(480, 800), cols=11),
}


def run_sheet(name, cfg):
    f = os.path.join(ASSETS, cfg["file"])
    img = cv2.imread(f)
    tiles, m = detect_tiles(img, thr=cfg["thr"], min_h_frac=cfg["min_h_frac"],
                            ar=cfg.get("ar", (0.6, 1.7)), yband=cfg.get("yband"),
                            abs_min_h=cfg.get("abs_min_h", 0),
                            min_area_frac=cfg.get("min_area_frac", 0.01))
    rows = sort_grid(tiles)
    flat = [t for r in rows for t in r]
    print(name, img.shape[1], "x", img.shape[0], "rows", [len(r) for r in rows], "total", len(flat))
    for i, b in enumerate(flat):
        print("  ", i, [b[0], b[1], b[2], b[3]], "cx %.0f cy %.0f" % (b[4], b[5]))
    crops = [crop_tile(img, b, thr=cfg["thr"]) for b in flat]
    montage(crops, cols=cfg["cols"], labels=[str(i) for i in range(len(crops))],
            save="/tmp/icon_extract/%s_montage.png" % name)
    return flat, crops


NAME_MAPS = {
    "nav": ["nav_roastery", "nav_coffee", "nav_worldmap", "nav_discoveries", "nav_compass",
            "nav_favorite", "nav_search", "nav_profile", "nav_settings"],
    "actions": ["act_add", "act_edit", "act_delete", "act_share", "act_download",
                "act_filter", "act_sort"],
    "rkc": ["roast_profile", "assortment"],
    "grinders": ["grinder_niche", "grinder_commandante"],
    "cat": [
        "grind_very_coarse", "grind_coarse", "grind_medium", "grind_fine", "grind_very_fine",
        "aroma_chocolate", "aroma_nutty", "aroma_roasty", "aroma_fruity", "aroma_floral",
        "roast_light", "roast_cinnamon", "roast_medium", "roast_dark", "roast_very_dark",
        "proc_washed", "proc_natural", "proc_honey", "proc_anaerobic", "proc_experimental",
        "proc_decaf",
    ],
}

ICON_OUT = "assets/textures/icons"
BG_OUT = "assets/textures"
MAIN = "ChatGPT_Image_12._Juni_2026,_13_43_39_1781265851154.png"
PLAIN = "ChatGPT_Image_12._Juni_2026,_13_55_48_1781265858976.png"


def save_icons():
    os.makedirs(ICON_OUT, exist_ok=True)
    for nm in NAME_MAPS:
        flat, crops = run_sheet(nm, SHEETS[nm])
        names = NAME_MAPS[nm]
        assert len(crops) == len(names), (nm, len(crops), len(names))
        for c, name in zip(crops, names):
            cv2.imwrite(os.path.join(ICON_OUT, name + ".png"), c)
        print("saved", nm, len(names))


def _inset_crop(img, box, frac):
    x, y, w, h = box
    dx, dy = int(w * frac), int(h * frac)
    return img[y + dy:y + h - dy, x + dx:x + w - dx]


def _alpha_cut(crop, thr=222, feather=2):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    m = (gray < thr).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    alpha = np.zeros_like(m)
    cv2.drawContours(alpha, cnts, -1, 255, cv2.FILLED)
    alpha = cv2.GaussianBlur(alpha, (0, 0), feather)
    b, g, r = cv2.split(crop)
    return cv2.merge([b, g, r, alpha])


def save_backgrounds():
    main = cv2.imread(os.path.join(ASSETS, MAIN))
    swatches = {
        "bg_card_hero": ((253, 57, 350, 290), 0.06, False),
        "bg_card_standard": ((623, 85, 324, 262), 0.12, False),
        "bg_espresso_header": ((974, 86, 284, 261), 0.12, False),
        "bg_coffee_stain": ((1284, 92, 233, 255), 0.0, True),
    }
    for name, (box, frac, stain) in swatches.items():
        if stain:
            x, y, w, h = box
            crop = main[y:y + h, x:x + w]
            out = _alpha_cut(crop)
        else:
            out = _inset_crop(main, box, frac)
        cv2.imwrite(os.path.join(BG_OUT, name + ".png"), out)
        print("saved bg", name, out.shape)
    # paper base from the dedicated plain-paper sheet, centre 84%
    plain = cv2.imread(os.path.join(ASSETS, PLAIN))
    h, w = plain.shape[:2]
    mx, my = int(w * 0.08), int(h * 0.08)
    cv2.imwrite(os.path.join(BG_OUT, "bg_paper_base.png"), plain[my:h - my, mx:w - mx])
    print("saved bg bg_paper_base", (h - 2 * my, w - 2 * mx))


if __name__ == "__main__":
    import sys
    names = sys.argv[1:] if len(sys.argv) > 1 else list(SHEETS)
    if names == ["save"]:
        save_icons()
        save_backgrounds()
    else:
        for nm in names:
            run_sheet(nm, SHEETS[nm])
