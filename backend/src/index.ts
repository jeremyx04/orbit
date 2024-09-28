import express, { Request, Response } from 'express';

const app = express();
const port = 3001;

app.use(express.json());  

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.get('/ping', (_req: Request, res: Response) => {
  res.send('pong');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
})

