# Contributing to Live Support System

Thank you for your interest in contributing to the Live Support System! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- SQL Server 2019+
- Git

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/live-support-system.git`
3. Install dependencies: `npm run install:all`
4. Set up the database using the provided schema
5. Start development servers: `npm run dev`

## 📝 Code Style

### TypeScript
- Use TypeScript for all new code
- Follow the existing type definitions
- Use interfaces for object shapes
- Prefer type over interface for simple types

### React Components
- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow the existing component structure
- Use CSS-in-JS for styling

### Backend
- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement proper error handling
- Add logging for debugging

## 🧪 Testing

### Frontend Testing
```bash
cd FrontEnd
npm test
```

### Backend Testing
```bash
cd BackEnd
npm test
```

## 📋 Pull Request Process

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test your changes thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Commit Message Format
Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for maintenance

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

## ✨ Feature Requests

When requesting features, please include:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if applicable
- Implementation suggestions if you have any

## 📞 Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! 🎉
