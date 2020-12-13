const express = require("express");
const router = express.Router();
const verify = require("./verifyToken");
const users = require("../model/users");
const request = require("request");

const CLIENT = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_API;

router.post("/add", verify, (req, res) => {
  const money = req.body.money;
  const currency = req.body.currency;
  const detail = {
    auth: {
      user: CLIENT,
      pass: SECRET,
    },
    body: {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      transactions: [
        {
          amount: {
            total: money,
            currency: currency,
          },
        },
      ],
      redirect_urls: {
        return_url: "/",
        cancel_url: "/",
      },
    },
    json: true,
  };
  request.post(PAYPAL_API + "/v1/payments/payment", detail, (err, response) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    let token;

    for (let link of response.body.links) {
      if (link.rel === "approval_url") {
        token = link.href.match(/EC-\w+/)[0];
      }
    }

    res.json({
      token: token,
    });
  });
});

router.post("/add/execute", verify, (req, res) => {
  const paymentID = req.body.paymentID;
  const payerID = req.body.payerID;
  const money = req.body.money;
  const detail = {
    auth: {
      user: CLIENT,
      pass: SECRET,
    },
    body: {
      payer_id: payerID,
      transactions: [
        {
          amount: {
            total: money.money,
            currency: money.currency,
          },
        },
      ],
    },
    json: true,
  };
  request.post(
    PAYPAL_API + "/v1/payments/payment/" + paymentID + "/execute",
    detail,
    async (err, response) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }

      const user = await users
        .findById(req.user._id)
        .select({ coins: 1, _id: 0 });
      await users.findByIdAndUpdate(
        req.user._id,
        { coins: parseFloat(user.coins + money.money) },
        {
          new: true,
          useFindAndModify: false,
        }
      );

      res.json({
        status: "success",
        order: response.body.transactions,
      });
    }
  );
});

module.exports = router;
