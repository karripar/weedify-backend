import app from './app';

const port = process.env.PORT || 3001;
const myComputer = '192.168.1.112';

app.listen(port, () => {
  console.log(`Server is running on http://${myComputer}:${port}`);
});
