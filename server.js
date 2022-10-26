'use strict';

const http = require('http');
const app = require('./app');
const db = require('./models');

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

//création du serveur http et de la fonction (ici app) qui sera appelée à chaque requête faite à ce serveur
const server = http.createServer(app);

const socketio = require('socket.io');

const io = socketio(server, { cors: { origin: '*' } });

//dire à server.js quel est le port d'écoute de l'appli express
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

var connectedUsers = [];
var conversations = [];

const addUser = (data, socketId) => {
  connectedUsers.push({ status: data.status, userId: data.userId, socketId });
};

const removeUser = (socketId) => {
  connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return connectedUsers.find((user) => user.userId === userId);
};

const addConversation = async (socketId, userId, convId) => {
  conversations = conversations.filter((conv) => conv.socketId !== socketId);
  conversations.push({ socketId, userId, convId });
};

io.on('connection', (socket) => {
  console.log('connection', socket.id);
  socket.on('addUser', (data) => {
    !connectedUsers.some((user) => user.userId === data.userId) &&
      addUser(data, socket.id);
    io.emit('getUsers', connectedUsers);
    console.log(connectedUsers);
  });

  socket.on('disconnect', () => {
    removeUser(socket.id);
    io.emit('getUsers', connectedUsers);
  });

  socket.on('addConversation', ({ userId, convId }) => {
    addConversation(socket.id, userId, convId);
  });

  socket.on('newConversation', ({ otherUserId, allConversations }) => {
    const user = getUser(otherUserId);
    if (user) {
      io.to(user.socketId).emit('getConversation', {
        allConversations,
      });
    }
  });

  socket.on('sendMessage', (data) => {
    const user = getUser(data.secondUser.receiverId);
    console.log(data);
    if (user) {
      io.to(user.socketId).emit('getMessage', data);
    }

    socket.on('isTyping', (data) => {
      const user = getUser(data.userId);
      console.log(1);
      if (user) io.to(user.socketId).emit('getIsTyping', data);
    });

    // if (
    //   conversations.some(
    //     (conv) => conv.convId === convId && conv.userId === receiverId
    //   )
    // ) {
    //   const conversation = await db.Conversation.findByPk(convId);
    //   const unreadMessage =
    //     conversation.firstUserId === receiverId
    //       ? 'unreadMessageFirstUser'
    //       : 'unreadMessageSecondUser';
    //   conversation.increment(unreadMessage);
    // }
  });

  // socket.on('followedUsers', (followedUsers) => {
  //   console.log(followedUsers);
  // });

  // socket.on('onLogin', (user) => {
  //   const updatedUser = {
  //     ...user,
  //     online: true,
  //     socketId: socket.id,
  //     messages: [],
  //   };
  //   if (user) {
  //     const alreadyConnected = connectedUsers.find(
  //       (user) => user.id === updatedUser.id
  //     );
  //     if (!alreadyConnected) connectedUsers.push(updatedUser);
  //   }
  //   console.log('users' + connectedUsers);
  // });

  // socket.emit('getAllConnectedUsers', connectedUsers);
  // socket.on('onLogout', () => {
  //   connectedUsers = connectedUsers.filter(
  //     (user) => user.socketId !== socket.id
  //   );
  //   return connectedUsers;
  // });
});

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

server.listen(port, () =>
  console.log(`Server Running on: http://localhost:${port}`)
);
