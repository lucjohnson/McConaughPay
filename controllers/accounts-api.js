'use strict';

var express = require('express');

module.exports.Router = function(accounts) {
    
    var router = express.Router();
    
    // gets all of a user's accounts
    router.get('/users/me/accounts', isLoggedIn, function(req, res, next) {
       accounts.getUserAccounts(req.user.UserID)
           .then(function(rows) {
               res.json(rows);
           })
           .catch(next); 
        
    });
    
    // allows a user to create additional accounts up to a total of 5
    router.post('/users/me/accounts', isLoggedIn, function(req, res, next) {
       accounts.getUserAccounts(req.user.UserID)
           .then(function(rows) {
               if(rows.length >= 5) {
                   return res.status(401).send('You may not create more than 5 accounts');
               } else {
                   accounts.createAccount(2, req.user.UserID, req.body.name, 0)
                       .then(function(response) {
                            res.status(201).send('New account created');
                       })
                       .catch(next); 
               }
           });
    });
    
    // allows a user to change the name of one of their accounts
    router.put('/users/me/accounts/:id/name', isLoggedIn, function(req, res, next) {
        accounts.checkOwnsAccount(req.user.UserID, req.params.id)
            .then(function(account) {
                if(account === null) {
                    return res.status(401).send('You do not own this account');
                } else {
                    if(req.body.newName !== undefined) {
                        var newName = req.body.newName.trim();
                    }
                    if(newName === undefined || newName.length == 0) {
                        return res.status(400).send('Your account name must be at least one character long');
                    } else if(newName.length > 50) { 
                        return res.status(400).send('Your account name must be fewer than 50 characters');
                    } else {        
                        accounts.updateAccountName(newName, req.params.id)
                            .then(function(result) {
                                res.json(result); 
                            })
                            .catch(next);
                    }
                }
            })
    });
    
    // allows a user to delete one of their accounts if it has a balance of 0 and is not their primary account
    router.delete('/users/me/accounts/:id', isLoggedIn, function(req, res, next) {
        accounts.checkOwnsAccount(req.user.UserID, req.params.id)
            .then(function(account) {
                if(account === null) {
                    return res.status(401).send('You do not own this account');
                } else {
                    if(account.AccountTypeID === 1) {
                        return res.status(401).send('You may not delete your primary account');
                    } else if (account.Balance > 0) {
                        return res.status(400).send('You may not delete an account if it has a positive balance');
                    } else {
                        accounts.deleteAccount(req.params.id)
                            .then(function(result) {
                                res.json(result);
                            })
                            .catch(next);
                    }
                }
            })
    })
    
    // gets all transactions involving a user's accounts, filters data to make sure user does not
    // see another user's account ID's
    router.get('/users/me/transactions', isLoggedIn, function(req, res, next) {
       accounts.getUserTransactions(req.user.UserID)
          .then(function(rows) {
              var filteredData = [];
              for(var i = 0; i < rows.length; i++) {
                  var obj = {
                      Date: rows[i].TransactionDate,
                      InitiatedBy: rows[i].InitiatingUserID === req.user.UserID ? 'You' : rows[i].SrcEmail,
                      Source: rows[i].SrcEmail === req.user.Email ? rows[i].SourceAccount : rows[i].SrcEmail,
                      Destination: rows[i].DestEmail === req.user.Email ? rows[i].DestinationAccount : rows[i].DestEmail,
                      Amount: rows[i].Amount,
                      Message: rows[i].Description !== null ? rows[i].Description : 'N/A'
                  }
                  filteredData.push(obj);
              }
              res.json(filteredData);
          })
          .catch(next); 
    });
    
    // allows a user to make a transaction from one of their accounts to either another of theirs
    // or the primary account of any other existing user
    router.post('/users/me/transactions', isLoggedIn, function(req, res, next) {
        // verify source account belongs to user
        accounts.checkOwnsAccount(req.user.UserID, req.body.Source)
            .then(function(account) {
                if(account === null) {
                    return res.status(401).send('You do not own the source account');
                } else if(account.Balance < req.body.Amount) {
                    return res.status(401).send('You are trying to send more alrights than you have in this account');
                } else {
                    if(req.body.TransactionType == 0) {
                        accounts.checkOwnsAccount(req.user.UserID, req.body.Destination)
                            .then(function(account) {
                                if(account === null) {
                                    return res.status(401).send('You do not own this destination account');
                                } else {
                                    accounts.executeTransaction(req.body.Source, req.body.Destination, req.body.Amount, req.user.UserID, req.body.Message);
                                    return res.status(201).send('Transaction successful!');
                                }
                            });
                    } else if(req.body.TransactionType == 1) {
                        accounts.getUserMainAccount(req.body.Destination) 
                            .then(function(account){
                                if(account === null) {
                                    return res.status(401).send('This user does not exist');
                                } else {
                                    accounts.executeTransaction(req.body.Source, account.AccountID, req.body.Amount, req.user.UserID, req.body.Message);
                                    return res.status(201).send('Transaction successful!');
                                }
                            })
                    }
                }
            });
    });
    
    return router;
};

// used to verify user is logged in before executing api calls
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated())
        return next();
        
    res.status(401).send('You need to be logged in to do this');
}