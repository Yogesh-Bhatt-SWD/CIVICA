const mongoose = require('mongoose');

const resolutionSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: [true, 'Report ID is required'],
  },
  authorityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters'],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resolution', resolutionSchema);
