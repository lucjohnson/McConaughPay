'use strict';

var should = require('should');
var request = require('request-promise').defaults({jar: true});

var host = process.env.HOST || '127.0.0.1';
var baseUrl = 'http://' + host + '/api/v1';

var email = '';
var password = 'coffee';
var id;
var mainAccountId;

describe('rest challenge API', function() {
    this.timeout(5000);
    
    it('should create a new user', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/signup',
            body: {
                upDisplayName: 'mocha',
                upEmail: 'mocha@test' + Math.random() + '.com',
                upPassword: 'coffee',
                upPasswordConf: 'coffee'
            },
            json: true,
            timeout: 5000
        };
        
        return request(options)
            .then(function(body) {
                body.should.have.ownProperty('UserID');
                body.should.have.ownProperty('Email');
                email = body.Email;
            })
    })
    
    it('should fail to create a new user', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/signup',
            body: {
                upDisplayName: 'mocha',
                upEmail: email,
                upPassword: 'coffee',
                upPasswordConf: 'coffee'
            },
            json: true,
            timeout: 5000
        };
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should sign in the user just made', function() {
        // this.timeout = 3000;
        var options = {
            method: 'POST',
            uri: baseUrl + '/signin',
            body: {
                inEmail: email,
                inPassword: password
            },
            json: true,
            timeout: 5000
        };
        
        return request(options)
            .then(function(body) {
                id = body.UserID;
            })
    })
    
    it('should fail to sign in the user just made', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/signin',
            body: {
                inEmail: email,
                inPassword: 'password'
            },
            json: true,
            timeout: 5000
        };
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should return user information', function() {
        var options = {
            method: 'GET',
            uri: baseUrl + '/users/me',
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.have.ownProperty('Email');
                body.Email.should.be.equal(email);
            })
    })
    
    it('should fail to return user information', function() {
        var options = {
            method: 'GET',
            uri: baseUrl + '/users/me',
            json: true,
            jar: false
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.should.have.ownProperty('error');
                err.statusCode.should.be.equal(401);
                err.error.should.be.equal('You need to be logged in to do this');
            })
    })
    
    it('should change the display name of the user', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/displayName',
            body: {
                newDisplay: 'mochaChange'
            },
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.have.ownProperty('changedRows');
                body.changedRows.should.be.equal(1);
            })
    })
    
    it('should fail to change the display name of the user (display name is just spaces)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/displayName',
            body: {
                newDisplay: '       '
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should fail to change the display name of the user (display name is too long)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/displayName',
            body: {
                newDisplay: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should change the password of the user', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/password',
            body: {
                currentPass: 'coffee',
                newPass: 'frappuccino',
                confirmPass: 'frappuccino'
            },
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.have.ownProperty('changedRows');
                body.changedRows.should.be.equal(1);
            })
    })
    
    it('should fail to change the password of the user (current pass is wrong)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/password',
            body: {
                currentPass: 'america',
                newPass: 'blah',
                confirmPass: 'blah'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should fail to change the password of the user (new pass and confirm do not match)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/password',
            body: {
                currentPass: 'frappuccino',
                newPass: 'blah',
                confirmPass: 'halb'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should return user accounts', function() {
        var options = {
            method: 'GET',
            uri: baseUrl + '/users/me/accounts',
            json: true
        }
        
        return request(options)
            .then(function(body) {
                mainAccountId = body[0].AccountID;
            })
    })
    
    it('should create a new user account', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/accounts',
            body: {
                name: 'My new account'    
            },
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.be.equal('New account created');
            })
    })
    
    it('should fail to delete the user account (main account)', function() {
        var options = {
            method: 'DELETE',
            uri: baseUrl + '/users/me/accounts/' + mainAccountId,
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should change the display name of the given user account', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/accounts/' + mainAccountId + '/name',
            body: {
                newName: 'Account name change'
            },
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.have.ownProperty('changedRows');
                body.changedRows.should.be.equal(1);
            })
    })
    
    it('should fail to change the display name of the given user account (not their account)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/accounts/notmyaccount/name',
            body: {
                newName: 'Account name change'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })  
    
    it('should fail to change the display name of the given user account (account name is just spaces)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/accounts/' + mainAccountId + '/name',
            body: {
                newName: '         '
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should fail to change the display name of the given user account (account name is greater than 50 characters)', function() {
        var options = {
            method: 'PUT',
            uri: baseUrl + '/users/me/accounts/' + mainAccountId + '/name',
            body: {
                newName: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(400);
            })
    })
    
    it('should perform a successful transaction', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/transactions',
            body: {
                Source: mainAccountId,
                Destination: 'alright@alright.com',
                Amount: .01,
                TransactionType: 1,
                Message: 'Here is one hundredth of an alright'
            },
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body.should.be.equal('Transaction successful!');
            })
    })  
    
    it('should fail to perform a successful transaction (do not own source account)', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/transactions',
            body: {
                Source: 'rando-account-id',
                Destination: 'alright@alright.com',
                Amount: .01,
                TransactionType: 1,
                Message: 'Here is one hundredth of an alright'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    }) 
    
    it('should fail to perform a successful transaction (amount greater than account balance)', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/transactions',
            body: {
                Source: mainAccountId,
                Destination: 'alright@alright.com',
                Amount: 10000,
                TransactionType: 1,
                Message: 'Here are ten thousand alrights'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should fail to perform a successful transaction (do not own destination)', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/transactions',
            body: {
                Source: mainAccountId,
                Destination: 'rando-account-id',
                Amount: .01,
                TransactionType: 0,
                Message: 'Here is one hundredth of an alright'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should fail to perform a successful transaction (destination email does not exist)', function() {
        var options = {
            method: 'POST',
            uri: baseUrl + '/users/me/transactions',
            body: {
                Source: mainAccountId,
                Destination: 'mocha@' + Math.random() + '.com',
                Amount: .01,
                TransactionType: 1,
                Message: 'Here is one hundredth of an alright'
            },
            json: true
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })      
    
    it('should fail to return user transactions', function() {
        var options = {
            method: 'GET',
            uri: baseUrl + '/users/me/transactions',
            jar: false
        }
        
        return request(options)
            .catch(function(err) {
                err.should.have.ownProperty('statusCode');
                err.statusCode.should.be.equal(401);
            })
    })
    
    it('should return the transaction made by the user earlier', function() {
        var options = {
            method: 'GET',
            uri: baseUrl + '/users/me/transactions',
            json: true
        }
        
        return request(options)
            .then(function(body) {
                body[0].should.have.ownProperty('InitiatedBy');
                body[0].InitiatedBy.should.be.equal('You');    
            })
    })
});