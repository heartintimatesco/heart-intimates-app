/*
  HEART INTIMATES — NUCLEO COMPARTIDO
  ===================================
  Este archivo lo cargan las cinco apps. Aqui vive todo lo que antes estaba
  copiado en cada HTML: la conexion con Airtable, el catalogo y las utilidades.

  EL CAMBIO IMPORTANTE (v2.0):
  Antes cada app llevaba el catalogo escrito a mano en un arreglo CAT, con las
  fotos incrustadas en base64. Eso pesaba varios megas y obligaba a editar dos
  archivos cada vez que entraba un color nuevo.
  Ahora el catalogo se lee de Airtable al abrir la app. Airtable es la unica
  fuente de verdad: nombre, precio, color, foto y stock salen todos de alli.
  Agregar un producto ya no requiere tocar el codigo ni subir nada a GitHub.

  SOBRE LAS FOTOS:
  Las URLs de los adjuntos de Airtable expiran a las pocas horas. Por eso NO se
  pueden guardar ni cachear: hay que pedirlas frescas en cada carga. Airtable
  ademas genera miniaturas solo (thumbnails), asi que la app baja una imagen
  pequena en la lista y la grande solo cuando se toca para ampliar.
*/

/* ---------- IDENTIFICADORES DE AIRTABLE ---------- */

const BASE_ID = "appBVPFSRXvHnoS96";

const T = {
  PRODUCTOS:       "tblbbsof4KGbNDdbN",
  VARIANTES:       "tblmmlhQOKmrLh44m",
  PEDIDOS:         "tblZyQ9HNNQIRsimF",
  DETALLE_VENTA:   "tblOrV8Cva3DDxb09",
  COMPRAS:         "tblum45OxxlHknTRz",
  DETALLE_COMPRA:  "tblhSZbhVHlwEospg"
};

/*
  Se leen los campos por ID y no por nombre. Es mas feo de leer, pero si
  algun dia se renombra una columna en Airtable la app no se rompe.
  Para que la API devuelva los datos por ID hay que pedir returnFieldsByFieldId.
*/
const F = {
  // Tabla Productos
  PROD_NOMBRE:     "fldeKmjSkoZatkRXr",  // "Set top - rib" — agrupa el catalogo
  PROD_SKU:        "fldz2YLw7ByEOwqdM",  // "SET-TOP-RIB"
  PROD_DETAL:      "fldmhQ365k6wcvytz",  // precio de venta a la clienta
  PROD_MAYOR:      "fldJft2uVbMfyLziN",  // costo al proveedor
  PROD_DISPONIBLE: "fldiVTVlTnYMBwpCW",  // "Si"/"No": si el proveedor lo tiene

  // Tabla Variantes
  VAR_SKU:         "fldwTEuGQDl7BZGYX",
  VAR_COLOR:       "fld6R4tsM4IBuVPPv",
  VAR_FOTO:        "fldEPjcn6tfT3IGVW",
  VAR_PRODUCTO:    "fldiYGyNKAqppU6RB",  // vinculo a Productos
  VAR_DISPONIBLE:  "fld9g3nm2Xg7i3fsw",  // fisico menos reservado
  VAR_ALERTA:      "fldSpdZOpdGIuLNl6",  // nivel al que toca reponer
  VAR_ENCARGADO:   "fldcxxoODuj51wMWN",  // lo que clientas pidieron y no habia
  VAR_FISICO:      "fld7dYq8I1QvvPeLZ",
  VAR_RESERVADO:   "fldXjeataw1rtg5lm"
};

/* ---------- CONEXION ---------- */

function getToken(){ return localStorage.getItem('airtable_token') || ''; }

function guardarToken(){
  const t = document.getElementById('token').value.trim();
  if(!t.startsWith('pat')){ aviso('El token debe empezar con "pat".','err'); return; }
  localStorage.setItem('airtable_token', t);
  document.getElementById('token').value = '';
  actualizarBadge();
  if(typeof iniciar === 'function') iniciar();
}

function actualizarBadge(){
  const b = document.getElementById('badge-conexion');
  const cfg = document.getElementById('config');
  if(!b || !cfg) return;
  if(getToken()){
    b.textContent = 'Conectado';
    b.className = 'badge-ok';
    cfg.style.display = 'none';
  } else {
    b.textContent = '';
    cfg.style.display = 'block';
  }
}

// Toda llamada a Airtable pasa por aqui, para no repetir cabeceras ni errores
async function airtable(metodo, tabla, cuerpo, query){
  const url = `https://api.airtable.com/v0/${BASE_ID}/${tabla}${query||''}`;
  const r = await fetch(url, {
    method: metodo,
    headers: {
      'Authorization': 'Bearer ' + getToken(),
      'Content-Type': 'application/json'
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  if(!r.ok){
    const err = await r.json().catch(()=>({}));
    throw new Error(err.error?.message || ('Error ' + r.status));
  }
  return r.json();
}

// Trae todas las paginas de una tabla (Airtable devuelve 100 por vez)
async function traerTodo(tabla, campos){
  let registros = [], offset = '';
  const lista = campos.map(c => `&fields%5B%5D=${c}`).join('');
  do {
    const q = `?returnFieldsByFieldId=true&pageSize=100${lista}` +
              (offset ? '&offset=' + offset : '');
    const data = await airtable('GET', tabla, null, q);
    registros = registros.concat(data.records);
    offset = data.offset || '';
  } while(offset);
  return registros;
}

/* ---------- CATALOGO ---------- */

/*
  CATALOGO queda como un arreglo plano de variantes, cada una ya con los datos
  de su producto pegados encima. Asi las apps no tienen que cruzar tablas.
*/
let CATALOGO = [];

async function cargarCatalogo(){
  // 1. Los productos: nombre y precios
  const productos = await traerTodo(T.PRODUCTOS, [
    F.PROD_NOMBRE, F.PROD_SKU, F.PROD_DETAL, F.PROD_MAYOR, F.PROD_DISPONIBLE
  ]);
  const porId = {};
  productos.forEach(p => {
    porId[p.id] = {
      nombre:     p.fields[F.PROD_NOMBRE] || '(sin nombre)',
      sku:        p.fields[F.PROD_SKU] || '',
      detal:      p.fields[F.PROD_DETAL] || 0,
      mayor:      p.fields[F.PROD_MAYOR] || 0,
      disponible: (p.fields[F.PROD_DISPONIBLE]?.name || p.fields[F.PROD_DISPONIBLE]) !== 'No'
    };
  });

  // 2. Las variantes: color, foto y stock
  const variantes = await traerTodo(T.VARIANTES, [
    F.VAR_SKU, F.VAR_COLOR, F.VAR_FOTO, F.VAR_PRODUCTO,
    F.VAR_DISPONIBLE, F.VAR_ALERTA, F.VAR_ENCARGADO,
    F.VAR_FISICO, F.VAR_RESERVADO
  ]);

  CATALOGO = variantes.map(v => {
    const f = v.fields;
    const prod = porId[(f[F.VAR_PRODUCTO] || [])[0]] || {};
    const foto = (f[F.VAR_FOTO] || [])[0];
    return {
      id:        v.id,
      sku:       f[F.VAR_SKU] || '',
      color:     f[F.VAR_COLOR] || '(sin color)',
      producto:  prod.nombre || '(sin producto)',
      detal:     prod.detal || 0,
      mayor:     prod.mayor || 0,
      enCatalogo: prod.disponible !== false,
      // Miniatura para la lista, grande solo al ampliar
      foto:      foto?.thumbnails?.large?.url || foto?.url || '',
      fotoFull:  foto?.url || '',
      disponible: f[F.VAR_DISPONIBLE] ?? 0,
      alerta:     f[F.VAR_ALERTA] ?? 0,
      encargado:  f[F.VAR_ENCARGADO] ?? 0,
      fisico:     f[F.VAR_FISICO] ?? 0,
      reservado:  f[F.VAR_RESERVADO] ?? 0
    };
  });

  // Orden estable: por producto y luego por color, como se lee en la pantalla
  CATALOGO.sort((a,b) =>
    a.producto.localeCompare(b.producto,'es') || a.color.localeCompare(b.color,'es'));

  return CATALOGO;
}

// Agrupa el catalogo por producto para pintarlo en secciones colapsables
function agruparPorProducto(lista){
  const grupos = {};
  (lista || CATALOGO).forEach(v => (grupos[v.producto] ||= []).push(v));
  return grupos;
}

/* ---------- UTILIDADES DE PANTALLA ---------- */

function money(n){
  return '$' + Math.round(n || 0).toLocaleString('es-CO');
}

function aviso(txt, tipo){
  const m = document.getElementById('msg');
  if(!m) return;
  m.textContent = txt;
  m.className = 'msg ' + tipo;
  window.scrollTo(0,0);
}

// Abre la foto grande. Se pide la original solo en este momento.
function ampliar(src){
  const l = document.getElementById('lupa');
  if(!l) return;
  l.querySelector('img').src = src;
  l.style.display = 'flex';
}

// Etiqueta de stock que se muestra junto a cada color
function badgeStock(v){
  const clase = v.disponible <= 0 ? 'agotado' : (v.disponible <= v.alerta ? 'bajo' : 'ok');
  const texto = v.disponible <= 0 ? 'Agotado' : `${v.disponible} disp.`;
  return `<span class="stock-badge ${clase}">${texto}</span>`;
}
