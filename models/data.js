const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String, 
        default: 'image10.jpg.crdownload'
    },
    rating: {
        type: Number,
        default: 1400
    },
    description: {
        type: String,
        
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const Data = mongoose.model("Data", dataSchema);
module.exports = Data;
