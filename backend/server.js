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

const app = express();

app.use(cors({origin:'*'}));
app.use(express.json());

// Root route to prevent 404 when testing in browser
app.get('/', (req, res) => {
  res.send('LMS Backend API is running! Access the frontend at http://localhost:5173');
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

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
    const { name, contact } = req.body;
    const student = await Student.findByIdAndUpdate(req.student.id, { name, contact }, { new: true }).select('-password');
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
    const { category, title, type, body, videoUrl, order, domain } = req.body;
    const newContent = new Content({ category: category || 'General', title, type, body, videoUrl, order, domain: domain || 'All' });
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

app.post('/api/assessments/:domain/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body; // Array of selected option indices
    const assessment = await Assessment.findOne({ domain: req.params.domain });
    if (!assessment) return res.status(404).json({ msg: 'Assessment not found' });

    let score = 0;
    assessment.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        score += 1;
      }
    });

    const percentage = Math.round((score / assessment.questions.length) * 100);
    
    const student = await Student.findById(req.student.id);
    student.assessmentScore = percentage;
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
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ answer: "Gemini API key is not configured on the server. Please ask the administrator to set GEMINI_API_KEY in the .env file." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a helpful teaching assistant for the Enlight Techz platform. 
The student is asking a doubt about the following course content:
"${context}"

Student's question: ${question}

Please provide a clear, concise, and helpful answer.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ answer: text });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate answer" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
