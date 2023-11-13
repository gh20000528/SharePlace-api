const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator')
const getCoordsForAddress = require('../util/location')
const { v4: uuidv4 } = require('uuid');
const Place = require('../models/place')

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place

  try {
    place = await Place.findById(placeId)    
  } catch (error) {
    const err = new HttpError(
      'Something went weong,could not find a place ', 500
    )
    return next(err)
  }

  if (!place) {
    const error = new HttpError('Could not find a place for the provided id.', 404);

    return next(error)
  }

  res.json({ place: place.toObject({getters: true})}); // => { place } => { place: place }
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places
  try {
    places = await Place.find({ creator: userId })
  } catch (error) {
    const err = new HttpError('Something went weong,could not find a user ', 500)
    return next(err)
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError('Could not find a place for the provided user id.', 404)
    );
  }

  res.json({ places: places.map(place => place.toObject({getters:true})) });
};


const createPlace = async (req, res, next) => {
    const error = validationResult(req)
    if(!error.isEmpty()){
      return next(new HttpError('請檢查是否都有填寫', 422))
    }
    const { title, description, address, creator } = req.body

    let coordinates;
    try {
      coordinates = await getCoordsForAddress(address)
    } catch (error) {
      return next(error)
    }

    const createPlace = new Place({
      title,
      description,
      address,
      location: coordinates,
      image:'https://i.pinimg.com/564x/fa/57/33/fa5733eaff9184aac5d2e81e4d0c19ad.jpg',
      creator
    })

    try {
      await createPlace.save()
    } catch (err) {
      const error = new HttpError(
        'Creating place failed, please try again',
        500
      )
      return next(error)
    }


    res.status(201).json({place: createPlace})
}

const updatePlace = async (req, res, next) => {
  const error = validationResult(req)
  if(!error.isEmpty()){
    throw new HttpError('請檢查是否都有填寫', 422)
  }
  const { title, description } = req.body
  const placeId = req.params.pid

  let place
  try {
    place = await Place.findById(placeId)
  } catch (error) {
    const err = new HttpError('Something went worng,could not updaate', 500)
    return next(err)
  }

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (error) {
    const err = new HttpError('something went wrong, could not update place', 500)
    return next(err)
  }

  res.status(200).json({place: place.toObject({getters: true})})
}

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid
  
  let place
  try {
    place = await Place.findById(placeId)
  } catch (error) {
    const err = new HttpError('Something went wrong, could not delete', 500)
    console.log(error);
    return next(err)
  }

  try {
    await place.deleteOne()
  } catch (error) {
    const err = new HttpError('Something went wrong, could not delete', 500)
    console.log(error);
    return next(err)
  }
  res.status(200).json({message: 'delete place'})
}
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;