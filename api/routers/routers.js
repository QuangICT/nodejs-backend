'use strict';

const express = require('express');
const router = express.Router();
const accountCtrl = require('../controllers/AccountsController');
const locationCtrl = require('../controllers/LocationsController');
const topicCtrl = require('../controllers/TopicsController');
const conversationCtrl = require('../controllers/ConversationsController');
const categoryCtrl = require('../controllers/CategoriesController')
const userMiddleware = require('../middleware/auth');

// Account API
router.post('/accounts/login', accountCtrl.login);
router.post('/accounts/register', accountCtrl.register);
router.get('/accounts/detail', userMiddleware.isLoggedIn, accountCtrl.detail);
router.get('/accounts/getByID', userMiddleware.isLoggedIn, accountCtrl.getByID);
router.put('/accounts/update', userMiddleware.isLoggedIn, accountCtrl.update);
router.put('/accounts/updateUserLocation', userMiddleware.isLoggedIn, accountCtrl.updateUserLocation);
router.put('/accounts/updateDeviceToken', userMiddleware.isLoggedIn, accountCtrl.updateDeviceToken);
router.delete('/accounts/deleteAccount', userMiddleware.isLoggedIn, accountCtrl.delete);

//Forgot-Password
router.post('/accounts/recover', accountCtrl.recover);
router.get('/accounts/reset', accountCtrl.reset);
router.post('/accounts/reset', accountCtrl.resetPassword)

// Location API
router.get('/locations', userMiddleware.isLoggedIn, locationCtrl.get);
router.post('/locations', userMiddleware.isLoggedIn, locationCtrl.create);
router.put('/locations/update', userMiddleware.isLoggedIn, locationCtrl.update);
router.delete('/locations/delete', userMiddleware.isLoggedIn, locationCtrl.delete);

// Topic API
router.get('/topics/test', topicCtrl.testAPI)
router.get('/topics/searchByLocation', userMiddleware.isLoggedIn, topicCtrl.getByLocation);
router.get('/topics/searchByKeyword', userMiddleware.isLoggedIn, topicCtrl.getByKeywords);
router.get('/topics/trending', userMiddleware.isLoggedIn, topicCtrl.getByTrending);
router.get('/topics/top', userMiddleware.isLoggedIn, topicCtrl.getByTop);
router.get('/topics/recent', userMiddleware.isLoggedIn, topicCtrl.getByRecent);
router.post('/topics', userMiddleware.isLoggedIn, topicCtrl.create);
router.put('/topics/update', userMiddleware.isLoggedIn, topicCtrl.update);
router.delete('/topics/delete', userMiddleware.isLoggedIn, topicCtrl.delete);

// Conversation API
router.get('/conversations', userMiddleware.isLoggedIn, conversationCtrl.getConversations);
router.post('/conversations', userMiddleware.isLoggedIn, conversationCtrl.create);
router.put('/conversations', userMiddleware.isLoggedIn, conversationCtrl.updateMessageEmojis);

//Categories API
router.get('/categories', userMiddleware.isLoggedIn, categoryCtrl.fetchAll)
router.get('/categories/getByID', userMiddleware.isLoggedIn, categoryCtrl.get)

module.exports = router;
