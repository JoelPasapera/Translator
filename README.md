# Traductor

Pequeño traductor web que usa la API gratuita de **MyMemory**. Sin registro, sin clave y sin backend: son tres archivos que abres directamente en el navegador.

## Qué hace

- Traduce entre ~36 idiomas.
- Interfaz de dos paneles (origen / destino) con botón para intercambiar idiomas.
- Contador de caracteres con aviso al pasar del límite por petición.
- Botón para copiar el resultado.
- Indicador de coincidencia de la traducción.
- Campo opcional de email para multiplicar ×10 el límite diario.
- Medidor estimado de consumo del día (se guarda por día en el navegador).
- Atajo de teclado: `Ctrl` / `Cmd` + `Enter` para traducir.

## Estructura

```
traductor/
├── index.html
├── styles.css
└── app.js
```

- `index.html` — estructura de la página.
- `styles.css` — estilos.
- `app.js` — toda la lógica de traducción.

## Cómo usarlo

1. Guarda los tres archivos en la **misma carpeta**.
2. Abre `index.html` con doble clic en cualquier navegador moderno.

No hay que instalar ni configurar nada para empezar: MyMemory funciona sin clave.

## Configuración

### Email (límite ×10)

En la sección **Opciones** de la página puedes escribir tu email. MyMemory sube el límite diario gratuito de unos 5.000 a unos 50.000 caracteres cuando se incluye un email en la petición. No se guarda en ningún servidor; solo se manda a la propia API de traducción.

### Añadir o quitar idiomas

La lista está en `app.js`, en la constante `IDIOMAS`. Cada entrada es `{ code, nombre }`, donde `code` es el código de idioma de MyMemory (ISO 639-1; por ejemplo `es`, `en`, `de`, y `zh-CN` para chino simplificado). Añade o borra líneas y los dos desplegables se actualizan solos.

## Límites y cosas a tener en cuenta

- **Máximo 500 caracteres por traducción** en el plan gratuito de MyMemory. El contador avisa en ámbar al pasarte.
- **El medidor de consumo es una estimación.** Cuenta solo lo traducido en este navegador; el límite real lo cuenta MyMemory por dirección IP. La API no expone el dato exacto restante, solo avisa cuando se agota.
- El medidor se guarda en el almacenamiento local del navegador y se reinicia cada día.
- La calidad de MyMemory está bien para uso personal y pruebas; combina memorias de traducción con traducción automática.

## Posibles mejoras

- Añadir DeepL o Google como proveedores. Requiere un pequeño backend: sus claves no pueden ir en el navegador y, además, DeepL bloquea las llamadas desde el cliente.
- Trocear textos largos para superar el límite de 500 caracteres por petición.
- Detección automática del idioma de origen.

## Créditos

Traducciones por [MyMemory](https://mymemory.translated.net/) (Translated.net).
