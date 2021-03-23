const express = require('express');
const Router = require('express').Router;
const router = new Router();
const ExpressError = require('../expressError');
const db = require('../db');
const Message = require('../models/message');
const {ensureLoggedIn} = require('../middleware/auth');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const username = req.user.username;
        const message = await Message.get(req.params.id);

        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError("Cannot read this message", 401);
        }

        return res.json({'message': message});    
    } catch (error) {
        return next(error);   
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.create({
            from_username: req.user.username,
            to_username: req.body.to_username,
            body: req.body.body
        });

        return res.json({'message': message});  
    } catch (error) {
        return next(error);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const username = req.user.username;
        const msg = await Message.get(req.params.id);

        if (msg.to_user.username !== username) {
            throw new ExpressError("Cannot set this message to read", 401);
        }

        const message = await Message.markRead(req.params.id);
        return res.json({'message': message});    
    } catch (error) {
        return next(error);
    }
});

module.exports = router;