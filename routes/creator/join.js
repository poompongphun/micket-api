const express = require("express");
const router = express.Router();
const verify = require("../../Middleware/verifyToken");
const verifyCreator = require("../../Middleware/verifyCreator");

// Model
const users = require("../../model/users");

const price = 9.99;
/* GET Price. */
router.get("/price", async (req, res, next) => {
  res.json({
    price: price,
  });
});

// Become Creator
router.post("/", verify, async (req, res, next) => {
  try {
    const user = await users
      .findById(req.user._id)
      .select({ coins: 1, _id: 0 });
    if (user.coins >= price) {
      const response = await users
        .findByIdAndUpdate(
          req.user._id,
          { coins: parseFloat(user.coins - price).toFixed(2), creator: true },
          {
            new: true,
            useFindAndModify: false,
          }
        )
        .select({ creator: 1, _id: 0 });

      res.json({
        status: "success",
        message: response,
      });
    } else {
      res.status(400).send("You don't have enough coins");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// Cancel Creator
router.delete("/", verifyCreator, async (req, res, next) => {
  try {
    const response = await users
      .findByIdAndUpdate(
        req.user._id,
        { creator: false },
        {
          new: true,
          useFindAndModify: false,
        }
      )
      .select({ creator: 1, _id: 0 });

    res.json({
      status: "success",
      message: response,
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// // Get My Movie
// router.get("/movie", verifyCreator, async (req, res) => {
//   const response = await movies.find({ user_id: req.user._id });
//   res.json(response);
// });

// // Upload Movie
// router.post("/movie", verifyCreator, async (req, res) => {
//   // Custom Error handling
//   upload(req, res, function (error) {
//     if (error instanceof multer.MulterError) {
//       // A Multer error occurred when uploading.
//       res.status(405).json({ error });
//     } else if (error) {
//       // An unknown error occurred when uploading.
//       res.status(405).json({ error });
//     } else {
//       const folder = "movie";
//       const fileName = `${Date.now()}.mp4`;
//       const path = `${folder}/${fileName}`;
//       const fileUpload = bucket.file(path);
//       const blobStream = fileUpload.createWriteStream({
//         metadata: {
//           contentType: "video/mp4",
//         },
//       });

//       // Upload Error
//       blobStream.on("error", (error) => {
//         res.status(405).json(error);
//       });

//       // Upload Success
//       blobStream.on("finish", async () => {
//         // Create new movie
//         const movie = new movies({
//           user_id: req.user._id,
//           title: req.file.originalname,
//           video: {
//             url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${folder}%2F${fileName}?alt=media`,
//             path: path,
//           },
//         });
//         try {
//           const createUser = await movie.save();
//           res.status(200).send(createUser);
//         } catch (error) {
//           fileUpload.delete().then(function (data) {
//             res.status(400).send(error);
//           });
//         }
//       });

//       try {
//         // Upload Files
//         blobStream.end(req.file.buffer);
//       } catch (error) {
//         res.status(405).json({ error: "file can't be empty" });
//       }
//     }
//   });
// });

// // Update Movie
// router.patch("/movie/:id", verifyCreator, async (req, res) => {
//   try {
//     const movie = await movies.findOneAndUpdate(
//       { _id: req.params.id, user_id: req.user._id },
//       req.body,
//       {
//         new: true,
//       }
//     );
//     res.send(movie);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Delete Movie
// router.delete("/movie/:id", verifyCreator, async (req, res) => {
//   try {
//     const response = await movies.findOneAndDelete({
//       _id: req.params.id,
//       user_id: req.user._id,
//     });
//     if (response) {
//       const file = bucket.file(response.video.path);
//       file.delete().then(function (data) {
//         res.json({ message: "Deleted" });
//       });
//     } else res.status(400).json({ message: "Not Found" });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// function checkFileType(file, cb) {
//   // Allowed ext
//   const filetypes = /mkv|mp4|mov|avi|webm/;
//   // Check ext
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   // Check mime
//   const mimetype = filetypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     return cb("Allow mp4|mov|avi|webm|mkv Only!");
//   }
// }

module.exports = router;
