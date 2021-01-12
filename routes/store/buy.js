const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");

// Model
const movie = require("../../model/movie");
const users = require("../../model/users");
const bill = require("../../model/bill");

/* create bill */
router.post("/bill", verify, async (req, res) => {
  try {
    // find movie in array
    const movieOrder = await movie.find().where("_id").in(req.body).exec();
    const user = await users.findById(req.user._id);

    // if in array has owned movie
    if (movieOrder.some((movie) => user.library.includes(movie._id)))
      res.status(400).json("you are owned");
    // if in arry has movie that user is creator of movie
    else if (
      movieOrder.some(
        (movie) => movie.user_id.toString() === user._id.toString()
      )
    )
      res.status(400).json("you are creator of this movie");
    // create bill
    else {
      const createBill = new bill({
        user_id: user._id,
        order: req.body,
      });

      const billSave = await createBill.save();
      res.json(billSave);
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete bill
router.delete("/bill/:id", verify, async (req, res) => {
  try {
    const delBil = await bill.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    res.json(delBil);
  } catch (error) {
    res.status(400).send(error);
  }
});

// checkout
router.post("/:id", verify, async (req, res) => {
  try {
    // find bill id
    const bills = await bill
      .findOne({
        _id: req.params.id,
        user_id: req.user._id,
        status: false,
      })
      .populate("user_id")
      .populate("order");
    const user = bills.user_id;
    const order = bills.order;

    // total price in bill
    const initialValue = 0;
    const totalPrice = order.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.price;
    }, initialValue);

    // if user have enough money
    if (user.coins >= totalPrice) {
      // Deduct user money
      const payMoney = await users.findByIdAndUpdate(
        user._id,
        {
          coins: parseFloat(user.coins - totalPrice).toFixed(2),
        },
        {
          new: true,
        }
      );

      // loop movie in order
      order.forEach(async (movieOrder) => {
        // add to user library
        const addLibrary = await users.findByIdAndUpdate(user._id, {
          $addToSet: {
            library: movieOrder.group_id,
          },
        });

        // add user id to movie
        const addPurchase = await movie.findByIdAndUpdate(movieOrder._id, {
          $addToSet: {
            purchase_user: user._id,
          },
        });

        if (addLibrary && addPurchase) {
          // add money to movie creator
          await users.findByIdAndUpdate(
            movieOrder.user_id,
            {
              coins: parseFloat(user.coins + movieOrder.price).toFixed(2),
            },
            {
              new: true,
              useFindAndModify: false,
            }
          );
        }
      });

      // success bill
      const success = await bill.findByIdAndUpdate(
        bills._id,
        { status: true },
        {
          new: true,
          useFindAndModify: false,
        }
      );
      res.json(success);
    } else {
      res.status(400).send("You don't have enough coins");
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = router;
