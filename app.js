const express = require('express')
const mongoose = require('mongoose')
const placeRoutes = require('./routes/place-routes')
const userRoutes = require('./routes/user-routes')
const bodyParser = require('body-parser')
const mongoURI = process.env.MONGO_URI
const app = express()

app.use(bodyParser.json())

app.use('/api/places',placeRoutes)
app.use('/api/users',userRoutes)


app.use((error, req, res, next) => {
    if(res.headerSent){
        return next(error)
    }
    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occurred'})
})

mongoose
    .connect(mongoURI)
    .then(() => {
        app.listen(8000)
    })
    .catch(err => console.log(err))