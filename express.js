const express = require('express');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 7000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting middleware
app.use(limiter);

// Security headers
app.use(helmet());

// MySQL connection configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'mgs_user',
    password: 'pa55word',
    database: 'MSU_Movies'
  });

// Connect to MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Middleware
app.use(express.urlencoded({ extended: true }));

// List all movies
app.get('/movies', (req, res) => {
  const query = 'SELECT * FROM Movie';
  connection.query(query, (err, result) => {
    if (err) throw err;
    res.send(`
      <h1>All Movies</h1>
      <ul>
        ${result.map(movie => `<li>${mysql.escape(movie.MovieTitle)} (${mysql.escape(movie.Genre)}, ${movie.ReleaseDate})</li>`).join('')}
      </ul>
    `);
  });
});

// Insert a new movie
app.get('/insert', (req, res) => {
  res.send(`
    <h1>Insert a New Movie</h1>
    <form action="/insert" method="POST">
      <label for="title">Movie Title:</label>
      <input type="text" id="title" name="title" required><br>
      <label for="genre">Genre:</label>
      <input type="text" id="genre" name="genre" required><br>
      <label for="release">Release Date:</label>
      <input type="date" id="release" name="release" required><br>
      <input type="submit" value="Submit">
    </form>
  `);
});

app.post('/insert', [
  body('title').notEmpty().withMessage('Movie title is required'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('release').isDate().withMessage('Invalid release date format')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, genre, release } = req.body;
  const query = 'INSERT INTO Movie (MovieTitle, Genre, ReleaseDate) VALUES (?, ?, ?)';
  connection.query(query, [title, genre, release], (err, result) => {
    if (err) throw err;
    res.redirect('/movies');
  });
});

// ... (Update and delete implementation omitted for brevity)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});