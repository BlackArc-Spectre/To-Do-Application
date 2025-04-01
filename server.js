
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define routes here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser  = new User({ username, passwordHash: hashedPassword, email });
  await newUser .save();
  res.status(201).json({ message: 'User  registered successfully' });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
  
  // Create Task
  app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, category, deadline } = req.body;
    const newTask = new Task({ userId: req.user.id , title, description, category, deadline });
    await newTask.save();
    res.status(201).json(newTask);
  });
  
  // Get All Tasks
  app.get('/api/tasks', authenticateToken, async (req, res) => {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  });
  
  // Update Task
  app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { title, description, category, deadline, isComplete } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, { title, description, category, deadline, isComplete }, { new: true });
    res.json(updatedTask);
  });
  
  // Delete Task
  app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
  });
