const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store sessions and their data
const sessions = new Map();

app.prepare().then(() => {
	const httpServer = createServer((req, res) => {
		handle(req, res);
	});

	const io = new Server(httpServer, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"]
		}
	});

	io.on('connection', (socket) => {
		console.log('User connected:', socket.id);

		socket.on('join-session', ({ sessionId, userName, userColor }) => {
			socket.join(sessionId);

			// Initialize session if it doesn't exist
			if (!sessions.has(sessionId)) {
				sessions.set(sessionId, {
					content: '# Welcome to Collaborative Markdown Editor\n\nStart editing...',
					users: new Map(),
					cursors: new Map()
				});
			}

			const session = sessions.get(sessionId);

			// Add user to session
			session.users.set(socket.id, {
				id: socket.id,
				name: userName,
				color: userColor
			});

			// Send current state to the new user
			socket.emit('session-state', {
				content: session.content,
				users: Array.from(session.users.values()),
				cursors: Array.from(session.cursors.values())
			});

			// Notify others about the new user
			socket.to(sessionId).emit('user-joined', {
				id: socket.id,
				name: userName,
				color: userColor
			});

			console.log(`User ${userName} joined session ${sessionId}`);
		});

		socket.on('content-change', ({ sessionId, content, cursorPosition, selectionStart, selectionEnd }) => {
			const session = sessions.get(sessionId);
			if (session) {
				session.content = content;

				// Update cursor position and selection
				const user = session.users.get(socket.id);
				if (user) {
					session.cursors.set(socket.id, {
						userId: socket.id,
						userName: user.name,
						userColor: user.color,
						position: cursorPosition,
						selectionStart,
						selectionEnd
					});
				}

				// Broadcast to all other users in the session
				socket.to(sessionId).emit('content-updated', {
					content,
					cursor: session.cursors.get(socket.id)
				});
			}
		});

		socket.on('cursor-move', ({ sessionId, cursorPosition, selectionStart, selectionEnd }) => {
			const session = sessions.get(sessionId);
			if (session) {
				const user = session.users.get(socket.id);
				if (user) {
					session.cursors.set(socket.id, {
						userId: socket.id,
						userName: user.name,
						userColor: user.color,
						position: cursorPosition,
						selectionStart,
						selectionEnd
					});

					socket.to(sessionId).emit('cursor-updated', session.cursors.get(socket.id));
				}
			}
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);

			// Remove user from all sessions
			sessions.forEach((session, sessionId) => {
				if (session.users.has(socket.id)) {
					const user = session.users.get(socket.id);
					session.users.delete(socket.id);
					session.cursors.delete(socket.id);

					// Notify others about user leaving
					socket.to(sessionId).emit('user-left', socket.id);
				}
			});
		});
	});

	const port = process.env.PORT || 3000;
	httpServer.listen(port, () => {
		console.log(`Server running on http://localhost:${port}`);
	});
});
