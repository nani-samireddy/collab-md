'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { v4 as uuidv4 } from 'uuid';
import { Moon, Sun, Rocket, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const userColors = [
	'#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
	'#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
];

export default function Home() {
	const [userName, setUserName] = useState('');
	const [sessionId, setSessionId] = useState('');
	const { theme, setTheme } = useTheme();
	const router = useRouter();

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
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
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
			<Card className="w-full max-w-md relative">
				{/* Theme Toggle */}
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
					<CardTitle className="text-2xl font-bold">Collab-MD</CardTitle>
					<CardDescription>Real-time collaborative markdown editing</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="userName">Your Name</Label>
						<Input
							id="userName"
							type="text"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							placeholder="Enter your name"
							onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
						/>
					</div>
					
					<Button
						onClick={handleCreateSession}
						className="w-full"
						size="lg"
					>
						<Rocket className="mr-2 h-4 w-4" />
						Create New Session
					</Button>
					
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								or join existing
							</span>
						</div>
					</div>
					
					<div className="space-y-2">
						<Label htmlFor="sessionId">Session ID</Label>
						<Input
							id="sessionId"
							type="text"
							value={sessionId}
							onChange={(e) => setSessionId(e.target.value)}
							placeholder="Enter session ID"
							onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
						/>
					</div>
					
					<Button
						onClick={handleJoinSession}
						variant="outline"
						className="w-full"
						size="lg"
					>
						<Link className="mr-2 h-4 w-4" />
						Join Session
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
