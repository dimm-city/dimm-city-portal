import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { Server } from 'socket.io';
import { createPortalServer } from './src/lib/server/PortalServer.js';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server) {
		if (!server.httpServer || process.env.NODE_ENV == 'production') return;

		const io = new Server(server.httpServer, {
			path: '/portal-hub',
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			},
			maxHttpBufferSize: 10e6, // 10MB, adjust according to your needs
			pingTimeout: 120000 // 120 seconds, adjust according to your needs
		});

		const portalServer = createPortalServer(io);
		console.log('Started Portal Server v' + portalServer.version);
		

	}
};

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
});
