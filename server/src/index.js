require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var morgan  = require('morgan');

let Reviews = null;

if (process.env.DB_TYPE === 'mysql') {
  Reviews = require('../../db-mysql/controllers/Reviews.js');
} else if (process.env.DB_TYPE === 'mongo') {
  Reviews = require('../../db-nosql/controllers/Reviews.js');
} else {
  throw new Error('Database type not specified: set either \'mongo\' or \'mysql\' in .env.');
}

const app = express();
const jsonParser = bodyParser.json();

// Disabled for production
// Client files will be served over proxy instead: this is just for testing.
app.use(express.static(path.join(__dirname, '/../../client')));

// logging
app.use(morgan('dev'));

// Get average stars and total reviews
// result format: {totalReviews: INT, averageScore: number with two decimal places}
// if item has no reviews, returns 0 and null respectively
app.get('/api/items/:itemID/stats', function (req, res) {
  const query = req.params.itemID;
  Reviews.getReviewsData(query).then((data) => {
    res.send(data);
  });
})

// Get a page of reviews for item with ID itemID.
// page is an integer. One page is 10 reviews.
app.get('/api/items/:itemID/:page', function (req, res) {
  const query = req.params.itemID;
  let offset = Math.floor(req.params.page * 10) - 10;
  if (offset < 0) {
    offset = 0;
  }
  Reviews.getReviewsForItemID(query, offset).then((reviews) => {
    res.send(reviews);
  });
})

// Post a new review to item with ID itemID.
// Requires data shape: {stars: INT, text: 'REVIEW_STRING', user_id: INT}
app.post('/api/items/:itemID', jsonParser, function (req, res) {
  const itemID = Number(req.params.itemID);
  const review = { ...req.body, item_id: itemID };
  Reviews.addNewReviewByIDs(review).then((newReview) => {
    res.send(newReview);
  });
})

// Possible future route that'll allow posting new reviews by item/user name rather than ID?

app.listen(3000, () => console.log('Now listening on port 3000'));
