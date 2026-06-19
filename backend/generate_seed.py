import re
import json

with open("output/AI Engineering.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace image paths
html = re.sub(r'src="(\d+\.jpeg)"', r'src="/assets/ai-engineering/\1"', html)

# Split by assessment
parts = html.split('<p><strong>Assessment</strong></p>')
body = parts[0]

assessment_html = parts[1] if len(parts) > 1 else ""

# Extract questions
questions = []
q_blocks = re.findall(r'<p><strong>(\d+)\.\s+(.*?)</strong></p>(.*?)<p><strong>Answer:</strong>\s*([a-d])</p>', assessment_html, re.DOTALL)

for q_num, q_text, options_html, answer_letter in q_blocks:
    opts = re.findall(r'<p>([a-d])\)\s*(.*?)</p>', options_html)
    options_list = []
    correct_idx = 0
    for i, (letter, text) in enumerate(opts):
        options_list.append(text.strip())
        if letter == answer_letter:
            correct_idx = i
            
    questions.append({
        "questionText": q_text.strip(),
        "options": options_list,
        "correctAnswerIndex": correct_idx
    })

body_escaped = body.replace('`', '\\`')

seed_script = f"""const mongoose = require('mongoose');
const Content = require('./models/Content');
const Assessment = require('./models/Assessment');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(async () => {{
    console.log('Connected to DB');
    const domain = "AI Engineering";
    
    // Clear old AI content if any
    await Content.deleteMany({{ domain }});

    const c = new Content({{
      category: "Week 1: AI Engineering",
      title: "Day 1: Introduction to Artificial Intelligence (AI)",
      type: "text",
      body: `{body_escaped}`,
      order: 1,
      domain: domain
    }});
    await c.save();

    let assessment = await Assessment.findOne({{ domain }});
    const questions = {json.dumps(questions, indent=2)};
    if (assessment) {{
      assessment.questions = questions;
      await assessment.save();
    }} else {{
      assessment = new Assessment({{ domain, questions }});
      await assessment.save();
    }}

    console.log("Successfully seeded course and assessment for AI Engineering!");
    process.exit(0);
  }})
  .catch(err => {{
    console.error(err);
    process.exit(1);
  }});
"""

with open("seed_ai_eng.js", "w", encoding="utf-8") as f:
    f.write(seed_script)
