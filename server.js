const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./middleware/config.js');

// Define schemas
// const UserSchema = new mongoose.Schema({
//   username: { type: String, unique: true },
//   email: { type: String, unique: true },
//   password: { type: String },
//   posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
// });

// const PostSchema = new mongoose.Schema({
//   title: String,
//   content: String,
//   author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
// });

// const CommentSchema = new mongoose.Schema({
//   text: String,
//   author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
// });

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost/myapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('Registration failed');
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).send('User not found');

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).send('Login failed');
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author').exec();
    res.json(posts);
  } catch (error) {
    res.status(500).send('Error fetching posts');
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).send(newPost);
  } catch (error) {
    res.status(400).send('Failed to create post');
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndRemove(req.params.id);
    res.status(204).send('Post deleted successfully');
  } catch (error) {
    res.status(404).send('Post not found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
