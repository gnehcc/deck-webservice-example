const restify = require('restify');
const errs = require('restify-errors');
const Deck = require('./model/deck');

// for storing decks in memory only.
let deckPool = {};

const server = restify.createServer();

// universal handler for valid deck checking
const handleNotFound = (req, res, next) => {
  const id = req.params.id;

  if (id) {
    const deck = deckPool[id]

    if (deck !== undefined) {
      res.deck = deck;
      return next();
    } else {
      return next(new errs.NotFoundError(`Deck: ${id} not found!`));
    }
  } else {
    return next();
  }
};

// use the universal handler
server.use(handleNotFound);

/*
    Routes:
    POST /api/deck/new
    POST /api/deck/:id/shuffle
    POST /api/deck/:id/deal
    GET /api/deck/:id
    POST /api/deck/:id/cut/:position

    For shuffle, deal and cut operations, POST should be much more approperiate under current implementations,
    since all these operations are not idempotent.
*/
server.post('/api/deck/new', (req, res, next) => {
  const deck = new Deck();
  deckPool[deck.id] = deck;

  res.send(201, deck);
  return next();
});

server.post('/api/deck/:id/shuffle', (req, res, next) => {
  const deck = res.deck;
  delete res.deck;

  deck.shuffle();
  res.send(200, deck);
  return next();
});

server.post('/api/deck/:id/deal', (req, res, next) => {
  const deck = res.deck;
  delete res.deck;
  card = deck.deal();

  res.send(200, {
    card: card,
    remaining: deck.cards.length,
    dealt: deck.dealtCards.length,
    deck: `/api/deck/${deck.id}`
  });
  return next();
});

server.post('/api/deck/:id/cut/:position', (req, res, next) => {
  const deck = res.deck;
  delete res.deck;

  deck.cut(req.params.position);
  res.send(200, deck);
  return next();
});

server.get('/api/deck/:id', (req, res, next) => {
  const deck = res.deck;
  delete res.deck;

  res.send(200, deck);
  return next();
});

// just for functional introductions
server.get('/', (req, res, next) => {
  const resBody = [
    '<html>',
    '<body>',
    '<h2>Welcome to deck web service example</h2>',
    '<h3>Supported routes:</h3>',
    '<ul>',
    '<li>/api/deck/new  POST</li>',
    '<li>/api/deck/:id/shuffle  PUT</li>',
    '<li>/api/deck/:id/deal  PUT</li>',
    '<li>/api/deck/:id  GET</li>',
    '<li>/api/deck/:id/cut/:position  PUT</li>',
    '</ul>',
    '<footer>More details please check the <a href="https://github.com/gnehcc/deck-webservice-example">Github Repository</a></footer>',
    '</body>',
    '</html>'
  ].join('\n');
  res.write(resBody);
  res.end();
  return next();
});

// General error handling
server.on('restifyError', function (req, res, err, cb) {
  return cb(new errs.InternalServerError('an internal server error occurred, please try later!'));
});

// start the server when not running unit tests
if (!module.parent) {
  // using process.env.PORT for deploying to Azure app services
  server.listen(process.env.PORT || 8080, function () {
    console.log(`server listening at ${server.address().port}`);
  });
}

module.exports = server;
