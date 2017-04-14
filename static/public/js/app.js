'use strict';

angular.module('Authentication', [])
    .constant('apiroot', '/api/v1')
    // this controller specifies all of the functions invoked by forms
    .controller('FormController', function($scope, $http, $window, apiroot) {
        
        // used to sign an existing local user in
        $scope.signin = function(user) {
            $scope.processSignIn = true;
            $http.post(apiroot + '/signin', user)
                .success(function(response) {
                    $window.location.href = '/profile.html';
                })
                .error(function(err) {
                    if(err.status === 401) {
                        $scope.signInAlert = 'Invalid email/password combination';
                    }
                })
                .finally(function() {
                    $scope.processSignIn = false;
                })
        }
        
        // used to sign up a brand new user
        $scope.signup = function(user) {
            if(user.upDisplayName !== undefined) {
                var display = user.upDisplayName.trim();
            }
            if(user.upPassword !== user.upPasswordConf) {
                $scope.signUpAlert = 'Passwords do not match!';
            } else if(display === undefined || display.length == 0) {
                $scope.signUpAlert = 'Display name needs to be at last one character';   
            } else {
                $scope.processSignUp = true;
                $http.post(apiroot + '/signup', user)
                    .success(function(response) {
                        $window.location.href = '/profile.html';
                    })
                    .error(function(err) {
                        if(err.status === 401) {
                            $scope.signUpAlert = 'This email is already being used';
                        }
                    })
                    .finally(function() {
                        $scope.processSignUp = false;
                    })
            }
        }    
        
        // allows user to change their display name
        $scope.changeDisplayName = function(user) {
            $scope.displayUpdating = true;
            $http.put(apiroot + '/users/me/displayName', user)
                .then(function(data){
                    $scope.displayNameAlert = 'Display name has been updated!';
                    setTimeout(function() {
                        $window.location.reload();
                    }, 1000)
                })
                .catch(function(err) {
                    $scope.displayNameAlert = err.data;
                })
                .finally(function() {
                    $scope.displayUpdating = false;
                })
        }
        
        // allows user to change their password, as long as they provide their current password
        $scope.changePassword = function(user) {
            $scope.passwordUpdating = true;
            $http.put(apiroot + '/users/me/password', user)
                .then(function(response) {
                    $scope.passwordAlert = 'Password has been updated!';
                    setTimeout(function() {
                        $window.location.reload();    
                    }, 1000)
                })
                .catch(function(err) {
                    $scope.passwordAlert = err.data;
                })
                .finally(function() {
                    $scope.passwordUpdating = false;
                })
        }  
    })
    
    // this controller is a more general one, used to get a signed in user's profile, accounts, and transaction data
    .controller('AuthController', function($scope, $http, $window, apiroot) {
        // gets user's profile information
        $http.get(apiroot + '/users/me')
            .success(function(data) {
                $scope.DisplayName = data.DisplayName;
                $scope.Email = data.Email;
            })
        
        // gets user's accounts
        $http.get(apiroot + '/users/me/accounts')
            .then(function(response) {
                $scope.AccountData = response.data;
            })
        
        // gets user's transactions and limits the number shown to 20 unless user requests more 
        $http.get(apiroot + '/users/me/transactions')
            .then(function(response) {
                $scope.totalTransactionsDisplayed = 20;
                $scope.loadMore = function() {
                    $scope.totalTransactionsDisplayed += 20;
                }
                $scope.TransactionData = response.data;
            })
        
        // allows a user to create a new account 
        $scope.addAccount = function(account) {
            $http.post(apiroot + '/users/me/accounts', account)
                .then(function(response) {
                    $scope.addAccountAlert = 'Account successfully created!';
                    setTimeout(function() {
                        $window.location.reload();    
                    }, 1000)
                })
                .catch(function(err) {
                    $scope.addAccountAlert = err.data;
                })
        }
        
        // allows a user to edit an account's name
        $scope.editAccount = function(account) {
            $http.put(apiroot + '/users/me/accounts/' + account.id + '/name', account)
                .then(function(response) {
                    $scope.editAccountAlert = 'Account name changed';
                    setTimeout(function() {
                        $window.location.reload();
                    }, 1000)
                })
                .catch(function(err) {
                    $scope.editAccountAlert = err.data;
                })
        } 
        
        // allows a user to delete one of their accounts
        $scope.deleteAccount = function(account) {
            $http.delete(apiroot + '/users/me/accounts/' + account.id, account)
                .then(function(response) {
                    $scope.deleteAccountAlert = 'Account deleted!';
                    setTimeout(function() {
                        $window.location.reload();
                    }, 1000);
                })
                .catch(function(err) {
                    $scope.deleteAccountAlert = err.data;
                })
        }
        
        // allows a user to perform a transaction
        $scope.addTransaction = function(transaction) {
            $scope.processTransaction = true;
            $http.post(apiroot + '/users/me/transactions', transaction)
                .then(function(response) {
                    $scope.transactionAlert = 'Transaction successful!';
                    setTimeout(function() {
                        $window.location.reload();
                    }, 1000)
                })
                .catch(function(err) {
                    $scope.transactionAlert = err.data;
                })
                .finally(function() {
                    $scope.processTransaction = false;
                })
        }   
    });