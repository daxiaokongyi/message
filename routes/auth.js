const Router = require('express').Router;
const router = new Router();
const expressError = require('../expressError');
const db = require('../db');
const bcrypt = require('bcrypt');
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require('../config');
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken');
const User = require(`../models/user`);

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        // check if username/password missing
        if (!username || !password) {
            throw new ExpressError("Username/password are required", 400);
        }
        if (await User.authenticate(username, password)) {
            // sign a jwt
            const token = jwt.sign({username}, SECRET_KEY);
            await User.updateLoginTimestamp(username);
            return res.json({message: 'Logged in!', token});
        } else {
            throw new ExpressError("Invalid username/password", 400);
        }
    } catch (error) {
        return next(error);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

// router.post('/register', async (req, res, next) => {
//     try {
//         const {username, password} = req.body;
//         // check if username/password missing
//         if (!username || !password) {
//             throw new ExpressError("Username/password are required", 400);
//         }
//         // hash password
//         const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
//         // save to db
//         const results = await db.query(`
//             INSERT INTO users (username, password)
//             VALUES ($1, $2)
//             RETURNING username`,
//             [username, hashedPassword]
//         );        
//         return res.json(results.rows[0]);
//     } catch (error) {
//         if (error.code === '23505') {
//             return next(new ExpressError("Username was taken. Please pick another one", 400));
//         }
//         return next(error);
//     }
// });

router.post('/register', async (req, res, next) => {
    try {
        const {username} = await User.register(req.body);
        let token = jwt.sign({username}, SECRET_KEY);
        await User.updateLoginTimestamp(username);
        return res.json({token});
    } catch (error) {
        if (error.code === '23505') {
            return next(new ExpressError("Username was taken. Please pick another one", 400));
        }
        return next(error);
    }
});

module.exports = router;