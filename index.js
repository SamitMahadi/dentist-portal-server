const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

//middleware//
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ovpnih.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {

        const appointmentOptionCollection = client.db('dentistPortal').collection('appointmentOptions');

        const bookingsCollection = client.db('dentistPortal').collection('bookings');

        const usersCollection = client.db('dentistPortal').collection('users');


        ///use aggregate to query multiple  collection to merge the data////
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            console.log(date);
            const query = {}
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options)
        })

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }


            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You Already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })

            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }

            res.status(403).send({ accessToken: '' })

        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })






    }

    finally {

    }
}
run().catch(console.log)





app.get('/', async (req, res) => {
    res.send('dentist portal server is running')
})

app.listen(port, () => console.log(`dentist portal running on ${port}`))


/*//
 *bookings
 *app.get('/bookings')
 *app.get(/booking/:id)
 *app.post('/bookings')
 *app.patch('/bookings/:id)
 /*app.delete('/bookings/:id)
 ////*/