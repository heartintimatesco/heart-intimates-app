# Heart Intimates — Tomar pedido

App para registrar pedidos de clientas directo en Airtable, con foto de
cada conjunto para confirmar el color correcto antes de guardar.

## Uso
Abre `index.html` en cualquier navegador (celular o computador).
La primera vez, pega tu token personal de Airtable en el panel de conexión:

1. Crea uno en https://airtable.com/create/tokens
2. Dale permisos `data.records:read` y `data.records:write`
3. Dale acceso solo a la base "Heart Intimates — Inventario"
4. Pégalo en la app y presiona Guardar

El token se guarda solo en ese dispositivo (localStorage del navegador).
Nunca se sube a este repositorio ni se comparte con nadie más.

## Estructura
- `inicio.html` — pantalla para elegir entre las dos apps.
- `index.html` — tomar pedidos de clientas (precio detal).
- `pedido-proveedor.html` — compra mensual al proveedor (precio por mayor),
  con lectura de stock en vivo desde Airtable y control de presupuesto.
- `operacion.html` — trabajo diario: cambiar estado de pedidos (nuevo,
  pago confirmado, empacado, enviado, entregado), avisar a clientas por
  WhatsApp con mensaje ya redactado, y marcar recepción de mercancía del
  proveedor (sube el stock automáticamente al confirmar).
- `dashboard.html` — panel de control de solo lectura: inventario actual,
  historial de pedidos y compras, y rentabilidad por variante.

Las dos apps incluyen las fotos de los 44 productos incrustadas como
miniaturas, para funcionar sin depender de carpetas locales.
- `scripts_generar_fotos.py` — script usado para generar y emparejar las
  miniaturas la última vez que se actualizó el catálogo.

## Mantenimiento mensual
Cuando llega el catálogo nuevo del proveedor:
1. Actualizar disponibilidad en Airtable (tabla Productos, "Disponible ahora")
2. Si hay productos o colores nuevos, agregarlos al arreglo `CAT` en
   AMBOS archivos: `index.html` (con `p:` precio detal) y
   `pedido-proveedor.html` (con `p:` y `c:` costo por mayor)
3. Confirmar y subir una nueva versión (ver historial de cambios abajo)

## Seguridad
Este repositorio NUNCA debe contener:
- Tokens de Airtable
- Datos reales de clientas (nombres, contactos, pedidos)
Solo contiene el catálogo de productos (fotos, precios) y el código de la app.
