create database if not exists rest character set = "UTF8";

use rest;

create or replace TABLE User (
	UserID int not null primary key auto_increment,
    DisplayName varchar(255) not null,
    Email varchar(255) not null,
    Password BINARY(60) not null
);

create or replace TABLE AccountType (
	AccountTypeID int not null primary key auto_increment,
    AccountTypeName varchar(255) not null
);

create or replace TABLE Account (
	AccountID varchar(255) not null primary key,
    AccountTypeID int,
    UserID int,
    AccountName varchar(255) not null,
    Balance decimal(19,2) not null,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (AccountTypeID) REFERENCES AccountType(AccountTypeID)
);

create or replace TABLE Transaction (
	TransactionID int not null primary key auto_increment,
    SourceAccount varchar(255) not null,
    DestinationAccount varchar(255) not null,
    Amount decimal(19,2) not null,
    TransactionDate timestamp DEFAULT CURRENT_TIMESTAMP,
    InitiatingUserID int not null,
    Description varchar(255),
    FOREIGN KEY (SourceAccount) REFERENCES Account(AccountID),
    FOREIGN KEY (DestinationAccount) REFERENCES Account(AccountID),
    FOREIGN KEY (InitiatingUserID) REFERENCES User(UserID)
);

insert into AccountType(AccountTypeName) values("Primary");
insert into AccountType(AccountTypeName) values("Additional");