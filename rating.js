const mongoose = require('mongoose');
const Data = require('./path/to/your/model'); // Adjust the path as necessary

async function updateExistingDocuments() {
    try {
        // Connect to your MongoDB
        await mongoose.connect('mongodb://localhost:27017/facemash', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Update existing documents to include default values for email and password
        await Data.updateMany(
            { email: { $exists: false } }, // Find documents where email does not exist
            { $set: { email: 'default@example.com', password: 'defaultpassword' } } // Set default values
        );

        console.log('Documents updated successfully');
    } catch (error) {
        console.error('Error updating documents:', error);
    } finally {
        // Close the connection
        mongoose.connection.close();
    }
}

// Run the update function
updateExistingDocuments();
