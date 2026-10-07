const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    enum: [
      'pothole', 'road_crack', 'open_manhole', 'flooding', 'other',
      'FallenTrees', 'DamagedElectricalPoles', 'Potholes and RoadCracks', 'Garbage',
      'pothole_crack', 'garbage', 'fallen_tree', 'poles'
    ],
    required: [true, 'Category is required'],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
    },
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  state: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending',
  },
  severity: {
    type: Number,
    min: [1, 'Severity must be at least 1'],
    max: [5, 'Severity cannot exceed 5'],
    default: 3,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  gravityScore: {
    type: Number,
    default: 0,
  },
  isDuplicate: {
    type: Boolean,
    default: false,
  },
  mergedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  aiValidated: {
    type: Boolean,
    default: false,
  },
  aiConfidence: {
    type: Number,
    default: null,
  },
  aiBoundingBox: {
    type: [Number],
    default: null,
  },
  estimatedDays: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 2dsphere index for geospatial queries
reportSchema.index({ location: '2dsphere' });

// Paginate plugin
reportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', reportSchema);
