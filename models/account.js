'use strict';

var mysql = require('mysql');

var connPool;
var uuid = require('node-uuid');

var accounts = {
    // creates a new account associated with a given user ID
    createAccount(type, userId, accountName, amount) {
        var sql = 'insert into Account (AccountID, AccountTypeID, UserID, AccountName, Balance) values(?, ?, ?, ?, ?)';
        var accountId = uuid.v4();
        return connPool.queryAsync(sql, [accountId, type, userId, accountName, amount]);
    },
    
    // returns the accounts associated with the given user ID
    getUserAccounts(id) {
        var sql = 'select * from Account a join AccountType t on a.AccountTypeID = t.AccountTypeID where UserID = ?';
        return connPool.queryAsync(sql, [id]);
    },
    
    // verifies to see if a given account is owned by a given user ID
    checkOwnsAccount(id, account) {
        var sql = 'select * from Account where UserID = ? and AccountID = ?';
        return connPool.queryAsync(sql, [id, account])
            .then(function(rows) {
                return rows.length > 0 ? rows[0] : null;
            });    
    },
    
    // returns the primary account of a user given their email
    getUserMainAccount(email) {
        var sql = 'select * from Account a join User u on a.UserID = u.UserID where u.Email like ? and a.AccountTypeID = 1';
        return connPool.queryAsync(sql, [email])
            .then(function(rows) {
                return rows.length > 0 ? rows[0] : null;
            });
    },
    
    // returns the transactions associated with the accounts belonging to the given user ID
    getUserTransactions(id) {
        var sql = `select t.SourceAccount, t.DestinationAccount, t.Amount, t.TransactionDate, t.InitiatingUserID, t.Description, uDest.Email as DestEmail, uSrc.Email as SrcEmail
                   from Transaction t 
                   join Account dest on t.DestinationAccount = dest.AccountID 
                   join Account src on t.SourceAccount = src.AccountID 
                   join User uDest on dest.UserID = uDest.UserID 
                   join User uSrc on src.UserID = uSrc.UserID 
                   where dest.UserID = ? or src.UserID = ?`;
        return connPool.queryAsync(sql, [id, id]);
    },
    
    updateAccountName(name, id) {
        var sql = 'update Account set AccountName = ? where AccountID = ?';
        return connPool.queryAsync(sql, [name, id]);    
    },
    
    deleteAccount(id) {
        var sql = 'delete from Account where AccountID = ?';
        return connPool.queryAsync(sql, [id]);
    },
    
    // executes an ACID transaction that debits the source account, credits the destination account
    // and saves a log of the transaction
    executeTransaction(source, destination, amount, initiatingUser, message) {
        var dbConfig = require('../secret/config-maria.json');
        var conn = mysql.createConnection(dbConfig);
        conn.beginTransaction(function(err) {
            if(err) { throw err; }
            conn.query('update Account set Balance = Balance - ? where AccountID = ?', [amount, source], function(err, result) {
                if(err) {
                    conn.rollback(function() {
                        throw err;
                    });
                }
                conn.query('update Account set Balance = Balance + ? where AccountID = ?', [amount, destination], function(err, result) {
                    if(err) {
                        conn.rollback(function() {
                            throw err;
                        });
                    }
                    conn.query('insert into Transaction (SourceAccount, DestinationAccount, Amount, InitiatingUserID, Description) values (?, ?, ?, ?, ?)', 
                        [source, destination, amount, initiatingUser, message], 
                        function(err, result) {
                            if(err) {
                                conn.rollback(function() {
                                    throw err;
                                });
                            }
                            conn.commit(function(err) {
                                if(err) {
                                    conn.rollback(function() {
                                        throw err;
                                    });
                                }
                                conn.end();
                            });
                    });
                });
            });
        });
    }
}

module.exports.Model = function(connectionPool) {
    connPool = connectionPool;
    return accounts;
}