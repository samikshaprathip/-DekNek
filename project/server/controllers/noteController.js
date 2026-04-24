const Note = require('../models/Note');

const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Title and content are required');
    }

    const note = await Note.create({
      userId: req.user.id,
      title,
      content,
    });

    return res.status(201).json(note);
  } catch (error) {
    return next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found');
    }

    note.title = req.body.title ?? note.title;
    note.content = req.body.content ?? note.content;

    const updatedNote = await note.save();
    return res.json(updatedNote);
  } catch (error) {
    return next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

    if (!note) {
      res.status(404);
      throw new Error('Note not found');
    }

    await note.deleteOne();
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};
