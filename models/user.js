'use strict';

var connPool;
var bcrypt = require('bcrypt');

var users = {
    // returns user associated with the given ID
    getUserById(id) {
        var sql = 'select * from User where UserID = ?';
        return connPool.queryAsync(sql, [id])
            .then(function(rows) {
                return rows.length > 0 ? rows[0] : null;
            });
    },
    
    // returns user associated with the given email
    getUserByEmail(email) {
        var sql = 'select * from User where Email LIKE ?';
        return connPool.queryAsync(sql, [email])
            .then(function(rows) {
                return rows.length > 0 ? rows[0] : null;
            });
    },
    
    // creates a new user in the database
    createUser(user) {
        var sql = 'insert into User (Email, DisplayName, Password) values (?,?,?)';
        return connPool.queryAsync(sql, [user.Email, user.DisplayName, user.Password])
            .then(function(results) {
                return users.getUserById(results.insertId);
            });
    },
    
    // query to update display name associated with the given user ID
    updateDisplayName(newName, userID) {
        var sql = 'update User set DisplayName = ? where UserID = ?';
        return connPool.queryAsync(sql, [newName, userID]);
    },
    
    // query to update password associated with the given user ID
    updatePassword(newPass, userID) {
        var sql = 'update User set Password = ? where UserID = ?';
        return connPool.queryAsync(sql, [newPass, userID]);
    },
    
    // generates a hashed and salted password to be saved in the database
    generateHash(password) {
        return bcrypt.hashSync(password, 13);
    },

    // checks to make sure a provided password is valid
    validPassword(providedPassword, storedPassword) {
        return bcrypt.compareSync(providedPassword, storedPassword);
    }
}

module.exports.Model = function(connectionPool) {
    connPool = connectionPool;
    return users;
}