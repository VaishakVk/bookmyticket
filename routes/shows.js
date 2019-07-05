const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/loggedIn");
const showController = require("../controllers/shows");

router.post("/register", isLoggedIn, showController.postRegisterShow);
router.get("/", showController.getShowDetails);
router.get("/:time", showController.getShowDetailsByTime);
router.get("/stats/:time", isLoggedIn, showController.getShowStats);
router.post("/book", showController.postBookShow);

module.exports = router;
