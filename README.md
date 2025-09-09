# EduTrack Admin Panel

Educational Management System built with React and Node.js

## Features

- Modern, responsive admin dashboard
- User management (Students, Teachers, Parents, Admins)
- Attendance tracking
- Leave request management
- Reports and analytics
- Beautiful UI with Tailwind CSS

## Adding Local Images

### For Login Background

1. **Place your image in the public folder:**
   ```
   admin-panel/public/images/background.jpg
   ```

2. **Update the Login.jsx file:**
   ```jsx
   {/* Option 1: Use a local image from public folder */}
   <img 
     src="/images/background.jpg" 
     alt="Background" 
     className="w-full h-full object-cover"
   />
   ```

3. **Alternative: Use CSS background-image:**
   ```jsx
   <div 
     className="absolute inset-0 opacity-10"
     style={{
       backgroundImage: 'url(/images/background.jpg)',
       backgroundSize: 'cover',
       backgroundPosition: 'center'
     }}
   ></div>
   ```

### Supported Image Formats
- JPG/JPEG
- PNG
- WebP
- SVG

### Image Optimization Tips
- Use images under 1MB for better performance
- Recommended dimensions: 1920x1080 or larger
- Consider using WebP format for better compression

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

## Color Scheme

The application uses a consistent color palette:
- **Primary**: Blue (`blue-500`, `blue-600`)
- **Success**: Green (`green-500`, `green-600`)
- **Warning**: Yellow (`yellow-500`, `yellow-600`)
- **Info**: Purple (`purple-500`, `purple-600`)
- **Background**: Light gray (`gray-50`)
- **Text**: Dark gray (`gray-800`, `gray-700`)
- **Borders**: Medium gray (`gray-200`, `gray-300`)
