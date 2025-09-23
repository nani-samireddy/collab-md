export interface User {
	id: string;
	name: string;
	color: string;
}

export interface Cursor {
	userId: string;
	userName: string;
	userColor: string;
	position: number;
	selectionStart?: number;
	selectionEnd?: number;
}

export interface Session {
	content: string;
	users: Map<string, User>;
	cursors: Map<string, Cursor>;
}

export interface SocketEvents {
	'join-session': (data: { sessionId: string; userName: string; userColor: string }) => void;
	'content-change': (data: { sessionId: string; content: string; cursorPosition: number; selectionStart: number; selectionEnd: number }) => void;
	'cursor-move': (data: { sessionId: string; cursorPosition: number; selectionStart: number; selectionEnd: number }) => void;
	'session-state': (data: { content: string; users: User[]; cursors: Cursor[] }) => void;
	'user-joined': (user: User) => void;
	'user-left': (userId: string) => void;
	'content-updated': (data: { content: string; cursor?: Cursor }) => void;
	'cursor-updated': (cursor: Cursor) => void;
}
