const mongoose = require('mongoose');
const Content = require('./models/Content');
const Assessment = require('./models/Assessment');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(async () => {
    console.log('Connected to DB');
    const domain = "AI Engineering";
    
    // Clear old AI content if any
    await Content.deleteMany({ domain });

    const rawJson = fs.readFileSync('./day1.json', 'utf8');
    const data = JSON.parse(rawJson);

    // Create the Content entry, saving the JSON structure as a stringified body
    const c = new Content({
      category: `Week ${data.week}: ${data.course}`,
      title: `Day ${data.day}: ${data.title}`,
      type: "text",
      body: JSON.stringify({
        duration: data.duration,
        thumbnail: data.thumbnail,
        learningObjectives: data.learningObjectives,
        sections: data.sections,
        summary: data.summary
      }), // Saving JSON directly as string to be parsed by frontend
      order: 1,
      domain: domain
    });
    await c.save();

    // Create the Assessment entry
    let assessment = await Assessment.findOne({ domain });
    
    // Convert JSON format to the schema format for Assessment
    const mappedQuestions = data.assessment.questions.map(q => {
      const correctIdx = q.options.indexOf(q.answer);
      return {
        questionText: q.question,
        options: q.options,
        correctAnswerIndex: correctIdx !== -1 ? correctIdx : 0
      };
    });

    if (assessment) {
      assessment.questions = mappedQuestions;
      await assessment.save();
    } else {
      assessment = new Assessment({ domain, questions: mappedQuestions });
      await assessment.save();
    }

    console.log("Successfully seeded JSON course and assessment for AI Engineering!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
