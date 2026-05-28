const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Report = require('../models/Report');

const NEW_USERS = [
  { name: 'Sonal Sharma', email: 'sonal@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Vikram Singh', email: 'vikram@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Meera Nair', email: 'meera@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Amit Chatterjee', email: 'amit@civica.com', password: 'password123', role: 'citizen' },
  { name: 'Lakshmi Prasad', email: 'lakshmi@civica.com', password: 'password123', role: 'citizen' },
];

const NEW_REPORTS = [
  {
    title: 'Severe Flooding in Connaught Place',
    description: 'Blocked drains in the Inner Circle are causing knee-deep water after every shower.',
    category: 'flooding',
    location: { type: 'Point', coordinates: [77.2167, 28.6333] }, // Delhi
    address: 'Inner Circle, Connaught Place',
    state: 'Delhi',
    severity: 5,
    status: 'pending',
    upvotes: 15,
  },
  {
    title: 'Hazardous Pothole near Amer Fort',
    description: 'A deep pothole has formed on the main uphill road, dangerous for tourist vehicles.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [75.8283, 26.9855] }, // Rajasthan
    address: 'Amer Fort Road, Jaipur',
    state: 'Rajasthan',
    severity: 4,
    status: 'in_progress',
    upvotes: 22,
  },
  {
    title: 'Garbage Accumulation at Fort Kochi',
    description: 'Public bins are overflowing near the Chinese fishing nets, attracting stray animals.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [76.2418, 9.9676] }, // Kerala
    address: 'Beach Front, Fort Kochi',
    state: 'Kerala',
    severity: 2,
    status: 'pending',
    upvotes: 10,
  },
  {
    title: 'Major Road Crack on Howrah Bridge Road',
    description: 'A structural crack has appeared on the approach road, needs immediate inspection.',
    category: 'road_crack',
    location: { type: 'Point', coordinates: [88.3585, 22.5851] }, // West Bengal
    address: 'Howrah Bridge Approach Road, Kolkata',
    state: 'West Bengal',
    severity: 5,
    status: 'pending',
    upvotes: 35,
  },
  {
    title: 'Blocked Drainage at Marina Beach Service Lane',
    description: 'Service road is constantly waterlogged due to old drainage pipes.',
    category: 'flooding',
    location: { type: 'Point', coordinates: [80.2825, 13.0489] }, // Tamil Nadu
    address: 'Kamarajar Salai, Marina Beach',
    state: 'Tamil Nadu',
    severity: 3,
    status: 'resolved',
    upvotes: 8,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // We do NOT deleteMany here, we APPEND.
    
    console.log('Creating new Indian users...');
    let createdUsers = [];
    for (const u of NEW_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`- User already exists: ${u.email} (Skipping)`);
        createdUsers.push(existing);
      } else {
        const user = await User.create(u);
        console.log(`- Created: ${u.name}`);
        createdUsers.push(user);
      }
    }

    console.log('Creating Indian-state reports...');
    const authorityUser = await User.findOne({ role: 'admin' });
    
    for (let i = 0; i < NEW_REPORTS.length; i++) {
        const reportData = NEW_REPORTS[i];
        const user = createdUsers[i % createdUsers.length];
        
        // Check if report with same title exists to avoid duplicates on multi-run
        const existingReport = await Report.findOne({ title: reportData.title });
        if (existingReport) {
            console.log(`- Report already exists: ${reportData.title} (Skipping)`);
            continue;
        }

        const report = new Report({
            ...reportData,
            submittedBy: user._id,
            assignedTo: reportData.status !== 'pending' && authorityUser ? authorityUser._id : null,
            aiValidated: true,
            aiConfidence: 0.92,
            gravityScore: (reportData.severity * 10) + (reportData.upvotes * 0.5)
        });

        await report.save();
        console.log(`- Report Added: ${reportData.title} at ${reportData.state}`);
    }

    console.log('Data Append Successful!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
