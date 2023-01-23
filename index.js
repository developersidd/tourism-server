//Dependencies
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
const app = express();
require("dotenv").config();

// Environment variables
const port = process.env.PORT || 5000;

// Middle Ware
app.use(cors());
app.use(express.json());

/*// firebase admin initialize 
let serviceAccount = require("./ab_tourism.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
*/
// data Base related Functionality
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.minbj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

/*async function verifyToken(req, res, next) {

    if (req?.headers.authorization?.startsWith("Bearer ")) {
        const idToken = req.headers.authorization.split("Bearer ")[1];
        try {
            const decoded = await admin.auth().verifyIdToken(idToken);
            //console.log(decoded);
            req.decodedEmail = decoded.email;
        } catch (err) {
            console.log(err);
        }
    }
    next();
}
*/
client.connect();
const database = client.db("AB_tourism");
const Tourism_slider_data = database.collection("Torism_slider");
const tour_collection_data = database.collection("tour_collection");
const clicked_collection = database.collection("clicked_collection");
const user_collection = database.collection("user_collection");


app.get("/", (req, res) => {
    res.json("Running");
});

// get all booked tour
app.get("/ordered_tour/:email",  async (req, res) => {
    const email = req.params.email;
    //check user is authorized or not
    if (req?.decodedEmail === email) {
        // check if the requested user is admin or not
        const adminUser = await user_collection.findOne({ email: email });
        if (adminUser.role === 'admin') {
            const data = await clicked_collection.find({}).toArray();
            res.status(200).json(data);
        } else {
            callback(401, { message: "Authorization failure!" })
        }
    } else {
        res.status(403).json({ message: "Authentication failed!" });
    }
});

// get slider data from db
app.get("/sliders_data", async (req, res) => {
    const result = await Tourism_slider_data.find({}).toArray();
    res.json(result);
});


// get tour packages from db
app.get("/tours", async (req, res) => {
    const result = await tour_collection_data.find({}).toArray();
    res.json(result);
});

//// get my_orders from db
app.get("/users/:email",  async (req, res) => {
    const { email } = req.params;
    if (req?.decodedEmail === email) {
        const result = await clicked_collection.find({ email: email }).toArray();
        res.status(200).json(result);
    } else {
        res.status(403).json({ message: "Authentication failed!" });
    }
});

// get a tour using id
app.get("/single_pd/:id/:email",  async (req, res) => {
    const { id } = req.params;
    const email = req.params.email;
    if (req?.decodedEmail === email) {
        const result = await tour_collection_data.findOne({ _id: ObjectId(id) });
        res.status(200).json(result);
    } else {
        res.status(403).json({ message: "Authentication failed!" });
    }
});

// check admin role
app.get("/check_admin/:email",  async (req, res) => {
    const { email } = req.params;
    if (req.decodedEmail === email) {
        let isAdmin = false;
        const result = await user_collection.findOne({ email: email });
        if (result?.role === "admin") {
            isAdmin = true;
            res.status(200).json({ isAdmin });
        } else {

        }
    } else {
        res.status(403).json({ message: "Authentication failed!" });
    }
});

// delete a tour
app.delete("/:tourId/:email",  async (req, res) => {
    const id = req.params.tourId;
    const email = req.params.email;
    if (req?.decodedEmail === email) {
        const result = await clicked_collection.deleteOne({ _id: ObjectId(id) });
        res.status(200).json(result);
    }
    else {
        callback(403, { message: "Authentication failure!" })
    }
});

// delete a booked tour for admin
app.delete("delete_tour_admin/:tourId/:email",  async (req, res) => {
    const id = req.params.tourId;
    const email = req.params.email;

    //check user is authorized or not
    if (req.decodedEmail === email) {
        // check if the requested user is admin or not
        const adminUser = await user_collection.findOne({ email: req.params.email });
        if (adminUser.role === 'admin') {
            const result = await clicked_collection.deleteOne({ _id: ObjectId(id) });
            res.status(200).json(result);
        } else {
            callback(401, { message: "Authorization failure!" })
        }
    } else {
        callback(403, { message: "Authentication failure!" })
    }
});

// add registered user 
app.post("/add_user", async (req, res) => {
    const user = req.body;
    const result = await user_collection.insertOne(user);
    res.status(200).json(result);
});

// add google user
app.put("/add_user", async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const updateDoc = { $set: user };
    const option = { upsert: true };
    const result = await user_collection.updateOne(filter, updateDoc, option);
    console.log("result", result)

    res.status(200).json(result);
});

// Make admin for admin
app.put("/make_admin/:email",  async (req, res) => {
    const email = req.params.email;
    const filter = { email: req.body?.email };
    const updateDoc = { $set: { role: "admin" } };
    const option = { upsert: true };
    //check user is authorized or not
    if (req.decodedEmail === email) {
        // check if the requested user is admin or not
        const adminUser = await user_collection.findOne({ email: email });
        if (adminUser?.role === 'admin') {
            const result = await user_collection.updateOne(filter, updateDoc, option);
            res.status(200).json(result);
        } else {
            callback(401, { message: "Authorization failure!" })
        }
    } else {
        callback(403, { message: "Authentication failure!" })
    }

});

// add a Order Collection 
app.post("/add_a_collection/:email",  async (req, res) => {
    const tour = req.body;
    const email = req.params.email;
    if (req.decodedEmail === email) {
        const result = await clicked_collection.insertOne(tour);
        res.json(result);
    } else {
        callback(403, { message: "Authentication failure!" })
    }
});

// add a tour for admin 
app.post("/add_tour/:email",  async (req, res) => {
    const newTour = req.body;
    const email = req.params.email;
    //check user is authorized or not
    if (req?.decodedEmail === email) {
        // check if the requested user is admin or not
        const adminUser = await user_collection.findOne({ email: email });
        if (adminUser?.role === 'admin') {
            const result = await tour_collection_data.insertOne(newTour);
            res.status(200).json(result);
        } else {
            callback(401, { message: "Authorization failure!" })
        }
    } else {
        callback(403, { message: "Authentication failure!" })
    }
});

// 404 Error Handler
app.use((req, res, next) => {
    const error = new Error("The requested page does not exist!");
    error.status = 404;
    res.status(error.status).json(error.message);
});

//Default Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        next(err);
    };
    res.status(err.status || 500).json(err.message || "There was an Error");
});



app.listen(port, () => {
    console.log("Running Project at port", port);
})