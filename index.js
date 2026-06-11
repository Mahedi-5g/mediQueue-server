const express = require('express')
const app = express();
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT;

const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('mediQueue');
    const tutorCollection = db.collection('tutors-data');

    app.get('/tutors', async (req, res) => {
      const cursor = tutorCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result)
    })


    app.get('/all-tutors', async (req, res) => {
      const cursor = tutorCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })


    app.get('/tutors/:id', async (req, res) => {
      const { id } = req.params;

      const result = await tutorCollection.findOne({ _id: new ObjectId(id) })
      res.send(result);

    });

    app.post("/tutors", async (req, res) => {
      
        const tutor = req.body;

        const result = await tutorCollection.insertOne(tutor);

        res.send(result);
      
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
}
run();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})