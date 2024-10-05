import express from 'express';
import http from 'http';
import cors from 'cors';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { SDP } from '../../common/types';

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

  socket.broadcast.emit('new-peer', socket.id);

  clients.push(socket);
  
  socket.on('new-sdp-offer', (res: SDP) => {
    console.log('received new offer');
    socket.broadcast.emit('new-sdp-offer', res);
  });

  socket.on('sdp-offer', (res: SDP) => {
    console.log(`received offer targeting ${res.target}`);

    let client = clients.find((client) => {
      return client.id === res.target;
    })
    
    if(client) {
      client?.emit('sdp-offer', res);
    }
  });

  socket.on('new-sdp-answer', (res: SDP) => {
    console.log(`received answer targeting ${res.target}`);
    
    let client = clients.find((client) => {
      return client.id === res.target;
    })

    if(client) {
      client?.emit('sdp-answer', res.sdp);
    }
  });

  socket.on('sdp-answer', (res: SDP) => {
    console.log(`received answer from ${res.origin}`);
    socket.broadcast.emit('sdp-answer', res.sdp);
  });


  socket.on('ice-candidate', (res: string) => {
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

