'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface User {
	id: string;
	name: string;
	color: string;
}

interface Cursor {
	userId: string;
	userName: string;
	userColor: string;
	position: number;
	selectionStart?: number;
	selectionEnd?: number;
}

export default function EditorPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();

	const sessionId = params.sessionId as string;
	const userName = searchParams.get('name');
	const userColor = searchParams.get('color');

	const [socket, setSocket] = useState<Socket | null>(null);
	const [content, setContent] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [cursors, setCursors] = useState<Cursor[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [showPreview, setShowPreview] = useState(true);
	const [theme, setTheme] = useState('light');

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>();

	useEffect(() => {
		// Initialize theme
		const savedTheme = localStorage.getItem('theme') || 'light';
		setTheme(savedTheme);
		document.documentElement.setAttribute('data-theme', savedTheme);
	}, []);

	useEffect(() => {
		if (!userName || !userColor) {
			router.push('/');
			return;
		}

		const newSocket = io({
			transports: ['websocket', 'polling']
		});

		newSocket.on('connect', () => {
			console.log('Connected to server');
			setIsConnected(true);

			newSocket.emit('join-session', {
				sessionId,
				userName,
				userColor
			});
		});

		newSocket.on('disconnect', () => {
			console.log('Disconnected from server');
			setIsConnected(false);
		});

		newSocket.on('session-state', ({ content, users, cursors }) => {
			setContent(content);
			setUsers(users);
			setCursors(cursors);
		});

		newSocket.on('user-joined', (user) => {
			setUsers(prev => [...prev, user]);
		});

		newSocket.on('user-left', (userId) => {
			setUsers(prev => prev.filter(u => u.id !== userId));
			setCursors(prev => prev.filter(c => c.userId !== userId));
		});

		newSocket.on('content-updated', ({ content, cursor }) => {
			setContent(content);
			if (cursor) {
				setCursors(prev => {
					const filtered = prev.filter(c => c.userId !== cursor.userId);
					return [...filtered, cursor];
				});
			}
		});

		newSocket.on('cursor-updated', (cursor) => {
			setCursors(prev => {
				const filtered = prev.filter(c => c.userId !== cursor.userId);
				return [...filtered, cursor];
			});
		});

		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, [sessionId, userName, userColor, router]);

	const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		const cursorPosition = e.target.selectionStart;
		const selectionStart = e.target.selectionStart;
		const selectionEnd = e.target.selectionEnd;

		setContent(newContent);

		if (socket && isConnected) {
			socket.emit('content-change', {
				sessionId,
				content: newContent,
				cursorPosition,
				selectionStart,
				selectionEnd
			});
		}
	}, [socket, isConnected, sessionId]);

	const handleCursorMove = useCallback(() => {
		if (!textareaRef.current) return;

		const cursorPosition = textareaRef.current.selectionStart;
		const selectionStart = textareaRef.current.selectionStart;
		const selectionEnd = textareaRef.current.selectionEnd;

		if (cursorUpdateTimeoutRef.current) {
			clearTimeout(cursorUpdateTimeoutRef.current);
		}

		cursorUpdateTimeoutRef.current = setTimeout(() => {
			if (socket && isConnected) {
				socket.emit('cursor-move', {
					sessionId,
					cursorPosition,
					selectionStart,
					selectionEnd
				});
			}
		}, 100);
	}, [socket, isConnected, sessionId]);

	const getCursorPosition = (position: number) => {
		if (!textareaRef.current) return { top: 0, left: 0 };

		const textarea = textareaRef.current;
		const style = window.getComputedStyle(textarea);
		const lineHeight = parseInt(style.lineHeight) || 24;
		const fontSize = parseInt(style.fontSize) || 14;
		const paddingTop = parseInt(style.paddingTop) || 0;
		const paddingLeft = parseInt(style.paddingLeft) || 0;

		// Create a temporary div to measure text
		const div = document.createElement('div');
		div.style.position = 'absolute';
		div.style.visibility = 'hidden';
		div.style.whiteSpace = 'pre-wrap';
		div.style.wordWrap = 'break-word';
		div.style.font = style.font;
		div.style.width = textarea.clientWidth - paddingLeft * 2 + 'px';
		document.body.appendChild(div);

		const textBeforeCursor = content.substring(0, position);
		div.textContent = textBeforeCursor;

		const range = document.createRange();
		const textNode = div.firstChild;
		if (textNode) {
			range.setStart(textNode, textBeforeCursor.length);
			range.setEnd(textNode, textBeforeCursor.length);
			const rect = range.getBoundingClientRect();
			const divRect = div.getBoundingClientRect();

			const top = rect.top - divRect.top + paddingTop;
			const left = rect.left - divRect.left + paddingLeft;

			document.body.removeChild(div);
			return { top, left };
		}

		document.body.removeChild(div);

		// Fallback to line-based calculation
		const lines = textBeforeCursor.split('\n');
		const top = (lines.length - 1) * lineHeight + paddingTop;
		const left = (lines[lines.length - 1]?.length || 0) * (fontSize * 0.6) + paddingLeft;

		return { top, left };
	};

	const getSelectionRects = (start: number, end: number) => {
		if (!textareaRef.current || start === end || start >= end) return [];

		const textarea = textareaRef.current;
		const style = window.getComputedStyle(textarea);
		const lineHeight = parseInt(style.lineHeight) || 24;
		const fontSize = parseInt(style.fontSize) || 14;
		const paddingTop = parseInt(style.paddingTop) || 0;
		const paddingLeft = parseInt(style.paddingLeft) || 0;
		const textareaWidth = textarea.clientWidth - paddingLeft * 2;
		const textareaHeight = textarea.clientHeight - paddingTop * 2;

		// Ensure start and end are within content bounds
		const contentLength = content.length;
		const safeStart = Math.max(0, Math.min(start, contentLength));
		const safeEnd = Math.max(safeStart, Math.min(end, contentLength));

		const textBeforeStart = content.substring(0, safeStart);
		const selectedText = content.substring(safeStart, safeEnd);

		if (!selectedText) return [];

		const allLines = content.split('\n');
		const startLines = textBeforeStart.split('\n');
		const startLineIndex = startLines.length - 1;
		const startCharIndex = startLines[startLineIndex]?.length || 0;

		const selectedLines = selectedText.split('\n');
		const rects = [];
		const charWidth = fontSize * 0.6; // More accurate character width estimation

		for (let i = 0; i < selectedLines.length; i++) {
			const currentLineIndex = startLineIndex + i;
			const lineText = selectedLines[i];
			const lineTop = currentLineIndex * lineHeight + paddingTop;

			// Skip if line is outside visible area
			if (lineTop < 0 || lineTop > textareaHeight) continue;

			let lineLeft = paddingLeft;
			let lineWidth = 0;

			if (selectedLines.length === 1) {
				// Single line selection
				lineLeft += startCharIndex * charWidth;
				lineWidth = lineText.length * charWidth;
			} else if (i === 0) {
				// First line of multi-line selection
				lineLeft += startCharIndex * charWidth;
				const currentLine = allLines[currentLineIndex] || '';
				const remainingChars = currentLine.length - startCharIndex;
				lineWidth = remainingChars * charWidth;
			} else if (i === selectedLines.length - 1) {
				// Last line of multi-line selection
				lineWidth = lineText.length * charWidth;
			} else {
				// Middle lines of multi-line selection
				const currentLine = allLines[currentLineIndex] || '';
				lineWidth = currentLine.length * charWidth;
			}

			// Ensure selection doesn't go outside textarea bounds
			const maxWidth = textareaWidth - (lineLeft - paddingLeft);
			lineWidth = Math.min(lineWidth, maxWidth);
			lineWidth = Math.max(lineWidth, 2); // Minimum width for visibility

			// Only add rect if it's within bounds
			if (lineLeft >= paddingLeft && lineLeft < textareaWidth + paddingLeft && lineWidth > 0) {
				rects.push({
					top: Math.max(lineTop, paddingTop),
					left: lineLeft,
					width: lineWidth,
					height: Math.min(lineHeight, textareaHeight - (lineTop - paddingTop))
				});
			}
		}

		return rects;
	};

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);
		document.documentElement.setAttribute('data-theme', newTheme);
	};

	const copySessionLink = () => {
		// Create clean session URL without user parameters
		const baseUrl = window.location.origin;
		const sessionUrl = `${baseUrl}/editor/${sessionId}`;
		navigator.clipboard.writeText(sessionUrl);

		// Show a better notification
		const notification = document.createElement('div');
		notification.textContent = '✓ Session link copied!';
		notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-success);
      color: white;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
    `;
		document.body.appendChild(notification);
		setTimeout(() => {
			document.body.removeChild(notification);
		}, 3000);
	};

	const getMarkdownHtml = () => {
		if (!content.trim()) return '<p style="color: var(--text-muted)">Preview will appear here...</p>';

		try {
			const html = marked.parse(content);
			return DOMPurify.sanitize(html);
		} catch (error) {
			return '<p style="color: var(--accent-danger)">Error rendering markdown</p>';
		}
	};

	if (!userName || !userColor) {
		return null;
	}

	return (
		<div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
			{/* Header */}
			<header className="frappe-card border-b-0 rounded-none px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center space-x-4 flex-wrap">
						<h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
							📝 Collaborative Editor
						</h1>
						<div className="flex items-center space-x-2 text-sm">
							<span style={{ color: 'var(--text-muted)' }}>Session:</span>
							<code className="px-2 py-1 rounded text-xs font-mono" style={{
								background: 'var(--bg-tertiary)',
								color: 'var(--text-primary)',
								border: '1px solid var(--border-primary)'
							}}>
								{sessionId}
							</code>
							<button
								onClick={copySessionLink}
								className="frappe-button frappe-button-secondary text-xs px-2 py-1"
							>
								📋 Copy Link
							</button>
						</div>
					</div>

					<div className="flex items-center space-x-4 flex-wrap">
						{/* Theme Toggle */}
						<button
							onClick={toggleTheme}
							className="frappe-button frappe-button-secondary p-2"
							title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
						>
							{theme === 'light' ? '🌙' : '☀️'}
						</button>

						{/* Connection Status */}
						<div className="flex items-center space-x-2">
							<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
							<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
								{isConnected ? 'Connected' : 'Disconnected'}
							</span>
						</div>

						{/* Online Users */}
						<div className="flex items-center space-x-2">
							<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online:</span>
							<div className="flex space-x-1">
								{users.map(user => (
									<div
										key={user.id}
										className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm"
										style={{ backgroundColor: user.color }}
										title={user.name}
									>
										{user.name[0].toUpperCase()}
									</div>
								))}
							</div>
						</div>

						{/* Preview Toggle */}
						<button
							onClick={() => setShowPreview(!showPreview)}
							className={`frappe-button px-3 py-2 text-sm ${showPreview
									? 'frappe-button-primary'
									: 'frappe-button-secondary'
								}`}
						>
							{showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className={`flex-1 flex h-[calc(100vh-80px)] ${showPreview ? 'flex-col md:flex-row' : ''}`}>
				{/* Editor Panel */}
				<div className={`${showPreview ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'} p-2 md:p-4`}>
					<div className="frappe-card h-full fade-in">
						<div className="p-3 md:p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
							<h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
								✏️ Editor
							</h2>
						</div>
						<div className="editor-container relative p-2 md:p-4 h-[calc(100%-50px)] md:h-[calc(100%-60px)]">
							<textarea
								ref={textareaRef}
								value={content}
								onChange={handleContentChange}
								onKeyUp={handleCursorMove}
								onMouseUp={handleCursorMove}
								onFocus={handleCursorMove}
								className="frappe-textarea h-full"
								placeholder="# Start typing your markdown here...\n\nThis is a **collaborative** editor. Others can see your cursor and selections in real-time!"
								style={{ minHeight: '100%' }}
							/>

							{/* Render other users' cursors and selections */}
							{cursors
								.filter(cursor => cursor.userId !== socket?.id)
								.map(cursor => {
									const { top, left } = getCursorPosition(cursor.position);
									const hasSelection = cursor.selectionStart !== undefined &&
										cursor.selectionEnd !== undefined &&
										cursor.selectionStart !== cursor.selectionEnd;

									return (
										<div key={cursor.userId}>
											{/* Render text selection */}
											{hasSelection && cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined && (
												<>
													{getSelectionRects(cursor.selectionStart, cursor.selectionEnd).map((rect, index) => (
														<div
															key={`selection-${cursor.userId}-${index}`}
															className="user-selection"
															style={{
																top: `${Math.max(0, rect.top)}px`,
																left: `${Math.max(0, rect.left)}px`,
																width: `${Math.max(2, rect.width)}px`,
																height: `${Math.max(1, rect.height)}px`,
																backgroundColor: cursor.userColor,
																borderColor: cursor.userColor,
																opacity: 0.2,
																zIndex: 5,
																maxWidth: '100%',
																maxHeight: '100%'
															}}
														/>
													))}
												</>
											)}

											{/* Render cursor */}
											<div
												className="cursor-indicator"
												style={{
													top: `${top}px`,
													left: `${left}px`,
													backgroundColor: cursor.userColor
												}}
											/>
											<div
												className="cursor-label"
												style={{
													top: `${top - 25}px`,
													left: `${left}px`,
													backgroundColor: cursor.userColor
												}}
											>
												{cursor.userName}
											</div>
										</div>
									);
								})}
						</div>
					</div>
				</div>

				{/* Preview Panel */}
				{showPreview && (
					<div className="w-full md:w-1/2 h-1/2 md:h-full p-2 md:p-4">
						<div className="frappe-card h-full fade-in">
							<div className="p-3 md:p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
								<h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
									👁️ Preview
								</h2>
							</div>
							<div className="p-3 md:p-4 h-[calc(100%-50px)] md:h-[calc(100%-60px)] overflow-y-auto">
								<div
									className="markdown-content prose prose-sm max-w-none"
									style={{ color: 'var(--text-primary)' }}
									dangerouslySetInnerHTML={{ __html: getMarkdownHtml() }}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
