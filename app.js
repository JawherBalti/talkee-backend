'use strict';

const express = require('express');
const { checkUser, requireAuth } = require('./middlewares/authUser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRt');
const postRoutes = require('./routes/postRt');
const commentRoutes = require('./routes/commentRt');
const likeRoutes = require('./routes/likeRt');
const followRoutes = require('./routes/followRt');
const conversationRoutes = require('./routes/conversationRt');
const messageRoutes = require('./routes/messageRt');
const path = require('path');
const { sequelize } = require('./models/index');

const app = express();

require('dotenv').config();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//app.use('/images', express.static('images'));

//app.use("/api/v1", api);

// utilisation des ressources "static", içi les images/vidéos
app.use('/images', express.static(path.join(__dirname, 'images')));
//app.use('/images', express.static(path.join(__dirname, 'profil')));

// routes
app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/like', likeRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);

const dbTest = async function () {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
dbTest();

sequelize.sync({ force: false });

module.exports = app;
