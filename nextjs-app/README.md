# AI Compliance Tool - Next.js Frontend

A modern Next.js frontend for the AI Compliance Tool that connects to a FastAPI backend for multi-framework AI governance assessment.

## Features

- **Modern UI**: Clean, responsive design built with Next.js and Tailwind CSS
- **Framework Analysis**: Support for UK ICO, UK DPA/GDPR, EU AI Act, and ISO 42001
- **Real-time Progress**: Live updates during document analysis
- **PDF Reports**: Download comprehensive compliance reports
- **Document Upload**: Drag-and-drop PDF upload with validation
- **Responsive Design**: Works on desktop, tablet, and mobile

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │───►│  FastAPI Backend │
│  (Port 3000)    │    │   (Port 8000)    │
└─────────────────┘    └─────────────────┘
       │
       │ (proxy via /api/*)
       ▼
┌─────────────────┐
│  FastAPI Backend │
└─────────────────┘
                              │
                       ┌─────────────────┐
                       │ Python/LangGraph │
                       │   Pipeline       │
                       └─────────────────┘
```

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Icons**: Lucide React icons
- **API**: Calls FastAPI backend running on port 8000

## Setup

### Prerequisites

1. **Python Backend Running**: Make sure the FastAPI backend is running:
   ```bash
   # In the parent directory
   uvicorn api:app --reload --port 8000
   ```

2. **Node.js**: Version 18 or higher

### Installation

1. **Navigate to the Next.js app**:
   ```bash
   cd nextjs-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file** (optional):
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` if your backend is not on `localhost:8000`:
   ```
   BACKEND_URL=http://localhost:8000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   - Navigate to `http://localhost:3000`

## Usage

1. **Select Frameworks**: Choose which compliance frameworks to analyze (ICO, DPA, EU AI Act, ISO 42001)
2. **Upload PDF**: Drag and drop or click to upload a PDF document
3. **Run Analysis**: Click "🚀 Run Analysis" to start the process
4. **View Results**: See real-time results with scores, evidence, gaps, and priority actions
5. **Download Report**: Get a comprehensive PDF report of the analysis

## Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
src/
├── app/                 # App Router pages
│   ├── layout.tsx      # Root layout with header
│   ├── page.tsx        # Main compliance analysis page
│   └── globals.css     # Global styles with Tailwind
├── components/         # Reusable components
│   ├── Header.tsx      # Navigation header
│   ├── FileUpload.tsx  # PDF upload component
│   ├── FrameworkSelector.tsx
│   ├── StatsCards.tsx  # Metrics display
│   ├── AnalysisResults.tsx  # Results display
│   ├── FrameworkDescriptions.tsx
│   └── EmptyState.tsx  # Empty state component
└── ...
```

### API Integration

The app calls these FastAPI endpoints (proxied by Next.js rewrites):

- `POST /api/analyze` - Upload PDF and get analysis results
- `GET /api/report/{job_id}` - Download PDF report

Example API call:
```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: formData, // Contains file + frameworks
});
const data = await response.json();
```

### Styling

- **Framework**: Tailwind CSS
- **Design System**: Custom utility classes in `globals.css`
- **Components**: Responsive, accessible components
- **Icons**: Lucide React for consistent iconography

## Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables:
   - `BACKEND_URL=https://your-api-domain.com` (FastAPI URL)
4. Deploy

### Docker

```bash
# Build
docker build -t ai-compliance-frontend .

# Run
docker run -p 3000:3000 -e BACKEND_URL=http://localhost:8000 ai-compliance-frontend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | FastAPI backend URL (used by rewrite proxy) | `http://localhost:8000` |

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure FastAPI backend is running on port 8000
   - Check `BACKEND_URL` environment variable
   - Verify CORS is enabled in FastAPI

2. **Upload Not Working**
   - Check file is PDF format
   - Ensure file size is reasonable
   - Check browser console for errors

3. **Analysis Stuck**
   - Check FastAPI backend logs
   - Verify all required frameworks are selected
   - Check network connectivity

### Getting Help

1. Check browser console for JavaScript errors
2. Check FastAPI backend logs
3. Verify all dependencies are installed
4. Check that Python backend has required environment variables (PPLX_API_KEY)

## License

Part of the AI Governance Hub by Paul Kwarteng.
