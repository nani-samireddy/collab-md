# 📝 Collaborative Markdown Editor

A real-time collaborative markdown editor built with Next.js, Socket.io, and TypeScript. Multiple users can edit documents simultaneously, see each other's cursors and text selections in real-time, and preview markdown with a beautiful Frappé-inspired UI.

![Collaborative Markdown Editor](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🚀 **Real-time Collaboration**
- **Live editing** - See changes from other users instantly
- **Live cursors** - View exactly where other users are typing with animated cursors
- **Text selections** - See what text other users have selected with colored highlights
- **User presence** - Know who's online with colored avatar indicators
- **Session-based rooms** - Create or join editing sessions with unique URLs

### 🎨 **Modern UI/UX**
- **Frappé-inspired design** - Clean, professional interface with card-based layout
- **Dark/Light mode** - Toggle between themes with system preference detection
- **Fully responsive** - Works seamlessly on mobile, tablet, and desktop
- **Split-pane editor** - Side-by-side editor and preview (stacked on mobile)
- **Smooth animations** - Subtle transitions and micro-interactions

### 📋 **Markdown Support**
- **Live preview** - Real-time markdown rendering with syntax highlighting
- **Rich formatting** - Support for headers, lists, code blocks, tables, and more
- **Sanitized output** - Safe HTML rendering with DOMPurify
- **Syntax highlighting** - Code blocks with proper formatting

### 🔧 **Developer Experience**
- **TypeScript** - Full type safety throughout the application
- **Modern tooling** - Next.js 15, Socket.io, Tailwind CSS
- **Hot reload** - Instant updates during development
- **Clean architecture** - Well-organized code structure

## 🏗️ Architecture

### **Frontend (Next.js + TypeScript)**
```
app/
├── page.tsx                    # Home page with session creation/joining
├── layout.tsx                  # Root layout with theme support
├── globals.css                 # Frappé-inspired design system
└── editor/[sessionId]/
    └── page.tsx               # Main collaborative editor
```

### **Backend (Custom Socket.io Server)**
```
server.js                      # Custom Node.js server with Socket.io
├── Session Management         # In-memory session storage
├── Real-time Events          # Cursor, selection, and content sync
└── User Presence             # Online user tracking
```

### **Real-time Communication Flow**
```
Client A ──┐
           ├─── Socket.io Server ──┐
Client B ──┘                      ├─── Session Storage
           ┌─────────────────────────┘
Client C ──┘
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm, yarn, or pnpm

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative-markdown-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### **Production Build**
```bash
npm run build
npm start
```

## 🎯 How to Use

### **Creating a Session**
1. Enter your name on the home page
2. Click "🚀 Create New Session"
3. Share the session URL with collaborators

### **Joining a Session**
1. Enter your name on the home page
2. Enter the session ID or use a shared link
3. Click "🔗 Join Session"

### **Collaborative Editing**
- **Type anywhere** - Your changes appear instantly for all users
- **See live cursors** - Other users' cursors show their names and positions
- **View selections** - Selected text is highlighted with user colors
- **Toggle preview** - Switch between editor-only and split-pane view
- **Theme switching** - Use the 🌙/☀️ button to toggle dark/light mode

## 🛠️ Technical Implementation

### **Real-time Synchronization**

**Socket.io Events:**
```typescript
// Client → Server
'join-session'     // Join a collaborative session
'content-change'   // Send text changes with cursor position
'cursor-move'      // Send cursor position updates

// Server → Client  
'session-state'    // Initial session data (content, users, cursors)
'user-joined'      // New user joined notification
'user-left'        // User left notification
'content-updated'  // Receive text changes from other users
'cursor-updated'   // Receive cursor position updates
```

**Session Management:**
```javascript
// In-memory session storage
const sessions = new Map();

// Session structure
{
  content: string,           // Current document content
  users: Map<socketId, User>, // Connected users
  cursors: Map<socketId, Cursor> // User cursor positions
}
```

### **Cursor Positioning Algorithm**

The editor uses a sophisticated cursor positioning system:

1. **DOM Measurement** - Uses `getComputedStyle()` to get accurate text metrics
2. **Line Calculation** - Splits content by newlines to determine line positions  
3. **Character Width** - Calculates character positions using font metrics
4. **Bounds Checking** - Ensures cursors stay within textarea boundaries

```typescript
const getCursorPosition = (position: number) => {
  const textarea = textareaRef.current;
  const style = window.getComputedStyle(textarea);
  const lineHeight = parseInt(style.lineHeight) || 24;
  const fontSize = parseInt(style.fontSize) || 14;
  
  // Calculate line and character position
  const textBeforeCursor = content.substring(0, position);
  const lines = textBeforeCursor.split('\n');
  const top = (lines.length - 1) * lineHeight + paddingTop;
  const left = (lines[lines.length - 1]?.length || 0) * charWidth + paddingLeft;
  
  return { top, left };
};
```

### **Text Selection Highlighting**

Multi-line text selections are rendered as multiple rectangles:

```typescript
const getSelectionRects = (start: number, end: number) => {
  // Split selection across lines
  // Calculate rectangle for each line
  // Handle single-line vs multi-line selections
  // Apply bounds checking
};
```

### **Theme System**

CSS custom properties enable seamless theme switching:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
  --accent-primary: #3b82f6;
}

[data-theme="dark"] {
  --bg-primary: #1e293b;
  --text-primary: #f8fafc;
  --accent-primary: #60a5fa;
}
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile** (< 640px): Stacked layout, touch-optimized controls
- **Tablet** (640px - 768px): Balanced layout with proper spacing  
- **Desktop** (> 768px): Full side-by-side experience

### **Mobile Optimizations**
- Stacked editor/preview layout
- Larger touch targets (44px minimum)
- Font size 16px+ to prevent zoom on iOS
- Optimized keyboard interactions

## 🎨 Design System

### **Frappé-Inspired Components**
```css
.frappe-card        /* Elevated cards with subtle shadows */
.frappe-button      /* Interactive buttons with hover effects */
.frappe-input       /* Form inputs with focus states */
.frappe-textarea    /* Code editor styling */
```

### **Color Palette**

**Light Mode:**
- Primary: `#ffffff` (Pure white)
- Secondary: `#f8fafc` (Slate 50)
- Text: `#1e293b` (Slate 800)
- Accent: `#3b82f6` (Blue 500)

**Dark Mode:**
- Primary: `#1e293b` (Slate 800)
- Secondary: `#334155` (Slate 700)
- Text: `#f8fafc` (Slate 50)
- Accent: `#60a5fa` (Blue 400)

## 🔧 Configuration

### **Environment Variables**
```bash
NODE_ENV=development  # or production
PORT=3000            # Server port (optional)
```

### **Next.js Configuration**
```javascript
// next.config.ts
const nextConfig = {
  serverExternalPackages: ['socket.io']
}
```

### **Socket.io Configuration**
```javascript
// server.js
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Manual Deployment**
```bash
npm run build
NODE_ENV=production npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework for production
- **Socket.io** - Real-time bidirectional event-based communication
- **Tailwind CSS** - Utility-first CSS framework
- **marked.js** - Markdown parser and compiler
- **DOMPurify** - XSS sanitizer for HTML

## 📞 Support

If you have any questions or run into issues:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include browser console logs and steps to reproduce

---

**Built with ❤️ using Next.js, Socket.io, and TypeScript**
