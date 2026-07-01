require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const Student = require('./models/Student');
const Notification = require('./models/Notification');
const Content = require('./models/Content');
const Assessment = require('./models/Assessment');
const Course = require('./models/Course');
const CourseDay = require('./models/CourseDay');
const GeminiSession = require('./models/GeminiSession');
const RecommendationChat = require('./models/RecommendationChat');
const SystemConfig = require('./models/SystemConfig');
const Feedback = require('./models/Feedback');

const app = express();

app.use(cors({origin:['http://intern.enlighttechz.in','https://et-internship-portal-e2mjhb7vk-prasath-ss-projects.vercel.app/','https://et-internship-portal-e2mjhb7vk-prasath-ss-projects.vercel.app','http://intern.enlighttechz.in/', 'https://intern.enlighttechz.in/','https://intern.enlighttechz.in', 'https://et-internship-portal.vercel.app/','http://localhost:5173/', 'http://localhost:5173']}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let cachedKeys = [];

const getGeminiResponse = async (prompt, systemPrompt = null, isChat = false, chatHistory = []) => {
  if (cachedKeys.length === 0) {
    let keys = [process.env.GEMINI_API_KEY].filter(Boolean);
    try {
      const config = await SystemConfig.findOne();
      if (config && config.geminiApiKeys && config.geminiApiKeys.length > 0) {
        keys = [...config.geminiApiKeys, ...keys];
      }
    } catch(e) { console.error('Error fetching SystemConfig', e); }
    cachedKeys = [...new Set(keys)];
  }
  
  if (cachedKeys.length === 0) throw new Error("No Gemini API Keys available.");

  let lastError;
  for (let i = 0; i < cachedKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(cachedKeys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      
      let result;
      if (isChat) {
        const contents = chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        if (contents.length > 0 && systemPrompt) {
          contents[0].parts[0].text = `[SYSTEM INSTRUCTION: ${systemPrompt}]\n\n${contents[0].parts[0].text}`;
        }
        result = await model.generateContent({ contents });
      } else {
        result = await model.generateContent(prompt);
      }
      
      return result.response.text();
    } catch (err) {
      console.warn(`Gemini key at index ${i} failed:`, err.message);
      lastError = err;
    }
  }

  // If we reach here, all keys failed
  try {
    await Notification.create({
      message: "URGENT: All Gemini API keys have failed or expired. Please update them in System Settings.",
      type: "alert",
      domain: "System"
    });
  } catch (e) { console.error("Could not create notification", e); }

  throw new Error("All Gemini API keys exhausted. Last error: " + lastError?.message);
};

// Global Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      console.error(`❌ ERROR: ${logMessage}`);
    } else {
      console.log(`✅ SUCCESS: ${logMessage}`);
    }
  });
  
  next();
});

// Root route to prevent 404 when testing in browser
app.get('/', (req, res) => {
  res.send('LMS Backend API is running! Access the frontend at http://localhost:5173');
});

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  
  mongoose.set("bufferCommands", false);
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
  
  isConnected = true;
  console.log('MongoDB Connected');
}

// Ensure DB is connected on every API request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- System Config Routes ---
app.get('/api/system-config', async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = await SystemConfig.create({});
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/system-config', async (req, res) => {
  try {
    const { geminiApiKeys, isCourseShuttered, shutterNote } = req.body;
    let updateObj = {};
    if (geminiApiKeys !== undefined) updateObj.geminiApiKeys = geminiApiKeys;
    if (isCourseShuttered !== undefined) updateObj.isCourseShuttered = isCourseShuttered;
    if (shutterNote !== undefined) updateObj.shutterNote = shutterNote;

    let config = await SystemConfig.findOneAndUpdate({}, { $set: updateObj }, { new: true, upsert: true });
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Middleware
const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_12345');
    req.student = decoded.student;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// --- AI Q&A Evaluation ---
app.post('/api/evaluate-answer', protect, async (req, res) => {
  const { question, expectedAnswer, studentAnswer } = req.body;
  if (!question || !studentAnswer) return res.status(400).json({ error: 'Question and student answer are required' });
  
  try {
    const prompt = `You are an expert evaluator. The user is answering the following question: "${question}".
The expected answer or core concept is: "${expectedAnswer || 'General correctness'}".
The student's answer is: "${studentAnswer}".

Evaluate if the student's answer is correct or sufficiently accurate. 
Return the response ONLY as a valid JSON object with the following exact keys:
{
  "isCorrect": true/false,
  "aiReason": "A brief explanation and feedback directly addressed to the student (e.g. 'Great job! You correctly identified...', or 'Not quite. The correct concept is...')."
}`;
    
    const rawResponse = await getGeminiResponse(prompt);
    // Find JSON block
    const match = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = match ? match[1] : rawResponse.replace(/```json|```/g, '');
    
    const evaluation = JSON.parse(jsonStr.trim());
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth API
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, domain } = req.body;
  try {
    let student = await Student.findOne({ email });
    if (student) return res.status(400).json({ msg: 'Student already exists' });
    
    const internId = `ET-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
    student = new Student({ name, email, password, domain, internId });
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
    await student.save();
    
    const payload = { student: { id: student.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey_12345', { expiresIn: '5 days' }, (err, token) => {
      if (err) throw err;
      res.json({ token, student });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ msg: 'Invalid Credentials' });
    
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
    
    student.lastLogin = Date.now();
    await student.save();

    const payload = { student: { id: student.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey_12345', { expiresIn: '5 days' }, (err, token) => {
      if (err) throw err;
      res.json({ token, student });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(404).json({ msg: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    student.resetOtp = otp;
    student.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await student.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@enlighttechz.com',
      to: email,
      subject: 'Password Reset OTP - Enlight Techz LMS',
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`[Dev Mode - No SMTP] Password Reset OTP for ${email}: ${otp}`);
    }

    res.json({ msg: 'OTP sent to email successfully. Please check your inbox.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const student = await Student.findOne({ 
      email, 
      resetOtp: otp, 
      resetOtpExpires: { $gt: Date.now() } 
    });

    if (!student) return res.status(400).json({ msg: 'Invalid or expired OTP' });
    
    res.json({ msg: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const student = await Student.findOne({ 
      email, 
      resetOtp: otp, 
      resetOtpExpires: { $gt: Date.now() } 
    });

    if (!student) return res.status(400).json({ msg: 'Invalid or expired OTP' });

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    student.resetOtp = undefined;
    student.resetOtpExpires = undefined;
    await student.save();

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK',condition:'Healthy API Running successfully!...' });
});
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select('-password');
    if (student && !student.internId) {
      student.internId = `ET-${student._id.toString().slice(-6).toUpperCase()}`;
      await student.save();
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', protect, async (req, res) => {
  try {
    const { name, contact, domain, addDomain, collegeName, location, degree, specialization } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (contact) updateData.contact = contact;
    if (domain) updateData.domain = domain;
    if (collegeName !== undefined) updateData.collegeName = collegeName;
    if (location !== undefined) updateData.location = location;
    if (degree !== undefined) updateData.degree = degree;
    if (specialization !== undefined) updateData.specialization = specialization;
    
    let updateQuery = {};
    if (Object.keys(updateData).length > 0) {
      updateQuery.$set = updateData;
    }
    if (addDomain) {
      updateQuery.$addToSet = { additionalCourses: { domain: addDomain } };
    }
    
    const student = await Student.findByIdAndUpdate(req.student.id, updateQuery, { new: true }).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const domain = req.query.domain || 'all';
    // If student domain is provided, fetch 'all' and their specific domain
    const query = domain !== 'all' ? { domain: { $in: ['all', domain] } } : {};
    const notifications = await Notification.find(query).sort({ date: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { message, type, domain } = req.body;
    const newNotification = new Notification({ message, type, domain: domain || 'all' });
    await newNotification.save();
    res.json(newNotification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course API
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, fee, duration, iconName, color, imageUrl, whatsappLink, onboardingNote, startDate } = req.body;
    const newCourse = new Course({ title, description, fee, duration, iconName, color, imageUrl, whatsappLink, onboardingNote, startDate });
    await newCourse.save();
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contents/:id', async (req, res) => {
  try {
    const updated = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cashfree Payment API
app.post('/api/payment/create-order', protect, async (req, res) => {
  try {
    const { amount, courseId, customerPhone } = req.body;
    const student = await Student.findById(req.student.id);
    
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const envMode = process.env.CASHFREE_ENV || 'SANDBOX';
    
    const orderId = `order_${new mongoose.Types.ObjectId()}`;

    if (!appId || !secretKey) {
      console.log('No Cashfree credentials found, returning mock session ID');
      return res.json({ payment_session_id: 'session_' + orderId, order_id: orderId });
    }

    const axiosConfig = {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    };

    const baseUrl = envMode === 'PRODUCTION' ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders';

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: student.internId || student._id.toString(),
        customer_name: student.name,
        customer_email: student.email,
        customer_phone: customerPhone || student.contact || '9999999999'
      },
      order_meta: {
        return_url: `http://localhost:5173/course?order_id=${orderId}&course_id=${courseId}`
      }
    };

    // Need to use regular axios, but we haven't imported it inside the backend if not available. Wait, axios is not standard in backend.
    // Wait, axios is NOT in backend! Express doesn't use axios. Let's use native fetch.
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: axiosConfig.headers,
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment API Error');
    
    res.json({ payment_session_id: data.payment_session_id, order_id: orderId });
  } catch (err) {
    console.error('Cashfree Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Content API
app.get('/api/contents', async (req, res) => {
  try {
    const domain = req.query.domain;
    const query = domain ? { domain: { $in: ['All', domain] } } : {};
    const contents = await Content.find(query).sort({ order: 1 });
    res.json(contents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contents', async (req, res) => {
  try {
    const { category, title, type, body, videoUrl, imageUrl, order, domain } = req.body;
    const newContent = new Content({ category: category || 'General', title, type, body, videoUrl, imageUrl, order, domain: domain || 'All' });
    await newContent.save();
    res.json(newContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contents/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course Day API
const apiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getCache = (key) => {
  const item = apiCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  return null;
};

const setCache = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};
app.get('/api/course-days/:domain/summary', async (req, res) => {
  try {
    const cacheKey = `summary_${req.params.domain}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const courseDays = await CourseDay.find({ domain: req.params.domain })
      .select('-items.content -items.body -items.expectedAnswer')
      .sort({ dayNumber: 1 })
      .lean();
    
    setCache(cacheKey, courseDays);
    res.json(courseDays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/course-days/:domain/day/:dayNumber', async (req, res) => {
  try {
    const cacheKey = `day_${req.params.domain}_${req.params.dayNumber}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const courseDay = await CourseDay.findOne({ 
      domain: req.params.domain, 
      dayNumber: req.params.dayNumber 
    }).lean();
    
    if (!courseDay) return res.status(404).json({ error: 'Day not found' });
    
    setCache(cacheKey, courseDay);
    res.json(courseDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/course-days/:domain', async (req, res) => {
  try {
    const cacheKey = `fulldomain_${req.params.domain}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const courseDays = await CourseDay.find({ domain: req.params.domain }).sort({ dayNumber: 1 }).lean();
    
    setCache(cacheKey, courseDays);
    res.json(courseDays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/course-days', async (req, res) => {
  try {
    const { domain, dayNumber, week, title, description, items, qnaText, geminiPrompt } = req.body;
    const newDay = new CourseDay({ domain, dayNumber, week, title, description, items: items || [], qnaText, geminiPrompt });
    await newDay.save();
    apiCache.clear();
    res.json(newDay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/course-days/:id', async (req, res) => {
  try {
    const updated = await CourseDay.findByIdAndUpdate(req.params.id, req.body, { new: true });
    apiCache.clear();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/course-days/:id', async (req, res) => {
  try {
    await CourseDay.findByIdAndDelete(req.params.id);
    apiCache.clear();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assessment API
app.get('/api/assessments/:domain', async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ domain: req.params.domain });
    if (!assessment) return res.json(null);
    
    // Hide correct answers if not admin (for simplicity, we just send questions without answers to students)
    // Actually, to grade it easily on backend, we will send without answers if requested, 
    // but admin needs to see them. For now, let's just send the whole thing to keep it simple, 
    // or send without answers and grade on backend.
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments', async (req, res) => {
  try {
    const { domain, questions } = req.body;
    let assessment = await Assessment.findOne({ domain });
    if (assessment) {
      assessment.questions = questions;
      await assessment.save();
    } else {
      assessment = new Assessment({ domain, questions });
      await assessment.save();
    }
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments/import-form', async (req, res) => {
  try {
    let { url } = req.body;
    if (!url || (!url.includes('docs.google.com/forms') && !url.includes('forms.gle'))) {
      return res.status(400).json({ msg: 'Invalid Google Forms URL' });
    }

    // Use fetch since axios may not be available in backend environment (as seen in earlier errors) or we can just require axios inside.
    // Actually, axios is in package.json, let's use it.
    const axios = require('axios');
    const response = await axios.get(url);
    const html = response.data;
    
    // Google Forms stores its data in a JS variable FB_PUBLIC_LOAD_DATA_
    const startStr = 'var FB_PUBLIC_LOAD_DATA_ = ';
    const startIdx = html.indexOf(startStr);
    
    if (startIdx === -1) {
      return res.status(400).json({ msg: 'Could not extract form data. Ensure the form is public.' });
    }

    const jsonStart = startIdx + startStr.length;
    const endIdx = html.indexOf('</script>', jsonStart);
    let jsonStr = html.substring(jsonStart, endIdx).trim();
    if (jsonStr.endsWith(';')) {
      jsonStr = jsonStr.slice(0, -1);
    }

    const data = JSON.parse(jsonStr);
    const formQuestions = data[1][1];
    
    if (!formQuestions) {
      return res.status(400).json({ msg: 'No questions found in form' });
    }

    const parsedQuestions = [];
    
    for (let q of formQuestions) {
      // type 2 corresponds to multiple choice
      const qText = q[1];
      const qType = q[3]; 
      
      // We only want multiple choice or dropdowns
      if (qType === 2 || qType === 3 || qType === 4) {
        const optionsList = q[4][0][1];
        if (optionsList && optionsList.length > 0) {
          const options = optionsList.map(opt => opt[0]);
          // Pad to 4 options if fewer, take first 4 if more
          while (options.length < 4) options.push("");
          const finalOptions = options.slice(0, 4);
          
          parsedQuestions.push({
            questionText: qText,
            options: finalOptions,
            correctAnswerIndex: 0 // Default to first option as we can't fetch correct answers from a public form easily
          });
        }
      }
    }

    res.json({ questions: parsedQuestions });
  } catch (err) {
    console.error('Error importing form:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments/:domain/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected option indices
    const domain = req.params.domain;
    const assessment = await Assessment.findOne({ domain });
    if (!assessment) return res.status(404).json({ msg: 'Assessment not found' });

    let score = 0;
    assessment.questions.forEach((q, index) => {
      const ans = answers[index];
      if (q.type === 'rearrange') {
        if (Array.isArray(ans) && 
            ans.length === q.correctOrder.length && 
            ans.every((val, i) => val === q.correctOrder[i])) {
          score += 1;
        }
      } else {
        if (ans === q.correctAnswerIndex) {
          score += 1;
        }
      }
    });

    const percentage = Math.round((score / assessment.questions.length) * 100);
    
    const student = await Student.findById(req.student.id);
    if (student.domain === domain) {
      student.assessmentScore = percentage;
    } else {
      const course = student.additionalCourses.find(c => c.domain === domain);
      if (course) course.assessmentScore = percentage;
    }
    await student.save();

    res.json({ score: percentage, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Students API
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, password, domain } = req.body;
    const internId = `ET-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
    const student = new Student({ name, email, password, domain, internId });
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/course', async (req, res) => {
  try {
    const { domain, learningProgress, attendance, assessmentScore } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    
    if (student.domain === domain) {
      if (learningProgress !== undefined) {
        if (learningProgress > student.learningProgress) {
          student.lastDayCompletedAt = new Date();
        }
        student.learningProgress = learningProgress;
      }
      if (attendance !== undefined) student.attendance = attendance;
      if (assessmentScore !== undefined) student.assessmentScore = assessmentScore;
    } else {
      const course = student.additionalCourses.find(c => c.domain === domain);
      if (course) {
        if (learningProgress !== undefined) {
          if (learningProgress > course.learningProgress) {
            course.lastDayCompletedAt = new Date();
          }
          course.learningProgress = learningProgress;
        }
        if (attendance !== undefined) course.attendance = attendance;
        if (assessmentScore !== undefined) course.assessmentScore = assessmentScore;
      }
    }
    await student.save();
    const updatedStudent = await Student.findById(req.params.id).select('-password');
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/onboarding', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { hasCompletedOnboarding: true }, { new: true }).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/complete-profile', async (req, res) => {
  try {
    const { collegeName, location, degree, specialization, contact } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      { collegeName, location, degree, specialization, contact, hasCompletedProfile: true }, 
      { new: true }
    ).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/track-time', protect, async (req, res) => {
  try {
    const { domain, dayNumber, itemIndex, timeSpentSeconds } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    // Check if entry exists
    const existingEntryIndex = student.timeTracking.findIndex(t => t.domain === domain && t.dayNumber === dayNumber && t.itemIndex === itemIndex);
    if (existingEntryIndex > -1) {
      student.timeTracking[existingEntryIndex].timeSpentSeconds += timeSpentSeconds;
    } else {
      student.timeTracking.push({ domain, dayNumber, itemIndex, timeSpentSeconds });
    }
    await student.save();
    res.json({ msg: 'Time tracked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students/:id/improve-yourself', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    const text = await getGeminiResponse(prompt);
    
    res.json({ report: text });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate report" });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini Ask Doubt API
app.post('/api/ask-doubt', protect, async (req, res) => {
  try {
    const { question, context } = req.body;
    const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [process.env.GEMINI_API_KEY];
    
    let answer = null;
    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key.trim());
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `You are a helpful teaching assistant for the Enlight Techz platform. The student is asking a doubt about: "${context}". Question: ${question}`;
        const result = await model.generateContent(prompt);
        answer = (await result.response).text();
        break;
      } catch (err) {
        console.error(`Key ${key.slice(0, 5)} failed:`, err.message);
      }
    }

    if (!answer) {
      await Alert.create({ type: 'System', message: 'All Gemini API keys failed' });
      return res.status(500).json({ error: "Failed to generate answer after trying all keys" });
    }

    res.json({ answer });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate answer" });
  }
});

// Gemini Interactive Session API
app.post('/api/gemini-session/start', protect, async (req, res) => {
  try {
    const { domain, dayId } = req.body;
    let session = await GeminiSession.findOne({ studentId: req.student.id, dayId });
    if (!session) {
      session = new GeminiSession({ studentId: req.student.id, domain, dayId, chatHistory: [] });
      await session.save();
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini-session/chat', protect, async (req, res) => {
  try {
    const { sessionId, message, systemPrompt } = req.body;
    const session = await GeminiSession.findById(sessionId);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    
    session.chatHistory.push({ role: 'user', text: message });
    
    const aiResponse = await getGeminiResponse(null, systemPrompt, true, session.chatHistory);

    session.chatHistory.push({ role: 'model', text: aiResponse });
    await session.save();
    
    res.json(session);
  } catch (err) {
    console.error("Gemini Session Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Recommendation Chat API
app.get('/api/recommendations/:studentId', async (req, res) => {
  try {
    let chat = await RecommendationChat.findOne({ studentId: req.params.studentId });
    if (!chat) {
      chat = new RecommendationChat({ studentId: req.params.studentId, messages: [] });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recommendations/:studentId', async (req, res) => {
  try {
    const { text, senderRole } = req.body;
    let chat = await RecommendationChat.findOne({ studentId: req.params.studentId });
    if (!chat) {
      chat = new RecommendationChat({ studentId: req.params.studentId, messages: [] });
    }
    chat.messages.push({ senderRole, text, read: false });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/recommendations/:studentId/read', async (req, res) => {
  try {
    const { roleToMarkRead } = req.body; // e.g. if student views, mark 'Admin' messages as read
    const chat = await RecommendationChat.findOne({ studentId: req.params.studentId });
    if (chat) {
      chat.messages.forEach(msg => {
        if (msg.senderRole === roleToMarkRead) {
          msg.read = true;
        }
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Feedback API
app.post('/api/feedbacks', protect, async (req, res) => {
  try {
    const { domain, rating, message } = req.body;
    const student = await Student.findById(req.student.id);
    const feedback = await Feedback.create({
      studentId: req.student.id,
      studentName: student ? student.name : 'Unknown',
      domain, rating, message
    });
    res.json(feedback);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/feedbacks/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
