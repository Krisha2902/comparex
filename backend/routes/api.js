const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');
const searchController = require('../controllers/searchController');

router.post('/scrape', scrapeController.scrapeProduct);
router.post('/search', searchController.searchProducts);

module.exports = { scrapeRoutes: router };
