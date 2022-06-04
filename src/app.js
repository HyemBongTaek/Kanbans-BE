require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');

const dbConnector = require('./db');
const passportConfig = require('./passport');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');
const taskRoutes = require('./routes/task');
const commentRoutes = require('./routes/comment');

passportConfig();
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
app.use(passport.initialize());

app.use('/oauth', authRoutes);
app.use('/project', projectRoutes);
app.use('/user', userRoutes);
app.use('/board', boardRoutes);
app.use('/task', taskRoutes);
app.use('/comment', commentRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  const errorStatus = error.statusCode || 500;
  const { message } = error;
  const { data } = error;

  return res.status(errorStatus).json({
    ok: false,
    message,
    data,
  });
});

async function listener() {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  await dbConnector();
}

app.listen(PORT, listener);
