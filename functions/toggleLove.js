const fs = require('fs');

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const imageId = requestBody.imageId;
        const userId = requestBody.userId;

        console.log(`Received request to toggle love count for image ID: ${imageId}, User ID: ${userId}`);

        // Check if the user has already interacted with this image
        if (!userId || !imageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: "User ID and Image ID are required." })
            };
        }

        // Toggle the love count based on the user's interaction
        const dbFile = fs.readFileSync('db.json');
        const dbData = JSON.parse(dbFile);
        const loveCountData = dbData.LoveCounts.find(entry => entry.image_id === imageId);

        if (loveCountData) {
            loveCountData.love_count++;
            fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));
            console.log(`Love count incremented for image ${imageId}`);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, action: 'increment' })
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: "Image not found." })
            };
        }
    } catch (error) {
        console.error('Error toggling love count:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: "Internal server error." })
        };
    }
};

