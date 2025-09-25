'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Moon, Sun, Copy, Eye, EyeOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';

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
	
	const [joinName, setJoinName] = useState('');

	const [socket, setSocket] = useState<Socket | null>(null);
	const [content, setContent] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [cursors, setCursors] = useState<Cursor[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [showPreview, setShowPreview] = useState(true);
	const { theme, setTheme } = useTheme();

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout>();

	const userColors = [
		'#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
		'#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
	];

	const handleJoinSession = () => {
		if (!joinName.trim()) {
			alert('Please enter your name');
			return;
		}
		
		const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
		const newUrl = `/editor/${sessionId}?name=${encodeURIComponent(joinName)}&color=${encodeURIComponent(randomColor)}`;
		router.push(newUrl);
	};

	useEffect(() => {
		if (!userName || !userColor) {
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

	const handleSelection = useCallback(() => {
		handleCursorMove();
	}, [handleCursorMove]);

	// Helper function to get text metrics
	const getTextMetrics = () => {
		if (!textareaRef.current) return null;
		
		const textarea = textareaRef.current;
		const style = window.getComputedStyle(textarea);
		
		// Create a canvas to measure character width accurately
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) return null;
		
		context.font = style.font;
		const charWidth = context.measureText('M').width; // Use 'M' as it's typically the widest character
		
		return {
			fontSize: parseInt(style.fontSize) || 14,
			lineHeight: parseFloat(style.lineHeight) || parseInt(style.fontSize) * 1.6,
			paddingTop: parseInt(style.paddingTop) || 0,
			paddingLeft: parseInt(style.paddingLeft) || 0,
			charWidth,
			scrollTop: textarea.scrollTop,
			scrollLeft: textarea.scrollLeft
		};
	};

	const getCursorPosition = (position: number) => {
		const metrics = getTextMetrics();
		if (!metrics || !textareaRef.current) return { top: 0, left: 0 };

		const textBeforeCursor = content.substring(0, Math.min(position, content.length));
		const lines = textBeforeCursor.split('\n');
		const lineNumber = lines.length - 1;
		const columnNumber = lines[lineNumber]?.length || 0;

		const top = lineNumber * metrics.lineHeight + metrics.paddingTop - metrics.scrollTop;
		const left = columnNumber * metrics.charWidth + metrics.paddingLeft - metrics.scrollLeft;

		return { top, left };
	};

	const getSelectionRects = (start: number, end: number) => {
		const metrics = getTextMetrics();
		if (!metrics || !textareaRef.current || start === end || start >= end) return [];

		const contentLength = content.length;
		const safeStart = Math.max(0, Math.min(start, contentLength));
		const safeEnd = Math.max(safeStart, Math.min(end, contentLength));

		if (safeStart === safeEnd) return [];

		const lines = content.split('\n');
		const rects = [];

		// Find start and end positions in terms of line and column
		let currentPos = 0;
		let startLine = 0, startCol = 0;
		let endLine = 0, endCol = 0;
		let foundStart = false, foundEnd = false;

		for (let lineIndex = 0; lineIndex < lines.length && !foundEnd; lineIndex++) {
			const lineLength = lines[lineIndex].length;
			const lineEndPos = currentPos + lineLength;

			// Find start position
			if (!foundStart && safeStart <= lineEndPos) {
				startLine = lineIndex;
				startCol = safeStart - currentPos;
				foundStart = true;
			}

			// Find end position
			if (foundStart && safeEnd <= lineEndPos) {
				endLine = lineIndex;
				endCol = safeEnd - currentPos;
				foundEnd = true;
			}

			currentPos = lineEndPos + 1; // +1 for the newline character
		}

		// Generate rectangles for each line in the selection
		for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
			const line = lines[lineIndex] || '';
			let rectStartCol = lineIndex === startLine ? startCol : 0;
			let rectEndCol = lineIndex === endLine ? endCol : line.length;

			// Skip empty rectangles
			if (rectStartCol >= rectEndCol && rectStartCol >= line.length) continue;

			// Ensure we don't exceed line bounds
			rectStartCol = Math.min(rectStartCol, line.length);
			rectEndCol = Math.min(rectEndCol, line.length);

			if (rectStartCol < rectEndCol || (rectStartCol === rectEndCol && rectEndCol < line.length)) {
				const top = lineIndex * metrics.lineHeight + metrics.paddingTop - metrics.scrollTop;
				const left = rectStartCol * metrics.charWidth + metrics.paddingLeft - metrics.scrollLeft;
				const width = Math.max((rectEndCol - rectStartCol) * metrics.charWidth, 2); // Minimum width of 2px
				const height = metrics.lineHeight;

				rects.push({ top, left, width, height });
			}
		}

		return rects;
	};

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	const copySessionLink = () => {
		const baseUrl = window.location.origin;
		const sessionUrl = `${baseUrl}/editor/${sessionId}`;
		navigator.clipboard.writeText(sessionUrl);

		const notification = document.createElement('div');
		notification.textContent = '✓ Session link copied!';
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #10b981;
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
			z-index: 1000;
			font-size: 14px;
			font-weight: 500;
		`;
		document.body.appendChild(notification);
		setTimeout(() => {
			if (document.body.contains(notification)) {
				document.body.removeChild(notification);
			}
		}, 3000);
	};

	const getMarkdownHtml = () => {
		if (!content.trim()) return '<p style="color: #6b7280">Preview will appear here...</p>';

		try {
			const html = marked.parse(content);
			return DOMPurify.sanitize(html);
		} catch (error) {
			return '<p style="color: #ef4444">Error rendering markdown</p>';
		}
	};

	if (!userName || !userColor) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
				<Card className="w-full max-w-md relative">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleTheme}
						className="absolute top-4 right-4"
						title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
					</Button>

					<CardHeader className="text-center">
						<CardTitle className="text-2xl font-bold">Join Session</CardTitle>
						<CardDescription>
							Join session <Badge variant="secondary" className="font-mono text-xs">{sessionId}</Badge>
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="joinName">Your Name</Label>
							<Input
								id="joinName"
								type="text"
								value={joinName}
								onChange={(e) => setJoinName(e.target.value)}
								placeholder="Enter your name"
								onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
							/>
						</div>
						
						<Button
							onClick={handleJoinSession}
							className="w-full"
							size="lg"
						>
							<Users className="mr-2 h-4 w-4" />
							Join Session
						</Button>
						
						<div className="text-center">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => router.push('/')}
								className="text-muted-foreground"
							>
								← Back to Home
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-14 items-center justify-between px-4">
					<div className="flex items-center space-x-4">
						<h1 className="text-lg font-semibold">Collab-MD</h1>
						<div className="flex items-center space-x-2">
							<Badge variant="secondary" className="font-mono text-xs">
								{sessionId}
							</Badge>
							<Button
								variant="ghost"
								size="sm"
								onClick={copySessionLink}
								title="Copy session link"
							>
								<Copy className="h-3 w-3" />
							</Button>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<div className="flex items-center space-x-1">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">{users.length}</span>
							</div>
							<div className="flex space-x-1">
								{users.map(user => (
									<Avatar key={user.id} className="h-6 w-6">
										<AvatarFallback 
											className="text-xs text-white"
											style={{ backgroundColor: user.color }}
											title={user.name}
										>
											{user.name[0].toUpperCase()}
										</AvatarFallback>
									</Avatar>
								))}
							</div>
						</div>

						<Separator orientation="vertical" className="h-6" />

						<Button
							variant="ghost"
							size="sm"
							onClick={toggleTheme}
							title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
						>
							{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
						</Button>

						<Toggle
							pressed={showPreview}
							onPressedChange={setShowPreview}
							aria-label="Toggle preview"
						>
							{showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</Toggle>
					</div>
				</div>
			</header>

			<div className={`flex-1 flex h-[calc(100vh-56px)] ${showPreview ? 'flex-col md:flex-row' : ''}`}>
				<div className={`${showPreview ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'} p-4`}>
					<Card className="h-full">
						<CardHeader>
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Editor
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0 h-[calc(100%-60px)]">
							<div className="editor-container relative p-4 h-full">
								<textarea
									ref={textareaRef}
									value={content}
									onChange={handleContentChange}
									onKeyUp={handleCursorMove}
									onMouseUp={handleCursorMove}
									onFocus={handleCursorMove}
									onSelect={handleSelection}
									onScroll={handleCursorMove}
									className="w-full h-full resize-none border-0 bg-transparent focus:outline-none focus:ring-0"
									placeholder="Start typing your markdown here..."
									style={{
										fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, monospace',
										fontSize: '14px',
										lineHeight: '1.6'
									}}
								/>
							
								{Object.values(cursors)
									.filter(cursor => cursor.userId !== socket?.id)
									.map(cursor => {
										const { top, left } = getCursorPosition(cursor.position);
										const hasSelection = cursor.selectionStart !== undefined && 
											cursor.selectionEnd !== undefined && 
											cursor.selectionStart !== cursor.selectionEnd;

										return (
											<div key={cursor.userId}>
												{hasSelection && cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined && (
													<>
														{getSelectionRects(cursor.selectionStart, cursor.selectionEnd).map((rect, index) => (
															<div
																key={`selection-${cursor.userId}-${index}`}
																className="absolute pointer-events-none"
																style={{
																	top: `${rect.top}px`,
																	left: `${rect.left}px`,
																	width: `${rect.width}px`,
																	height: `${rect.height}px`,
																	backgroundColor: `${cursor.userColor}30`,
																	border: `1px solid ${cursor.userColor}60`,
																	borderRadius: '2px',
																	zIndex: 1
																}}
															/>
														))}
													</>
												)}

												<div
													className="absolute pointer-events-none"
													style={{
														top: `${top}px`,
														left: `${left}px`,
														width: '2px',
														height: '20px',
														backgroundColor: cursor.userColor,
														zIndex: 2
													}}
												/>
												<div
													className="absolute pointer-events-none text-xs px-2 py-1 rounded text-white whitespace-nowrap"
													style={{
														top: `${top - 25}px`,
														left: `${left}px`,
														backgroundColor: cursor.userColor,
														fontSize: '11px',
														zIndex: 3
													}}
												>
													{cursor.userName}
												</div>
											</div>
										);
									})}
							</div>
						</CardContent>
					</Card>
				</div>

				{showPreview && (
					<div className="w-full md:w-1/2 h-1/2 md:h-full p-4">
						<Card className="h-full">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Preview
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 h-[calc(100%-60px)] overflow-y-auto">
								<div
									className="markdown-content prose prose-sm max-w-none dark:prose-invert"
									dangerouslySetInnerHTML={{ __html: getMarkdownHtml() }}
								/>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}