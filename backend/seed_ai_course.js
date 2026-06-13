const mongoose = require('mongoose');
const Content = require('./models/Content');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(async () => {
    console.log('Connected to DB');
    const domain = "AI Assisted App development";
    
    // Clear old AI content if any
    await Content.deleteMany({ domain });

    const modules = [
      {
        category: "Week 1: Frontend App Foundations",
        items: [
          "Day 1 Understanding AI-generated web apps",
          "Day 2 Setting up project structure",
          "Day 3 Creating authentication systems",
          "Day 4 Connecting frontend to cloud databases",
          "Day 5 Building realtime features",
          "Day 6 Assessment — login & dashboard UI"
        ]
      },
      {
        category: "Week 2: Smart App Features",
        items: [
          "Day 1 AI-generated productivity features",
          "Day 2 File upload systems",
          "Day 3 Realtime notification UI",
          "Day 4 User profile systems",
          "Day 5 Frontend data management",
          "Day 6 Assessment — productivity app module"
        ]
      },
      {
        category: "Week 3: Product Workflow Development",
        items: [
          "Day 1 Building AI chat interfaces",
          "Day 2 Creating dashboard analytics UI",
          "Day 3 Frontend optimization techniques",
          "Day 4 Deployment workflow",
          "Day 5 Testing & improvements",
          "Day 6 Assessment — deploy working app"
        ]
      },
      {
        category: "Week 4: Real Project Production",
        items: [
          "Day 1 Planning final product",
          "Day 2 Building main features",
          "Day 3 Improving user experience",
          "Day 4 Final optimization",
          "Day 5 Project review & presentation",
          "Day 6 Final project — AI productivity app"
        ]
      }
    ];

    let order = 1;
    for (const mod of modules) {
      for (const title of mod.items) {
        const c = new Content({
          category: mod.category,
          title: title,
          type: "text",
          body: `<p>Welcome to ${title}. This module covers the essential concepts and practical applications required to master this topic in AI Assisted App Development.</p>`,
          order: order++,
          domain: domain
        });
        await c.save();
      }
    }
    console.log("Successfully seeded course!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
