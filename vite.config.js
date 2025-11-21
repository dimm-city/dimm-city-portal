import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const webSocketServer = {
	name: 'webSocketServer',
	async configureServer(server) {
		if (!server.httpServer || process.env.NODE_ENV == 'production') return;

		// Dynamic import - only load when actually needed
		const { Server } = await import('socket.io');
		const { createPortalServer } = await import('./src/lib/server/PortalServer.js');

		// Get allowed origins from environment variable or use localhost defaults
		const allowedOrigins = process.env.ALLOWED_ORIGINS
			? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
			: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

		const io = new Server(server.httpServer, {
			path: '/portal-hub',
			cors: {
				origin: allowedOrigins,
				methods: ['GET', 'POST'],
				credentials: true
			},
			maxHttpBufferSize: 10e6, // 10MB, adjust according to your needs
			pingTimeout: 120000 // 120 seconds, adjust according to your needs
		});

		const portalServer = createPortalServer(io);
		console.log('Started Portal Server v' + portalServer.version);
		console.log('CORS allowed origins:', allowedOrigins);


	}
};

export default defineConfig({
	server: {
		// Security headers for development server
		headers: {
			'X-Frame-Options': 'DENY',
			'X-Content-Type-Options': 'nosniff',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
			'X-XSS-Protection': '1; mode=block',
			'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
		}
	},
	plugins: [sveltekit(), webSocketServer]
});
