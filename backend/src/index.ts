import express from 'express';
import http from 'http';
import cors from 'cors';
import { DefaultEventsMap, Server, Socket } from 'socket.io';

const port = 3001;

const app = express();
app.use(cors({
  origin: 'http://localhost:3000' 
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'], 
    credentials: true         
  }
});

let clients: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>[] = [];

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  socket.broadcast.emit('new-peer');

  clients.push(socket);
  
  socket.on('sdp-offer', (res) => {
    console.log(`received offer from ${res.origin}`);
    socket.broadcast.emit('sdp-offer', res.sdp);
  });

  socket.on('sdp-answer', (res) => {
    console.log(`received answer from ${res.origin}`);
    socket.broadcast.emit('sdp-answer', res.sdp);
  });

  socket.on('ice-candidate', (res) => {
    console.log(`received ice candidate ${res}`);
    socket.broadcast.emit('ice-candidate', res);
  });

  socket.on('disconnect', () => {
    clients = clients.filter(item => item.id !== socket.id);
    console.log(`${socket.id} disconnected`);
  });

  socket.emit('init');
  
})

server.listen(port, () => {
  console.log(`Started server at http://localhost:${port}.`);
})

