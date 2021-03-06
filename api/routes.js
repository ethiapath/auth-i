const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
// custom middleware
const { protected } = require('./middleware.js')

const db = require('../data/dbConfig.js')

const USERID = 'userId';

router.use('/restricted', require('./restricted/restrictedRoutes.js'))

router.get('/', (req, res) => {
  res.status(200).json({ message: 'api' });
})

const register = (req, res) => {
  const { username, password } = req.body;
  const saltLength = 14;
  const hashedPass = bcrypt.hashSync(password, saltLength)
  const userObj = {username, password: hashedPass}
  db('users').insert(userObj)
    .then(ids => {
      res
        .status(201)
        .json({ids, hashedPass})
    })
    .catch(err => res.json(err));

}

const login = (req, res) => {
  const creds = req.body 

  db('users').where({username: creds.username}).first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        req.session.user = user.id;
        res.status(200)
          .json({message: 'Logged in'})
      } else {
        res.status(401).json({message: 'Failed to authenticate'})
      }
    })
    .catch(err => res.json(err));
}

const logOut = (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({err})
      } else {
        res.status(200).json({message: 'Good bye!'})
      }
    })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await db('users').select('id', 'username', 'password')
    res.status(200).json(users);
  }
  catch(err) {
    res.status(500).json({message: 'You shall not pass!'});
  };
}

const echo = (req, res) => {
  res.status(200).json({
    message: 'hey this endpoint work!',
    params: req.params,
    query: (req.query ? req.query : ''),
    body: req.body
  });
}

router.post('/login', login)
router.post('/register', register)
router.get('/users', protected, getUsers)

module.exports = router;