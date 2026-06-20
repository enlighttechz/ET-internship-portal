const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });
const Course = require('../backend/models/Course');

const initialData = [
  {
    title: 'AI-Assisted Frontend Development',
    description: 'Learn modern frontend development accelerated by AI tools like GitHub Copilot and ChatGPT.',
    fee: '₹2,999',
    duration: '4 Weeks',
    iconName: 'Monitor',
    color: 'border-teal-500'
  },
  {
    title: 'AI-Assisted Backend Development',
    description: 'Build robust and scalable backend systems using AI to optimize routing, databases, and APIs.',
    fee: '₹2,999',
    duration: '4 Weeks',
    iconName: 'Server',
    color: 'border-indigo-500'
  },
  {
    title: 'AI-Assisted Full Stack Development',
    description: 'Master complete web application development from UI to database, empowered by AI coding assistants.',
    fee: '₹3,499',
    duration: '4 Weeks',
    iconName: 'Code',
    color: 'border-fuchsia-500'
  },
  {
    title: 'AI-Assisted Android App Development',
    description: 'Develop high-performance Android applications efficiently using AI-driven development practices.',
    fee: '₹2,999',
    duration: '4 Weeks',
    iconName: 'Smartphone',
    color: 'border-emerald-500'
  },
  {
    title: 'AI Engineering',
    description: 'Learn to design, build, and deploy machine learning models and AI-powered software systems.',
    fee: '₹3,999',
    duration: '4 Weeks',
    iconName: 'Bot',
    color: 'border-violet-500'
  },
  {
    title: 'Prompt Engineering',
    description: 'Master the art of crafting effective prompts to get the best results from Large Language Models.',
    fee: '₹1,999',
    duration: '2 Weeks',
    iconName: 'Cpu',
    color: 'border-amber-500'
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(async () => {
    console.log('Connected to DB');
    await Course.deleteMany({});
    await Course.insertMany(initialData);
    console.log('Seeded courses successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
