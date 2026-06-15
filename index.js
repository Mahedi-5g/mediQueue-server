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
    const bookingCollection = db.collection("bookings");

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

    app.get("/my-tutors/:email", async (req, res) => {
      const { email } = req.params;

      const result = await tutorCollection
        .find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.get("/bookings/:studentEmail", async (req, res) => {
      const { studentEmail } = req.params

      const result = await bookingCollection.find({ studentEmail }).toArray();
      res.json(result)
    })


    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const tutor = await tutorCollection.findOne({
        _id: new ObjectId(booking.tutorId),
      });
      if (!tutor) {
        return res.status(404).send({
          message: "Tutor not found",
        });
      }

      if (tutor.totalSlot <= 0) {
        return res.status(400)
          .send({
            message:
              "No available slots left",
          });
      }

      const today = new Date();
      const sessionDate =
        new Date(tutor.sessionStartDate);

      if (today < sessionDate) {
        return res.status(400).send({
          message:
            "Booking is not available yet for this tutor"
        });
      }
      booking.status = "Booked";
      const result = await bookingCollection.insertOne(booking);
      await tutorCollection.updateOne({ _id: new ObjectId(booking.tutorId), },
        { $inc: { totalSlot: -1, }, });

      return res.send({ success: true, message: "Booking Successful", result });
    });



    app.patch("/bookings/:id", async (req, res) => {
      const { id } = req.params;

      const result = await bookingCollection.updateOne({ _id: new ObjectId(id) },
        {
          $set: { status: "Cancelled" },
        }
      );

      res.send(result);
    });


    app.patch("/tutors/:id", async (req, res) => {
      const { id } = req.params;
      const updatedTutor = req.body;

      const result = await tutorCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updatedTutor,
        }
      );

      res.send(result);
    });


    app.delete("/tutors/:id", async (req, res) => {
      const { id } = req.params;

      const result = await tutorCollection.deleteOne({
        _id: new ObjectId(id),
      });

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