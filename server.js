const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jsonServer = require("json-server");

const app = express();
const port = process.env.PORT || 5500;

// Enable CORS
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database('gallery.sqlite', sqlite3.OPEN_READWRITE);

// JSON Server
const jsonServerApp = jsonServer.create();
const jsonRouter = jsonServer.router("db.json");
const jsonMiddlewares = jsonServer.defaults();

jsonServerApp.use(jsonMiddlewares);
jsonServerApp.use(jsonRouter);

// Middleware to parse JSON bodies
app.use(express.json());

// Track user interactions to prevent multiple interactions
const userInteractions = {};

// Define route to handle POST request for toggling love count
app.post('/toggleLove', (req, res) => {
    const imageId = req.body.imageId;
    const userId = req.body.userId;

    console.log(`Received request to toggle love count for image ID: ${imageId}, User ID: ${userId}`);

    // Check if the user has already interacted with this image
    if (!userId || !imageId) {
        res.status(400).json({ success: false, error: "User ID and Image ID are required." });
        return;
    }

    if (userInteractions[userId] && userInteractions[userId][imageId]) {
        // If the user has already interacted with this image, return an error
        res.status(400).json({ success: false, error: "User has already interacted with this image." });
    } else {
        // Toggle the love count based on the user's interaction
        db.get('SELECT love_count FROM images WHERE id = ?', [imageId], (err, row) => {
            if (err) {
                console.error('Error retrieving love count:', err.message);
                res.status(500).json({ success: false, error: "Internal server error." });
            } else {
                const currentCount = row ? row.love_count : 0;
                const action = userInteractions[userId] && userInteractions[userId][imageId] ? 'decrement' : 'increment';
                const newCount = action === 'increment' ? currentCount + 1 : currentCount - 1;

                // Update the love count in the database
                db.run('UPDATE images SET love_count = ? WHERE id = ?', [newCount, imageId], function(updateErr) {
                    if (updateErr) {
                        console.error('Error updating love count:', updateErr.message);
                        res.status(500).json({ success: false, error: "Internal server error." });
                    } else {
                        console.log(`Love count ${action === 'increment' ? 'incremented' : 'decremented'} for image ${imageId}`);
                        // Mark the interaction for the user and image
                        if (!userInteractions[userId]) {
                            userInteractions[userId] = {};
                        }
                        userInteractions[userId][imageId] = true;
                        res.json({ success: true, action: action });
                    }
                });
            }
        });
    }
});

// Retrieve and return the love count for a specific image
app.get('/getLoveCount/:imageId', (req, res) => {
    const imageId = req.params.imageId;
    console.log('Received request to retrieve love count for image ID:', imageId);

    db.get('SELECT love_count FROM images WHERE id = ?', [imageId], (err, row) => {
        if (err) {
            console.error('Error retrieving love count:', err.message);
            res.status(500).json({ success: false, error: "Internal server error." });
        } else {
            console.log('Retrieved love count for image ID:', imageId, 'Count:', row ? row.love_count : 0);
            res.json({ success: true, loveCount: row ? row.love_count : 0 });
        }
    });
});

// Combine both servers to run on the same port
app.use('/api', jsonServerApp);

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});