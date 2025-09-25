# Contributing to Collab-MD

Thank you for your interest in contributing to Collab-MD! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Basic knowledge of React, Next.js, and Socket.io

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/collab-md.git
   cd collab-md
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

## 🎯 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/nani-samireddy/collab-md/issues) page
- Search existing issues before creating new ones
- Provide clear reproduction steps
- Include browser/OS information
- Add screenshots for UI issues

### Suggesting Features
- Open a GitHub issue with the `enhancement` label
- Describe the feature and its use case
- Explain why it would benefit users
- Consider implementation complexity

### Code Contributions

#### 1. Choose an Issue
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to indicate you're working on it
- Ask questions if anything is unclear

#### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

#### 3. Make Changes
- Follow the existing code style
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation if needed

#### 4. Submit a Pull Request
- Push your branch to your fork
- Create a pull request against the `main` branch
- Fill out the PR template completely
- Link to related issues

## 📝 Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Prefer functional components with hooks

### React Components
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow the existing component structure

### CSS/Styling
- Use Tailwind CSS classes
- Follow shadcn/ui patterns
- Use CSS variables for theming
- Ensure responsive design
- Test in both light and dark modes

### Socket.io Events
- Use descriptive event names
- Include proper error handling
- Document event payloads
- Follow existing patterns

## 🧪 Testing

### Manual Testing
- Test real-time collaboration with multiple browser tabs
- Verify cursor positioning and text selection
- Test theme switching
- Check responsive design on mobile
- Test session creation and joining

### Before Submitting
- [ ] Code compiles without errors
- [ ] No console errors or warnings
- [ ] Real-time features work correctly
- [ ] UI is responsive and accessible
- [ ] Dark/light themes work properly
- [ ] Session sharing works as expected

## 📁 Project Structure

```
collab-md/
├── app/                    # Next.js app directory
│   ├── editor/[sessionId]/ # Editor page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── theme-provider.tsx # Theme context
├── lib/                  # Utility functions
├── server.js            # Socket.io server
└── README.md           # Project documentation
```

## 🎨 Design System

### Colors
- Uses shadcn/ui semantic color tokens
- Supports automatic dark/light mode
- User cursors use predefined color palette

### Components
- Built with shadcn/ui components
- Consistent spacing and typography
- Accessible by default

### Typography
- Uses @tailwindcss/typography for markdown
- Monospace font for editor (JetBrains Mono)
- Proper heading hierarchy

## 🔧 Key Features to Understand

### Real-time Collaboration
- Socket.io handles real-time communication
- Cursor positions tracked with user metadata
- Text selections highlighted with user colors
- Content synchronized across all clients

### Session Management
- UUID-based session IDs
- In-memory session storage (consider persistence)
- User presence indicators
- Session link sharing

### Editor Features
- Live cursor positioning with DOM measurement
- Accurate text selection highlighting
- Scroll-aware positioning
- Canvas-based character width calculation

## 🚫 What Not to Do

- Don't break existing real-time functionality
- Don't introduce breaking changes without discussion
- Don't add dependencies without justification
- Don't ignore accessibility requirements
- Don't submit untested code

## 📋 Pull Request Template

When creating a PR, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Real-time features verified
- [ ] Responsive design checked
- [ ] Theme switching tested

## Screenshots
Include screenshots for UI changes

## Related Issues
Closes #issue-number
```

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing private information
- Spam or off-topic discussions

## 📞 Getting Help

- **Questions**: Open a GitHub discussion
- **Bugs**: Create a GitHub issue
- **Chat**: Comment on existing issues
- **Documentation**: Check the README.md

## 🎉 Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Mentioned in project documentation

Thank you for contributing to Collab-MD! 🚀
