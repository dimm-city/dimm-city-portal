/**
 * Rate Limiting Configuration
 * Prevents abuse and DOS attacks on WebSocket events
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

// Environment-based configuration with sensible defaults
const config = {
	sessionCreation: {
		points: parseInt(process.env.RATE_LIMIT_SESSION_CREATION || '5'),
		duration: 3600, // 1 hour
	},
	sessionJoin: {
		points: parseInt(process.env.RATE_LIMIT_SESSION_JOIN || '10'),
		duration: 3600, // 1 hour
	},
	diceRolls: {
		points: parseInt(process.env.RATE_LIMIT_DICE_ROLLS || '60'),
		duration: 60, // 1 minute
	},
	commands: {
		points: parseInt(process.env.RATE_LIMIT_COMMANDS || '100'),
		duration: 60, // 1 minute
	},
	passwordAttempts: {
		points: parseInt(process.env.RATE_LIMIT_PASSWORD_ATTEMPTS || '5'),
		duration: 900, // 15 minutes
		blockDuration: 900, // block for 15 minutes after limit
	},
	chatMessages: {
		points: parseInt(process.env.RATE_LIMIT_CHAT_MESSAGES || '30'),
		duration: 60, // 1 minute
	},
};

/**
 * Session Creation Rate Limiter
 * Limits: 5 sessions per hour per IP
 * Prevents spam session creation
 */
export const sessionCreationLimiter = new RateLimiterMemory({
	points: config.sessionCreation.points,
	duration: config.sessionCreation.duration,
});

/**
 * Session Join Rate Limiter
 * Limits: 10 join attempts per hour per IP
 * Prevents brute force password attacks
 */
export const sessionJoinLimiter = new RateLimiterMemory({
	points: config.sessionJoin.points,
	duration: config.sessionJoin.duration,
});

/**
 * Dice Roll Rate Limiter
 * Limits: 60 rolls per minute per socket
 * Prevents spam dice rolls
 */
export const diceRollLimiter = new RateLimiterMemory({
	points: config.diceRolls.points,
	duration: config.diceRolls.duration,
});

/**
 * Editor Command Rate Limiter
 * Limits: 100 commands per minute per socket
 * Prevents canvas spam
 */
export const commandLimiter = new RateLimiterMemory({
	points: config.commands.points,
	duration: config.commands.duration,
});

/**
 * Password Attempt Rate Limiter
 * Limits: 5 failed attempts per 15 minutes per IP
 * Blocks for 15 minutes after hitting limit
 * Prevents password brute force
 */
export const passwordAttemptLimiter = new RateLimiterMemory({
	points: config.passwordAttempts.points,
	duration: config.passwordAttempts.duration,
	blockDuration: config.passwordAttempts.blockDuration,
});

/**
 * Chat Message Rate Limiter
 * Limits: 30 messages per minute per socket
 * Prevents chat spam and flooding
 */
export const chatMessageLimiter = new RateLimiterMemory({
	points: config.chatMessages.points,
	duration: config.chatMessages.duration,
});

/**
 * Helper function to handle rate limit errors
 * @param {Error} error - Rate limiter error
 * @param {object} socket - Socket.IO socket
 * @param {string} action - Action that was rate limited
 */
export function handleRateLimitError(error, socket, action) {
	if (error.name === 'RateLimiterRes' || error.msBeforeNext !== undefined) {
		const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000);
		socket.emit('error', {
			message: getRateLimitMessage(action),
			retryAfter: retryAfterSeconds,
			action: action,
		});
		console.warn(`Rate limit exceeded for ${action} by ${socket.id}`);
		return true;
	}
	return false;
}

/**
 * Get user-friendly rate limit message
 * @param {string} action - Action that was rate limited
 * @returns {string} User-friendly message
 */
function getRateLimitMessage(action) {
	const messages = {
		sessionCreation: 'Too many session creation attempts. Please try again later.',
		sessionJoin: 'Too many join attempts. Please wait before trying again.',
		diceRoll: 'Too many dice rolls. Please slow down.',
		command: 'Too many actions. Please slow down.',
		passwordAttempt: 'Too many failed password attempts. Account temporarily locked.',
		chatMessage: 'Too many messages. Please slow down.',
	};

	return messages[action] || 'Too many requests. Please try again later.';
}

/**
 * Log rate limiter configuration on startup
 */
export function logRateLimiterConfig() {
	console.log('Rate Limiter Configuration:');
	console.log(`  Session Creation: ${config.sessionCreation.points} per ${config.sessionCreation.duration}s`);
	console.log(`  Session Join: ${config.sessionJoin.points} per ${config.sessionJoin.duration}s`);
	console.log(`  Dice Rolls: ${config.diceRolls.points} per ${config.diceRolls.duration}s`);
	console.log(`  Commands: ${config.commands.points} per ${config.commands.duration}s`);
	console.log(`  Chat Messages: ${config.chatMessages.points} per ${config.chatMessages.duration}s`);
	console.log(`  Password Attempts: ${config.passwordAttempts.points} per ${config.passwordAttempts.duration}s (block: ${config.passwordAttempts.blockDuration}s)`);
}
