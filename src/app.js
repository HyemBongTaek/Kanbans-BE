require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const io = require('./socket');

const routes = require('./routes');

const app = express();
app.set('port', 8080);

app.use(logger('dev'));
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://cocori.site'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

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

io(app);

// const httpsOptions = {
//   ca: fs.readFileSync('/etc/letsencrypt/live/cocorikanbans.site/fullchain.pem'),
//   key: fs.readFileSync('/etc/letsencrypt/live/cocorikanbans.site/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/cocorikanbans.site/cert.pem'),
// };
//
// http
//   .createServer(app)
//   .listen(8080, () => console.log('http listening on port 8080'));
//
// https
//   .createServer(httpsOptions, app)
//   .listen(8090, () => console.log('http listening on port 8090'));
