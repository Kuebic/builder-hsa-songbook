# HSA Songbook

A Progressive Web App (PWA) for worship songbook management, featuring offline capabilities, chord charts, and collaborative setlists.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- MongoDB (local or MongoDB Atlas)
- Clerk account for authentication

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd builder-hsa-songbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   # MongoDB Connection (Required)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # Clerk Authentication (Required)
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Optional
   PING_MESSAGE="ping pong"
   ```

   **Important:**
   - Copy `.env.example` as a starting point
   - Replace with your actual MongoDB connection string
   - Get your Clerk key from https://dashboard.clerk.dev

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:8080

## 🔧 Troubleshooting

### Database Connection Issues

If you see a 500 error or database connection failures:

1. **Check your .env file exists** in the project root (not in subdirectories)
2. **Verify your MongoDB URI** is correct and properly formatted
3. **For MongoDB Atlas:**
   - Ensure your IP address is whitelisted
   - Check username/password are correct
   - Verify the database name in the connection string
4. **For local MongoDB:**
   - Ensure MongoDB service is running
   - Default connection string: `mongodb://localhost:27017/hsa-songbook`

### Common Error Messages

- **"MONGODB_URI is not defined"**: Your .env file is missing or not being loaded
- **"ECONNREFUSED"**: MongoDB is not running or connection details are wrong
- **"Authentication failed"**: Check your MongoDB username/password
- **"ETIMEDOUT"**: Network issues or IP not whitelisted in MongoDB Atlas

## 🚀 Deployment

### Vercel Deployment

1. **Push your code to GitHub**

2. **Import project in Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard:
     - `MONGODB_URI`
     - `VITE_CLERK_PUBLISHABLE_KEY`

3. **Deploy**
   - Vercel will automatically build and deploy your app
   - API functions are handled by `/api/index.ts`

### Environment Variables in Vercel

Add these in your Vercel project settings:
- `MONGODB_URI` - Your production MongoDB connection string
- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk production key
- `NODE_ENV` - Set to "production"

## 📁 Project Structure

```
.
├── client/          # React frontend
├── server/          # Express backend
├── api/             # Vercel serverless functions
├── public/          # Static assets
├── dist/            # Build output
├── .env             # Local environment variables (git ignored)
├── .env.example     # Environment template
├── vercel.json      # Vercel configuration
└── package.json     # Project dependencies
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:client` - Build frontend only
- `npm run build:server` - Build backend only
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

## 🌐 Features

- **Offline Support**: PWA with service workers
- **Chord Management**: ChordPro parsing and transposition
- **Collaborative Setlists**: Share and manage song lists
- **User Authentication**: Secure login with Clerk
- **Responsive Design**: Works on all devices
- **Database Optimization**: Designed for MongoDB free tier (512MB)

## 📝 License

[Your License Here]

## 🤝 Contributing

[Your Contributing Guidelines Here]
