const express = require('express');
const app = express();
const path = require("path");
const multer = require('multer');
const Data = require("./models/data.js");
app.use(express.urlencoded({ extended: true }));
const MethodOverride = require('method-override');
app.use(MethodOverride('_method'));
app.use(express.json());
app.set("view engine" , "ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname , "/public")));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
const upload = multer({ dest: 'public/uploads/' });

const bcrypt = require("bcryptjs");



const mongoose = require('mongoose');
main().then(()=> {console.log("connection succedded!")})
.catch(err=>{console.log(err)});
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/facemash');
}
// i had initiate my database with 10 entries 
let users =[
    
]
Data.insertMany(users);
const K = 32; // K-factor is a constant used in the Elo rating system
// elo algo to rank the players 
function calculateNewRatings(winnerRating, loserRating, winnerWon) {
    const winnerExpected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 1400));
    const loserExpected = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 1400));

    const winnerNewRating = winnerRating + K * (1 - winnerExpected);
    const loserNewRating = loserRating + K * (0 - loserExpected);

    return [Math.round(winnerNewRating), Math.round(loserNewRating)];
}

// get two random user after comparisiobn btw two had completed 
async function getRandomEntries(count) {
    try {
        const allEntries = await Data.find().exec();
        
        if (allEntries.length < count) {
            console.log("Not enough entries in the database.");
            return [];
        }
        //  Knuth Shuffle. 
        for (let i = allEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allEntries[i], allEntries[j]] = [allEntries[j], allEntries[i]];
        }
        return allEntries.slice(0, count);
    } catch (error) {
        console.error("Error getting random entries:", error);
        return [];
    }
}
getRandomEntries(2);
    







app.listen(8080,(req,res)=>{
    console.log("listening on port 8080...");
})

app.get('/home', async (req, res) => {
    try {
        const randomEntries = await getRandomEntries(2);
        if (randomEntries.length === 2) {
            const [user1, user2] = randomEntries;
            res.render('home.ejs', { user1, user2 });
        } else {
            res.render('home.ejs', { user1: null, user2: null });
        }
    } catch (err) {
        console.error("Error getting random entries:", err);
        res.status(500).send("Internal Server Error");
    }
});

// app.get('/home', (req, res) => {
//     const user1 = { name: 'Test User 1', image: '/images/image1.jpeg' };
//     const user2 = { name: 'Test User 2', image: '/images/image2.jpeg' };
//     res.render('home.ejs', { user1, user2 });
// });



app.get("/about",(req,res)=>{
    res.render('about.ejs');
})
app.get("/submit", async (req, res) => {
    try {
        const allEntries = await Data.find().sort({ rating: -1 }).exec(); // Sort by rating in descending order
        res.render("airs.ejs", { allEntries });
    } catch (error) {
        console.error("Error fetching entries:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/ranking", async (req, res) => {
    try {
        
        const allusers = await Data.find();
        
        res.render("users.ejs", { allusers });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/previous",(req,res)=>{
    res.redirect('/home');
})

app.get("/users/new" ,(req,res)=>{
    res.render("new.ejs");
})






app.post("/users", upload.single('image'), async (req, res) => {
    try {
        const { name, email, password, description } = req.body;
        const image = req.file ? req.file.filename : 'default.jpg'; // Default image if none is provided

        // Hash the password before storing it
        const saltRounds = 10; // You can adjust the salt rounds as needed
        const hashedPassword = await bcrypt.hash(password, saltRounds);
       
     

        // Create a new user with hashed password
        const newUser = new Data({
            name,
            email,
            password: hashedPassword,
            description,
            image: `/uploads/${image}`
        });
        

        // Save the new user to the database
        await newUser.save();
        res.redirect('/ranking'); // Redirect to the ranking page or another page
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send("Error registering user");
    }
});
// api 
app.get('/new-entries', async (req, res) => {
    try {
        const randomEntries = await getRandomEntries(2);
        res.json(randomEntries);
    } catch (err) {
        console.error("Error getting new entries:", err);
        res.status(500).send("Internal Server Error");
    }
});



app.post('/update-ratings', async (req, res) => {
    try {
        const { winnerId, loserId } = req.body;

        // Fetch both users
        const [winner, loser] = await Promise.all([
            Data.findById(winnerId).exec(),
            Data.findById(loserId).exec()
        ]);

        if (!winner || !loser) {
            return res.status(404).send("User not found");
        }

        // Calculate new ratings
        const [newWinnerRating, newLoserRating] = calculateNewRatings(winner.rating, loser.rating, true);

        // Update the users' ratings
        winner.rating = newWinnerRating;
        loser.rating = newLoserRating;

        await Promise.all([
            winner.save(),
            loser.save()
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating ratings:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/users/:id", async (req, res) => {
    try {
        let userId = req.params.id;
        let entry = await Data.findById(userId);
        if (entry) {
            res.render("profile.ejs", { entry });
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        res.status(500).send("Server Error");
    }
});
app.get("/users/:id/edit" ,async (req ,res)=>{
    try {
        let userId = req.params.id;
        let entry = await Data.findById(userId);
        if (entry) {
            res.render("edit.ejs", { entry });
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        res.status(500).send("Server Error");
    }

})


app.patch("/users/:id", upload.single('image'), async (req, res) => {
    try {
        const { name, description, password } = req.body;
       
        const image = req.file ? req.file.filename : null;
        const id = req.params.id;

        // Find the user by ID
        const user = await Data.findById(id);
        

        if (user) {
            // Compare provided password with hashed password in the database
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // Apply changes if the password matches
                user.name = name || user.name; // Update only if new value is provided
                user.description = description || user.description;
                if (image) {
                    user.image = `/uploads/${image}`;
                }
                
                // Save updated user
                await user.save();
                res.redirect(`/users/${id}`);
            } else {
                res.status(401).send("Invalid password");
            }
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        console.error("Error saving user:", err);
        res.status(500).send("Error saving user");
    }
});


// api for top 5 trending users 
app.get('/trending-users', async (req, res) => {
    try {
        const trendingUsers = await Data.find().sort({ rating: -1 }).limit(5).exec(); // Fetch top 5 users by rating
        res.json(trendingUsers);
    } catch (error) {
        console.error('Error fetching trending users:', error);
        res.status(500).send('Server Error');
    }
});

