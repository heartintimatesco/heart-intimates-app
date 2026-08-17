# Heart Intimates — sistema de operación

Seis apps web que corren en GitHub Pages y hablan directo con Airtable.
Funcionan en el celular o en el computador, sin instalar nada.

## Empezar

Abre cualquiera de las apps y pega tu token personal de Airtable la primera vez:

1. Créalo en https://airtable.com/create/tokens
2. Dale permisos `data.records:read` y `data.records:write`
3. Dale acceso solo a la base "Heart Intimates — Inventario"

El token queda guardado en ese dispositivo (localStorage del navegador) y lo
comparten las seis apps. Nunca se sube a este repositorio.

## Las apps

| Archivo | Para qué |
|---|---|
| `index.html` | Tomar pedidos de clientas (precio detal) |
| `pedido-proveedor.html` | Compra mensual al proveedor (precio por mayor) |
| `operacion.html` | Trabajo diario: estados de pedidos, avisos por WhatsApp, recepción de mercancía |
| `dashboard.html` | Panel de solo lectura: inventario, historial y rentabilidad |
| `nuevo-producto.html` | Dar de alta sets y colores nuevos |
| `mercadolibre.html` | Publicar en Mercado Libre lo que está pendiente |

Más dos archivos compartidos:

- `app.js` — conexión con Airtable, catálogo y utilidades. Lo cargan las seis apps.
- `estilo.css` — hoja de estilos común. Editarla cambia el diseño de todo el sistema.

## Cómo está armado (v2.0)

**Airtable es la única fuente de verdad.** El nombre, el precio, el color, la
foto y el stock de cada variante salen de ahí y se leen al abrir cada app.

Antes el catálogo estaba escrito a mano en un arreglo `CAT` dentro de
`index.html` y `pedido-proveedor.html`, con las fotos incrustadas en base64.
Eso pesaba varios megas por archivo y obligaba a editar dos archivos y hacer un
commit cada vez que entraba un color nuevo. Ya no existe.

**Las fotos viven en Airtable.** Sus URLs expiran a las pocas horas, así que no
se pueden guardar ni cachear: se piden frescas en cada carga. Airtable genera
las miniaturas, y la app solo baja la foto grande cuando se toca para ampliarla.
Los originales en alta resolución siguen en Google Drive, organizados en una
carpeta por variante, para producir contenido.

## Modelo de stock

Tres cantidades, todas calculadas por Airtable:

- **Stock físico** — recibido del proveedor menos lo que ya salió de bodega
- **Total reservado** — comprometido en pedidos Nuevo o Pago confirmado
- **Stock disponible** — físico menos reservado. Es el número que se muestra al
  tomar un pedido, para no vender algo ya comprometido.

Los pedidos cancelados no descuentan stock. Cuando una clienta pide algo que no
hay, la diferencia queda en **Encargado por clientas** y aparece precargada en
la app de pedido al proveedor.

## Mantenimiento mensual

Cuando llega el catálogo nuevo del proveedor:

1. Actualizar la disponibilidad en Airtable (tabla Productos, "Disponible ahora")
2. Si hay productos o colores nuevos, darlos de alta en `nuevo-producto.html`

Eso es todo. **Ya no hay que tocar código ni subir nada a este repositorio**
para cambiar el catálogo.

## Seguridad

Este repositorio nunca debe contener:

- Tokens de Airtable ni credenciales de Mercado Libre
- Datos de clientas (nombres, contactos, pedidos)

Todas las credenciales se guardan solo en el navegador de cada dispositivo.
Ojo con `mercadolibre.html`: guarda el `client_secret` y el refresh token de
Mercado Libre, que dan control sobre la cuenta. No abrir esa app en un
computador compartido.
