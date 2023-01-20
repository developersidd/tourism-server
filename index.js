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

// firebase admin initialize 
let serviceAccount = require("./ab_tourism.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// data Base related Functionality
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.minbj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {

    if (req?.headers.authorization?.startsWith("Bearer ")) {
        const idToken = req.headers.authorization.split("Bearer ")[1];
        try {
            const decoded = await admin.auth().verifyIdToken(idToken);
            req.decodedEmail = decoded.email;
        } catch {
        }
    }
    next();
}


async function run() {

    try {
        await client.connect();
        const database = client.db("AB_tourism");
        const Tourism_slider_data = database.collection("Torism_slider");
        const tour_collection_data = database.collection("tour_collection");
        const clicked_collections = database.collection("clicked_collections");

        // all about order functions
        app.get("/ordered_tour", async (req, res) => {
            const data = await clicked_collections.find({}).toArray();
            res.json(data);
        })

        // get slider data from db
        app.get("/sliders_data", async (req, res) => {
            const result = await Tourism_slider_data.find({}).toArray();
            res.json(result);
        });

        // all about tour functions 

        // get tour packages from db
        app.get("/tours", async (req, res) => {
            const result = await tour_collection_data.find({}).toArray();
            res.json(result);
        });


        //// get my_orders from db
        app.get("/users/:email", verifyToken, async (req, res) => {
            const { email } = req.params;
            if (req?.decodedEmail === email) {
                const result = await clicked_collections.find({ email: email }).toArray();
                res.json(result);
            } else {
                res.status(401).json({ message: "User not authorized" })
            }
        });

        // get a tour using id
        app.get("/signle_pd/:id", async (req, res) => {
            const { id } = req.params;
            const result = await tour_collection_data.findOne({ _id: ObjectId(id) });
            res.json(result);
        });


        // delete a tour
        app.delete("/:tourId", async (req, res) => {
            const id = req.params.tourId;
            const result = await clicked_collections.deleteOne({ _id: ObjectId(id) });
            res.json(result);
        });

        // add a Order Collection 
        app.post("/add_a_collection", async (req, res) => {
            const tour = req.body;
            const result = await clicked_collections.insertOne(tour);
            res.json(result);
        });


        // add a tour 
        app.post("/add_tour", async (req, res) => {
            const newTour = req.body;
            const result = await tour_collection_data.insertOne(newTour);
            res.json(result);
        });

    }
    //end

    finally {

    }

}
run().catch((err) => console.log(err));

app.get("/", async (req, res) => {
    res.json("Running");
});

app.listen(port, () => {
    console.log("Running Project at port", port);
})