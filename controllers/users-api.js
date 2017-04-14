'use strict';

var express = require('express');

module.exports.Router = function(users, passport) {
    
    var router = express.Router();
    
    // gets and returns the currently signed in user's profile information
    router.get('/users/me', isLoggedIn, function(req, res) {
        if(req.user) { 
            res.json(req.user);
        } 
    });
    
    // ends the user's sign in session and redirects to the home page
    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // used to authenticate a user who is signing up for the first time
    router.post('/signup', passport.authenticate('signup', { failWithError : true}), 
        function(req, res, next) {
            res.json(req.user);  
        },
        function(err, req, res, next) {
            res.json(err);
        });

    // used to authenticate a user who has a local account
    router.post('/signin', passport.authenticate('local', {failWithError : true}), 
        function(req, res, next) {
            res.json(req.user);
        },
        function(err, req, res, next) {
            res.json(err);
        });

    // allows user to edit their display name in our system, checks to make sure trimmed submission
    // is greater than 0 and less than 50 characters
    router.put('/users/me/displayName', isLoggedIn, function(req, res, next) {
        if(req.body.newDisplay !== undefined) {
            var newDisplay = req.body.newDisplay.trim();
        }
        if(newDisplay === undefined || newDisplay.length == 0) {
            return res.status(400).send('Your display name must be at least one character long');
        } else if(newDisplay.length > 50) { 
            return res.status(400).send('Your display name must be fewer than 50 characters');
        } else {        
            users.updateDisplayName(newDisplay, req.user.UserID)
                .then(function(result) {
                    res.json(result); 
                })
                .catch(next);
        }
    });   

    // allows user to change their password, must pass in their current password first
    router.put('/users/me/password', isLoggedIn, function(req, res, next) {
        if(!users.validPassword(req.body.currentPass, String(req.user.Password))) {
            return res.status(400).send('The current password you passed is incorrect');
        } else if(req.body.newPass !== req.body.confirmPass) {
            return res.status(400).send('New password and confirmation do not match');
        } else {
        
            var newPass = users.generateHash(req.body.newPass);
            
            users.updatePassword(newPass, req.user.UserID)
                .then(function(result) {
                    res.json(result);
                })
                .catch(next);   
        }
    });
    
    return router;
};

// used to verify user is logged in before executing api calls
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    
    res.status(401).send('You need to be logged in to do this');
}