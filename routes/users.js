const express = require("express");
const router = express.Router();
const verify = require("../Middleware/verifyToken");
const {
  editUserValidation,
  editUserPasswordValidation,
} = require("../validation");
const bcrypt = require("bcryptjs");

const path = require("path");
const sharp = require("sharp");

//Multer Setup
const multer = require("multer");
const uploadImg = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
  },
  fileFilter: function (_req, file, cb) {
    checkImagesType(file, cb);
  },
});
const uploadProfile = uploadImg.single("profile");

// Setup Firebase
const { firebaseApp } = require("../firebaseConfig");
const storage = firebaseApp.storage();
const bucket = storage.bucket();

// Model
const users = require("../model/users");
const movieSeason = require("../model/movieSeason");
const movieGroup = require("../model/movieGroup");
const bill = require("../model/bill");

/* GET User data. */
router.get("/me", verify, async (req, res, next) => {
  try {
    const user = await users
      .findById(req.user._id)
      .populate({ path: "wishlist", select: "poster title description" })
      .select({ password: 0 });
    res.json(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update User data
router.patch("/me", verify, async (req, res, next) => {
  const validation = editUserValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    // check duplicate email / username
    // const emailExist = await users.findOne({ email: validation.value.email });
    const usernameExist = await users.findOne({
      username: validation.value.username,
    });
    // if (emailExist) return res.status(400).send("Email already exists");
    if (usernameExist && usernameExist._id != req.user._id)
      return res.status(400).send("Username already exists");

    if (validation.value.description === undefined)
      validation.value.description = "";

    if (validation.value.name === undefined)
      validation.value.name = validation.value.username;
    // Hash password
    // if (validation.value.hasOwnProperty("password")) {
    //   const salt = await bcrypt.genSalt(10);
    //   validation.value.password = await bcrypt.hash(
    //     validation.value.password,
    //     salt
    //   );
    // }

    try {
      const user = await users
        .findByIdAndUpdate(req.user._id, validation.value, {
          new: true,
        })
        .select("username name description");
      res.send(user);
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

router.get("/me/library", verify, async (req, res) => {
  try {
    const library = await users
      .findById(req.user._id)
      .select("library")
      .populate({ path: "library", select: "detail title description poster" });
    res.json(library);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/me/library/:id", verify, async (req, res) => {
  try {
    const responseSeason = await movieSeason
      .find({
        group_id: req.params.id,
      })
      .populate({
        path: "movie",
        match: { purchase_user: { $all: req.user._id } },
        select: { media: 1, name: 1 },
      })
      .select("name");
    res.json(responseSeason);
  } catch (error) {
    res.status(400).send(error);
  }
});

// add movie group to wishlist
router.post("/me/wishlist/:id", verify, async (req, res) => {
  try {
    const responseMovie = await movieGroup.findById(req.params.id);
    if (responseMovie) {
      const user = await users
        .findByIdAndUpdate(
          req.user._id,
          { $addToSet: { wishlist: responseMovie._id } },
          {
            new: true,
          }
        )
        .populate({ path: "wishlist", select: "poster title description" })
        .select("wishlist");
      res.json(user.wishlist[0]);
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/me/wishlist/:id", verify, async (req, res) => {
  try {
    const user = await users
      .findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: req.params.id } },
        {
          new: true,
        }
      )
      .select({ password: 0 });
    res.json(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get("/me/bill", verify, async (req, res) => {
  try {
    const bills = await bill
      .find({ user_id: req.user._id })
      .populate({ path: "order", select: "media name" })
      .populate({ path: "order_group", select: "poster title" });
    res.json(bills);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/me/profile", verify, async (req, res) => {
  try {
    const response = await users.findById(req.user._id);
    if (response) {
      uploadProfile(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(405).json({ error });
        } else if (error) {
          // An unknown error occurred when uploading.
          res.status(405).json({ error });
        } else {
          const width = 256;
          const height = 256;
          const file = req.file.buffer;
          const sharpOption = {
            quality: 20,
            chromaSubsampling: "4:4:4",
          };
          const img = await sharp(file)
            .resize(width, height)
            .webp(sharpOption)
            .toBuffer();

          const folder = "profile";
          const fileName = `${Date.now()}.webp`;
          const path = `${folder}/${response._id}/${fileName}`;
          const fileUpload = bucket.file(path);
          const blobStream = fileUpload.createWriteStream({
            metadata: {
              contentType: "image/webp",
            },
          });

          blobStream.on("error", (error) => {
            res.status(405).json(error);
          });

          blobStream.on("finish", async () => {
            const url = fileUpload.publicUrl();

            try {
              const updateResponse = await users
                .findByIdAndUpdate(
                  response._id,
                  { profile: url },
                  {
                    new: true,
                  }
                )
                .select("profile");

              res.json(updateResponse);
            } catch (error) {
              res.status(500).send(error);
            }
          });

          blobStream.end(img);
        }
      });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/me/password", verify, async (req, res) => {
  const validation = editUserPasswordValidation(req.body);
  if (validation.hasOwnProperty("error"))
    return res.status(400).send(validation.error.details[0].message);
  else {
    try {
      const user = await users.findById(req.user._id);
      if (user) {
        const errorMessage = "Password is wrong";
        // Check Password
        const validPass = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (validPass) {
          // Hash Password
          const salt = await bcrypt.genSalt(10);
          validation.value.newPassword = await bcrypt.hash(
            validation.value.newPassword,
            salt
          );

          const responseUser = await users
            .findByIdAndUpdate(
              req.user._id,
              { password: validation.value.newPassword },
              {
                new: true,
              }
            )
            .select({ password: 0 });
          res.send("Changed Password");
        } else return res.status(400).send(errorMessage);
      }
    } catch (error) {
      res.json(error);
    }
  }
});

function checkImagesType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|tiff|gif|bmp|webp/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb("Allow jpeg,jpg,png,tiff,gif,bmp,webp Only!");
  }
}

module.exports = router;
