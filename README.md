# Chat en tiempo real

Aplicación de chat grupal en tiempo real construida con Node.js, Express y Socket.IO. Permite elegir un nombre, ver quién está conectado, enviar mensajes sin recargar la página y salir del chat para regresar a la pantalla de inicio.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación y ejecución

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
npm start
```

Después, visita [http://localhost:3000](http://localhost:3000) en el navegador. Para probar el chat, abre la dirección en dos o más pestañas.

El puerto predeterminado es `3000`; se puede cambiar definiendo la variable de entorno `PORT`.

## Eventos de Socket.IO

- `user:join`: registra el nombre del participante.
- `user:leave`: desconecta al participante de la conversación sin cerrar la página.
- `users:update`: actualiza la lista de participantes conectados.
- `chat:message`: envía y recibe mensajes de hasta 500 caracteres.
- `chat:system`: informa cuando alguien entra o sale.
- `chat:error`: comunica errores de validación al cliente.

Los mensajes se distribuyen en tiempo real y no se guardan después de que el servidor se detiene.
