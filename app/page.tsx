'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const userColors = [
	'#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
	'#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
];

export default function Home() {
	const [userName, setUserName] = useState('');
	const [sessionId, setSessionId] = useState('');
	const [theme, setTheme] = useState('light');
	const router = useRouter();

	useEffect(() => {
		// Check for saved theme or system preference
		const savedTheme = localStorage.getItem('theme') || 
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		setTheme(savedTheme);
		document.documentElement.setAttribute('data-theme', savedTheme);
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);
		document.documentElement.setAttribute('data-theme', newTheme);
	};

	const handleCreateSession = () => {
		if (!userName.trim()) {
			alert('Please enter your name');
			return;
		}
		
		const newSessionId = uuidv4().substring(0, 8);
		const userColor = userColors[Math.floor(Math.random() * userColors.length)];
		
		router.push(`/editor/${newSessionId}?name=${encodeURIComponent(userName)}&color=${encodeURIComponent(userColor)}`);
	};

	const handleJoinSession = () => {
		if (!userName.trim()) {
			alert('Please enter your name');
			return;
		}
		
		if (!sessionId.trim()) {
			alert('Please enter a session ID');
			return;
		}
		
		const userColor = userColors[Math.floor(Math.random() * userColors.length)];
		
		router.push(`/editor/${sessionId}?name=${encodeURIComponent(userName)}&color=${encodeURIComponent(userColor)}`);
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-secondary)' }}>
			<div className="frappe-card p-8 w-full max-w-md relative">
				{/* Theme Toggle */}
				<button
					onClick={toggleTheme}
					className="frappe-button frappe-button-secondary absolute top-4 right-4 p-2"
					title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				>
					{theme === 'light' ? '🌙' : '☀️'}
				</button>

				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
						Collaborative Markdown Editor
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Real-time collaboration with live cursors and preview
					</p>
				</div>
				
				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
							Your Name
						</label>
						<input
							type="text"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							className="frappe-input"
							placeholder="Enter your name"
							onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
						/>
					</div>
					
					<button
						onClick={handleCreateSession}
						className="frappe-button frappe-button-primary w-full py-3 text-base font-medium"
					>
						🚀 Create New Session
					</button>
					
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }} />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-3" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
								or join existing
							</span>
						</div>
					</div>
					
					<div>
						<label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
							Session ID
						</label>
						<input
							type="text"
							value={sessionId}
							onChange={(e) => setSessionId(e.target.value)}
							className="frappe-input"
							placeholder="Enter session ID to join"
							onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
						/>
					</div>
					
					<button
						onClick={handleJoinSession}
						className="frappe-button frappe-button-secondary w-full py-3 text-base font-medium"
					>
						🔗 Join Session
					</button>
				</div>

				<div className="mt-8 text-center">
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
						Built with Next.js, Socket.io & ❤️
					</p>
				</div>
			</div>
		</div>
	);
}
