const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(logger('dev'));
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
