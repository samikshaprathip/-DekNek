const Task = require('../models/Task');

const createTask = async (req, res, next) => {
  try {
    const { title, completed } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Title is required');
    }

    const task = await Task.create({
      userId: req.user.id,
      title,
      completed,
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    task.title = req.body.title ?? task.title;
    if (typeof req.body.completed === 'boolean') {
      task.completed = req.body.completed;
    }

    const updatedTask = await task.save();
    return res.json(updatedTask);
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    await task.deleteOne();
    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
