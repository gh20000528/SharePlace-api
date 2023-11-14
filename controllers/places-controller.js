const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator')
const getCoordsForAddress = require('../util/location')
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')
const Place = require('../models/place')
const User = require('../models/user');

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

    let user
    try {
      user = await User.findById(creator)
    } catch (error) {
      const err = new HttpError('Create place faild, please try again', 500)
      return next(err)
    }

    if(!user){
      const err = new HttpError('Could ot find user for provided id', 404)
      return next(err)
    }
    console.log(user);

    try {
      const sess = await mongoose.startSession()
      sess.startTransaction()
      await createPlace.save({ session: sess })
      await user.save({ session: sess })
      await sess.commitTransaction()
    } catch (err) {
      console.log(err);
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
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // 使用 deleteOne 方法進行事務內的文檔刪除
    const result = await Place.deleteOne({ _id: placeId }, { session: sess });

    if (result.deletedCount === 0) {
      const error = new HttpError('Place not found or already deleted', 404);
      return next(error);
    }

    // 確保 place.creator 存在，以及 places 屬性存在
    if (place.creator && place.creator.places) {
      // 將地點從相關用戶的 places 數組中刪除
      const index = place.creator.places.indexOf(place._id);
      if (index !== -1) {
        place.creator.places.splice(index, 1);
      }
      await place.creator.save({ session: sess });
    }

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;