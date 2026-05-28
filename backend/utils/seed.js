const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Report = require('../models/Report');

const USERS = [
  { name: 'Civic Authority', email: 'admin@civica.com', password: 'password123', role: 'admin' },
  { name: 'Arjun Mehra', email: 'citizen@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Priya Patel', email: 'priya@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Rahul Verma', email: 'rahul@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Anjali Gupta', email: 'anjali@civica.com', password: 'password123', role: 'citizen' },
];

const MOCK_REPORTS = [
  {
    title: 'Large Pothole on MG Road',
    description: 'A deep pothole is causing traffic delays and risks for cyclists near the metro station.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
    address: 'MG Road, Central Business District',
    state: 'Karnataka',
    severity: 5,
    status: 'pending',
    upvotes: 12,
  },
  {
    title: 'Major Road Crack near Marine Drive',
    description: 'Long crack spanning across the main promenade road, needs urgent resurfacing.',
    category: 'road_crack',
    location: { type: 'Point', coordinates: [72.8231, 18.9431] }, // Mumbai
    address: 'Marine Drive, Netaji Subhash Chandra Bose Road',
    state: 'Maharashtra',
    severity: 3,
    status: 'in_progress',
    upvotes: 8,
  },
  {
    title: 'Garbage Overflowing in Cubbon Park',
    description: 'Bins are overflowing near the bandstand and attracting pests.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [77.5913, 12.9767] }, // Bangalore
    address: 'Cubbon Park Entrance, Sampangi Rama Nagar',
    state: 'Karnataka',
    severity: 2,
    status: 'pending',
    upvotes: 5,
  },
  {
    title: 'Broken Street Light on 15th Cross',
    description: 'Entire block is dark at night near the HSR Layout market, local safety concern.',
    category: 'other',
    location: { type: 'Point', coordinates: [77.6371, 12.9103] }, // Bangalore
    address: '15th Cross, HSR Layout Sector 4',
    state: 'Karnataka',
    severity: 4,
    status: 'pending',
    upvotes: 18,
  },
  {
    title: 'Flash Flooding after Rain in Connaught Place',
    description: 'Drainage system seems blocked in Inner Circle, water stays for hours after rain.',
    category: 'flooding',
    location: { type: 'Point', coordinates: [77.2167, 28.6333] }, // Delhi
    address: 'Inner Circle, Connaught Place',
    state: 'Delhi',
    severity: 5,
    status: 'resolved',
    upvotes: 25,
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Cleaning existing data...');
    await User.deleteMany({});
    await Report.deleteMany({});

    console.log('Creating default users...');
    const createdUsers = await User.create(USERS);
    const citizenUsers = createdUsers.filter(u => u.role === 'citizen');
    const authorityUser = createdUsers.find(u => u.role === 'admin');

    console.log('Creating mock reports...');
    const reportsWithUser = MOCK_REPORTS.map((r, i) => ({
      ...r,
      submittedBy: citizenUsers[i % citizenUsers.length]._id,
      assignedTo: r.status !== 'pending' ? authorityUser._id : null,
      aiValidated: i % 2 === 0,
      aiConfidence: i % 2 === 0 ? 0.85 + (i * 0.02) : null,
      gravityScore: 40 + (r.severity * 10) + (r.upvotes * 0.5)
    }));

    await Report.insertMany(reportsWithUser);

    console.log('Database Seeded Successfully!');
    console.log('-----------------------------------');
    console.log('Login Credentials (password: password123):');
    console.log('  Admin:     admin@civica.com (' + USERS[0].name + ')');
    console.log('  Authority: authority@civica.com (' + USERS[1].name + ')');
    console.log('  Citizen:   citizen@civica.com (' + USERS[2].name + ')');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
