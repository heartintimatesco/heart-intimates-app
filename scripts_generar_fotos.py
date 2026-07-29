"""
Empareja cada archivo de foto con su variante del catalogo y genera
miniaturas pequenas en base64 para incrustar en el HTML.

Los nombres de archivo traen irregularidades (espacios de mas, sufijos "2" y "3",
"#U00e1" en vez de "a" por la codificacion del ZIP), asi que se normaliza todo
antes de comparar.
"""
import os, glob, base64, io, re, json, unicodedata
from PIL import Image

RAIZ = "/home/claude/fotos/HEART INTIMATES"

# Cada set del catalogo con el nombre de carpeta ya normalizado
SETS = {
    "Semi-panty": "set basico semi-panty",
    "Panty-hebilla": "set basico panty-hebilla",
    "Bordado": "set basico - bordado",
    "Top deportivo": "set - top deportivo",
    "Mallapiel bordado": "set mallapiel bordado",
    "Amelia broche": "set amelia - broche",
    "Top rib": "set top - rib",
    "Mallapiel": "set - mallapiel",
    "Varilla encaje": "set varilla encaje",
}

def norm(t):
    """Quita acentos, el escape #U00e1 del zip, y normaliza espacios a minusculas."""
    t = t.replace("#U00e1", "a").replace("#U00e9", "e").replace("#U00ed", "i")
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", t).strip().lower()

# Indexa todas las fotos: (carpeta_norm, color_norm) -> ruta
indice = {}
for ruta in glob.glob(f"{RAIZ}/*/*.jpg"):
    carpeta = norm(os.path.basename(os.path.dirname(ruta)))
    archivo = norm(os.path.splitext(os.path.basename(ruta))[0])
    # El color es lo que queda al quitar el nombre de la carpeta del inicio
    color = archivo[len(carpeta):].strip() if archivo.startswith(carpeta) else archivo
    # Descarta sufijos de tomas alternativas: "negro 2" -> "negro"
    color = re.sub(r"\s+\d+$", "", color).strip()
    # Se queda con la primera toma de cada color
    indice.setdefault((carpeta, color), ruta)

print(f"Fotos indexadas: {len(indice)}")

def miniatura(ruta, ancho=190):
    """Reduce la foto y la devuelve como cadena base64 lista para el HTML."""
    im = Image.open(ruta).convert("RGB")
    alto = int(im.height * ancho / im.width)
    im = im.resize((ancho, alto), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

# Lee el catalogo desde el HTML actual para no repetir los 44 productos a mano
html = open("/mnt/user-data/outputs/tomar-pedido.html", encoding="utf-8").read()
entradas = re.findall(r'\{id:"(rec\w+)", t:"([^"]+)", p:(\d+), img:"[^"]*"\}', html)
print(f"Productos en el catalogo: {len(entradas)}")

resultado, faltantes = {}, []
for rid, titulo, precio in entradas:
    set_, color = [x.strip() for x in titulo.split("·")]
    clave = (SETS[set_], norm(color))
    ruta = indice.get(clave)
    if ruta:
        resultado[rid] = miniatura(ruta)
    else:
        faltantes.append(titulo)

print(f"Con foto: {len(resultado)} | Sin foto: {len(faltantes)}")
for f in faltantes:
    print("  falta:", f)

json.dump(resultado, open("/home/claude/miniaturas.json", "w"))
peso = sum(len(v) for v in resultado.values()) / 1024
print(f"Peso total de miniaturas: {peso:.0f} KB")
