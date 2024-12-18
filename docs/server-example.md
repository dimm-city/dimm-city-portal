# Adding Dimm City Portal Server to Your Site

## SvelteKit / Vite Dev Server

`vite.config.js`
```js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { Server } from 'socket.io';
import { createPortalServer } from './src/lib/server/PortalServer.js';

const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server) {
        if (!server.httpServer) return;

        const io = new Server(server.httpServer, {
            path: '/portal-connection',
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            maxHttpBufferSize: 10e6, // 10MB, adjust according to your needs
            pingTimeout: 120000 // 120 seconds, adjust according to your needs
        });

        createPortalServer(io);
    }
};

export default defineConfig({
    plugins: [sveltekit(), webSocketServer]
});
```

## CommonJS Node Server

```js
const socketIo = require('socket.io');
const httpServer = require('http').createServer();
const io = socketIo(httpServer, {
    path: '/portal-hub',
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 10e6, // 10MB, adjust according to your needs
    pingTimeout: 120000 // 120 seconds, adjust according to your needs
});
```
