import app from './app';

const port = process.env.PORT || 3002;
const myComputer = process.env.MYPC

app.listen(port, () => {
  console.log(`Server is running on http://${myComputer}:${port}`);
});
