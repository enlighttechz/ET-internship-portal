const mongoose = require('mongoose');
require('dotenv').config();
const CourseDay = require('./models/CourseDay');

const SOURCE_DOMAIN = "AI WEB DEVELOPMENT (FRONT-END)";
const TARGET_DOMAINS = [
  "INTERMEDIATE AI-ASSISTED WEB DEVELOPMENT (FRONT-END)",
  "AI-Assisted Full-Stack Development"
];

async function clone() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const sourceDays = await CourseDay.find({ domain: SOURCE_DOMAIN, dayNumber: { $lte: 5 } }).sort({ dayNumber: 1 });
    console.log(`Found ${sourceDays.length} days to clone from ${SOURCE_DOMAIN}`);

    for (let target of TARGET_DOMAINS) {
      for (let sourceDay of sourceDays) {
        const exists = await CourseDay.findOne({ domain: target, dayNumber: sourceDay.dayNumber });
        if (!exists) {
          const newDay = new CourseDay({
            domain: target,
            dayNumber: sourceDay.dayNumber,
            title: sourceDay.title,
            description: sourceDay.description,
            items: sourceDay.items,
            hidden: sourceDay.hidden,
            qnaText: sourceDay.qnaText,
            geminiPrompt: sourceDay.geminiPrompt
          });
          await newDay.save();
          console.log(`Cloned Day ${sourceDay.dayNumber} to ${target}`);
        } else {
          console.log(`Day ${sourceDay.dayNumber} already exists in ${target}`);
        }
      }
    }
    
    console.log("Cloning complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clone();
