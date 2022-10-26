# Talkee Backend

Server side of a social network "Talkee" made by Nodejs, express, mySQL and sequelize

## :dart: Objectifs attendus

- Create user accounts
- Authenticate and authorize users
- Create Posts, like and comment them
- Update and delete posts and comments
- Search for other users and follow their accounts
- Chat with followed users
- Customize account and user information
- Admin account can find users, change their role or block their account
- Store data in a secure way using SQL

## :rocket: Backend Installation
Install `nodejs`, `npm` and `XAMPP` on your local machine.
Start `XAMPP` and create your data base named `talkfree`.
In the `backend` folder, add the following configuration to `config.json` in `config` folder.
{
    "development": {
        "username": "root",
        "password": "",
        "database": "talkfree",
        "host": "localhost",
        "port": "3306",
        "dialect": "mysql"
    },
}

```
Go to backend folder
```
> cd backend
```
Install project dependencies
```
> npm install
```
Start server
```
> nodemon serve
