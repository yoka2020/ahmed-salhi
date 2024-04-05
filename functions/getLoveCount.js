const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
    try {
        const imageId = parseInt(event.queryStringParameters.imageId);
        console.log('Received request to retrieve love count for image ID:', imageId);

        // Construct the path to db.json relative to the current working directory
        const dbFilePath = path.join(process.cwd(), 'db.json');

        // Retrieve the love count for the specified image ID from db.json
        const dbFile = fs.readFileSync(dbFilePath);
        const dbData = JSON.parse(dbFile);
        const loveCountData = dbData.LoveCounts.find(entry => entry.image_id === imageId);

        if (loveCountData) {
            console.log('Retrieved love count for image ID:', imageId, 'Count:', loveCountData.love_count);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, loveCount: loveCountData.love_count })
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: "Image not found." })
            };
        }
    } catch (error) {
        console.error('Error retrieving love count:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: "Internal server error." })
        };
    }
};
