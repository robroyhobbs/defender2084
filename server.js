const express = require('express');
const app = express();
const port = 3000;

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something broke!');
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from the current directory
app.use(express.static('./', {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Start the server
app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop');
}); 