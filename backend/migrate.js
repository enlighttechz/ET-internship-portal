require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('./models/Content');
const CourseDay = require('./models/CourseDay');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(async () => {
    console.log('MongoDB connected for migration.');
    try {
      const contents = await Content.find().sort({ domain: 1, order: 1 });
      console.log(`Found ${contents.length} contents to migrate.`);

      // Group by domain
      const groupedByDomain = {};
      contents.forEach(c => {
        if (!groupedByDomain[c.domain]) groupedByDomain[c.domain] = [];
        groupedByDomain[c.domain].push(c);
      });

      for (const [domain, items] of Object.entries(groupedByDomain)) {
        console.log(`Migrating domain: ${domain} (${items.length} items)`);
        
        const dayMap = {}; // map of dayNumber to { title, items }
        let currentDayNum = 0;
        
        items.forEach((c) => {
           let dayNum = currentDayNum;
           const dayMatch = c.title.match(/Day\s*(\d+)/i);
           if (dayMatch) {
             dayNum = parseInt(dayMatch[1]);
             currentDayNum = dayNum;
           } else {
             // If no Day X in title, just increment if we are at 0 or use current
             if (currentDayNum === 0) {
               currentDayNum = 1;
               dayNum = 1;
             }
           }

           if (!dayMap[dayNum]) {
             dayMap[dayNum] = {
                title: c.title.replace(/^Day\s*\d+[\s:-]*/i, '').trim() || `Day ${dayNum}`,
                items: []
             };
           }

           dayMap[dayNum].items.push({
             itemType: 'content',
             title: c.title,
             contentType: c.type,
             body: c.body,
             videoUrl: c.videoUrl,
             imageUrl: c.imageUrl
           });
        });

        // Insert into CourseDays
        for (const [dayNumStr, data] of Object.entries(dayMap)) {
           const dayNum = parseInt(dayNumStr);
           
           // Check if exists
           let courseDay = await CourseDay.findOne({ domain, dayNumber: dayNum });
           if (!courseDay) {
             courseDay = new CourseDay({
               domain,
               dayNumber: dayNum,
               title: data.title,
               items: data.items
             });
             await courseDay.save();
             console.log(`Created CourseDay ${dayNum} for ${domain}`);
           } else {
             console.log(`CourseDay ${dayNum} already exists for ${domain}, appending items if missing.`);
             // Only append if it has 0 items
             if (courseDay.items.length === 0) {
                courseDay.items = data.items;
                await courseDay.save();
             }
           }
        }
      }

      console.log('Migration complete!');
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
