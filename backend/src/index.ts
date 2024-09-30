import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

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

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);
  socket.emit('init');
  socket.on('sdp-offer', (res) => {
    console.log(`received offer from ${res.origin}`);
    socket.emit('sdp-offer', res.sdp);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
  });
})

server.listen(port, () => {
  console.log(`Started server at http://localhost:${port}.`);
  })

