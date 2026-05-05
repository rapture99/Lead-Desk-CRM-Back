const { Note } = require('../models');

exports.addNote = async (req, res) => {
  try {
    const note = await Note.create({
      text: req.body.text,
      LeadId: req.params.id,
    });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
