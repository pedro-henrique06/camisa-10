"""
Gera as animações Lottie de comemoração do Camisa 10 (assets/lottie/*.json).

As animações são feitas aqui, por código, para não depender de arquivos de terceiros.
Para trocar por uma animação do LottieFiles, basta substituir o .json com o mesmo nome.

Uso: python3 tools/lottie/generate.py
"""
import json
import math
import os
import random

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "lottie")
FPS = 60

GOLD = "#f4c20d"
PALETTE = ["#f4c20d", "#ffffff", "#ff7a70", "#7be495", "#6cabdd", "#ffdb4d"]


def rgb(hex_color, a=1.0):
    h = hex_color.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [a]


def static(v):
    return {"a": 0, "k": v}


def ease_out():
    return {"i": {"x": [0.2], "y": [1]}, "o": {"x": [0.3], "y": [0]}}


def ease_in_out():
    return {"i": {"x": [0.6], "y": [1]}, "o": {"x": [0.4], "y": [0]}}


def anim(frames, easing=ease_out):
    """frames: lista de (tempo, valor). Valores escalares viram [valor]."""
    k = []
    for i, (t, v) in enumerate(frames):
        s = v if isinstance(v, list) else [v]
        kf = {"t": t, "s": s}
        if i < len(frames) - 1:
            kf.update(easing())
        k.append(kf)
    return {"a": 1, "k": k}


def transform(p=None, s=None, r=None, o=None):
    return {
        "o": o or static(100),
        "r": r or static(0),
        "p": p or static([0, 0, 0]),
        "a": static([0, 0, 0]),
        "s": s or static([100, 100, 100]),
    }


def group(items, color):
    return {
        "ty": "gr",
        "it": items + [
            {"ty": "fl", "c": static(rgb(color)), "o": static(100), "r": 1},
            {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0), "o": static(100)},
        ],
    }


def ellipse(w, h=None):
    return {"ty": "el", "p": static([0, 0]), "s": static([w, h or w]), "d": 1}


def rect(w, h, r=1.5):
    return {"ty": "rc", "p": static([0, 0]), "s": static([w, h]), "r": static(r), "d": 1}


def path(points):
    n = len(points)
    return {"ty": "sh", "ks": static({"i": [[0, 0]] * n, "o": [[0, 0]] * n, "v": points, "c": True}), "d": 1}


def star(size):
    a, b = size, size * 0.28
    return path([[0, -a], [b, -b], [a, 0], [b, b], [0, a], [-b, b], [-a, 0], [-b, -b]])


_ind = [0]


def layer(name, shapes, ks, ip, op):
    _ind[0] += 1
    return {"ddd": 0, "ind": _ind[0], "ty": 4, "nm": name, "sr": 1, "ks": ks, "ao": 0,
            "shapes": shapes, "ip": ip, "op": op, "st": 0, "bm": 0}


def comp(name, w, h, op, layers):
    return {"v": "5.7.4", "fr": FPS, "ip": 0, "op": op, "w": w, "h": h, "nm": name, "ddd": 0, "assets": [], "layers": layers}


# ---------------------------------------------------------------- fogos (gol)
def fireworks():
    rnd = random.Random(10)
    W = H = 400
    op = 130
    layers = []
    bursts = [((200, 165), 0, GOLD), ((105, 115), 16, "#ff7a70"), ((295, 120), 28, "#7be495"), ((200, 85), 44, "#ffffff")]
    for (cx, cy), t0, main in bursts:
        # clarão no centro
        layers.append(layer("flash", [group([ellipse(30)], "#fff8d0")], transform(
            p=static([cx, cy, 0]),
            s=anim([(t0, [0, 0, 100]), (t0 + 10, [260, 260, 100])]),
            o=anim([(t0, 90), (t0 + 14, 0)])), t0, t0 + 16))
        n = 16
        for i in range(n):
            ang = 2 * math.pi * i / n + rnd.uniform(-0.12, 0.12)
            dist = rnd.uniform(85, 125)
            ex, ey = cx + math.cos(ang) * dist, cy + math.sin(ang) * dist + 18  # cai um pouco (gravidade)
            color = main if i % 3 else rnd.choice(PALETTE)
            size = rnd.uniform(9, 14)
            layers.append(layer("spark", [group([ellipse(size)], color)], transform(
                p=anim([(t0, [cx, cy, 0]), (t0 + 42, [ex, ey, 0])]),
                s=anim([(t0, [130, 130, 100]), (t0 + 50, [30, 30, 100])]),
                o=anim([(t0, 100), (t0 + 26, 100), (t0 + 52, 0)])), t0, t0 + 54))
            # rastro: ponto menor que segue atrás
            mx, my = cx + math.cos(ang) * dist * 0.72, cy + math.sin(ang) * dist * 0.72 + 8
            layers.append(layer("trail", [group([ellipse(size * 0.5)], color)], transform(
                p=anim([(t0 + 2, [cx, cy, 0]), (t0 + 40, [mx, my, 0])]),
                o=anim([(t0 + 2, 70), (t0 + 40, 0)])), t0 + 2, t0 + 42))
    # estrelinhas piscando
    for i in range(10):
        x, y = rnd.uniform(40, 360), rnd.uniform(40, 260)
        t0 = rnd.randint(10, 70)
        layers.append(layer("twinkle", [group([star(rnd.uniform(7, 11))], rnd.choice([GOLD, "#ffffff"]))], transform(
            p=static([x, y, 0]),
            s=anim([(t0, [0, 0, 100]), (t0 + 10, [120, 120, 100]), (t0 + 26, [0, 0, 100])], ease_in_out),
            r=anim([(t0, 0), (t0 + 26, 90)], ease_in_out)), t0, t0 + 27))
    return comp("fogos", W, H, op, layers)


# ---------------------------------------------------------------- confete (títulos)
def confetti():
    rnd = random.Random(20)
    W, H = 400, 500
    op = 200
    layers = []
    for i in range(60):
        x0 = rnd.uniform(0, W)
        t0 = rnd.randint(0, 50)
        dur = rnd.randint(110, 150)
        sway = rnd.uniform(18, 40) * rnd.choice([-1, 1])
        color = PALETTE[i % len(PALETTE)]
        shape = rect(rnd.uniform(7, 10), rnd.uniform(12, 18)) if i % 4 else ellipse(9)
        pos = [(t0 + dur * f, [x0 + sway * math.sin(f * math.pi * 2.5), -30 + (H + 60) * f, 0]) for f in (0, 0.25, 0.5, 0.75, 1)]
        spin = rnd.uniform(360, 900) * rnd.choice([-1, 1])
        layers.append(layer("piece", [group([shape], color)], transform(
            p=anim(pos, ease_in_out),
            r=anim([(t0, 0), (t0 + dur, spin)], ease_in_out),
            s=anim([(t0 + dur * f, [100, 100 * abs(math.cos(f * 7 + i)) + 15, 100]) for f in (0, 0.33, 0.66, 1)], ease_in_out),
            o=anim([(t0, 100), (t0 + dur * 0.8, 100), (t0 + dur, 0)])), t0, t0 + dur))
    return comp("confete", W, H, op, layers)


# ---------------------------------------------------------------- raios (troféu, Bola de Ouro)
# Em loop: começo e fim iguais. A entrada suave fica por conta do app.
def rays():
    W = H = 300
    op = 240  # 4 s, em loop
    c = 150
    shapes = []
    for i in range(12):
        a = 2 * math.pi * i / 12
        da = math.pi / 40
        p1 = [c + math.cos(a - da) * 150, c + math.sin(a - da) * 150]
        p2 = [c + math.cos(a + da) * 150, c + math.sin(a + da) * 150]
        shapes.append(path([[c, c], p1, p2]))
    rays_group = {
        "ty": "gr",
        "it": shapes + [
            {"ty": "fl", "c": static(rgb(GOLD)), "o": static(22), "r": 1},
            {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0), "o": static(100)},
        ],
    }
    layers = [
        layer("rays", [rays_group], transform(
            p=static([c, c, 0]),
            # 12 raios a cada 30 graus: girar 30 graus fecha o loop sem emenda
            r={"a": 1, "k": [{"t": 0, "s": [0], "i": {"x": [1], "y": [1]}, "o": {"x": [0], "y": [0]}}, {"t": op, "s": [30]}]}), 0, op),
        layer("glow", [group([ellipse(150)], "#fff1a8")], transform(
            p=static([c, c, 0]),
            s=anim([(0, [85, 85, 100]), (op / 2, [110, 110, 100]), (op, [85, 85, 100])], ease_in_out),
            o=anim([(0, 26), (op / 2, 14), (op, 26)], ease_in_out)), 0, op),
    ]
    # o raio gira em torno do centro: a âncora precisa ser o centro
    layers[0]["ks"]["a"] = static([c, c, 0])
    return comp("raios", W, H, op, layers)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("fogos", fireworks), ("confete", confetti), ("raios", rays)]:
        _ind[0] = 0
        data = fn()
        with open(os.path.join(OUT, name + ".json"), "w") as f:
            json.dump(data, f, separators=(",", ":"))
        print(name, len(data["layers"]), "camadas,", round(os.path.getsize(os.path.join(OUT, name + ".json")) / 1024, 1), "KB")


if __name__ == "__main__":
    main()
