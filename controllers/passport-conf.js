'use strict';

// load up the local strategy used by the app
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

module.exports = function(passport, users, accounts) {
    
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.UserID);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        users.getUserById(id)
            .then(function(user) {
                done(null, user);
            });
    });
    
    // strategy used to authenticate users who are logging in, checks to make sure password matches the stored hash
    passport.use(new LocalStrategy({ usernameField : 'inEmail', passwordField : 'inPassword', passReqToCallback : true}, 
        function(req, username, password, done) {
            users.getUserByEmail(username)
                .then(function(user) {
                    if(!user || !users.validPassword(password, String(user.Password))) {
                        return done(null, false);
                    }
                    return done(null, user);
                });
        }
    ));

    // strategy used to authenticate brand new users who are creating a local account
    passport.use('signup', new LocalStrategy({ usernameField : 'upEmail', passwordField : 'upPassword', passReqToCallback : true},
        function(req, username, password, done) {
            users.getUserByEmail(username)
                .then(function(user) {
                    if(user) {
                        return done(null, false);
                    } else {
                        var newUser = {
                            Email: username,
                            DisplayName: req.body.upDisplayName.trim(),
                            Password: users.generateHash(password)
                        };
                        users.createUser(newUser)
                            .then(function(user){
                                accounts.createAccount(1, user.UserID, "Primary", 100);                                
                                return done(null, user);    
                            });
                    }       
                });
        }
    ));
}