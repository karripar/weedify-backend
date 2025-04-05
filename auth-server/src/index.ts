import app from './app';

const port = process.env.PORT || 3001;
const myComputer = process.env.MYPC

app.listen(port, () => {
  console.log(`Server is running on http://${myComputer}:${port}`);
});
