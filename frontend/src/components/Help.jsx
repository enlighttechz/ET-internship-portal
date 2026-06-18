import React from 'react';
import { ArrowLeft, Mail, Phone, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-surface border border-glass-border rounded-2xl shadow-xl overflow-hidden p-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:text-primary-hover mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <h1 className="text-3xl font-headline-lg font-bold text-text-high mb-6">Help & Support</h1>
        <div className="grid md:grid-cols-2 gap-6 text-text-medium">
          
          <div className="bg-surface-container border border-glass-border p-6 rounded-xl">
            <Mail className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-bold text-text-high mb-2">Email Support</h2>
            <p className="mb-4">For technical issues or account inquiries, send us an email.</p>
            <a href="mailto:info@enlighttechz.in" className="text-primary hover:underline">info@enlighttechz.in</a>
          </div>

          <div className="bg-surface-container border border-glass-border p-6 rounded-xl">
            <Phone className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-bold text-text-high mb-2">Call Us</h2>
            <p className="mb-4">Available Mon-Fri, 9am - 6pm IST for urgent queries.</p>
            <p className="text-primary font-medium">+91 88259 18573</p>
          </div>

          <div className="bg-surface-container border border-glass-border p-6 rounded-xl md:col-span-2">
            <BookOpen className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-xl font-bold text-text-high mb-2">Frequently Asked Questions</h2>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-text-high">How do I reset my password?</h3>
                <p className="text-sm mt-1">You can reset your password from the login page by clicking on "Forgot Password" and following the instructions sent to your email.</p>
              </div>
              <div>
                <h3 className="font-semibold text-text-high">Where can I find my certificates?</h3>
                <p className="text-sm mt-1">Once a course is completed, you can view and download your certificates from the "Certificates" section in your Dashboard.</p>
              </div>
              <div>
                <h3 className="font-semibold text-text-high">How can I ask a doubt during a course?</h3>
                <p className="text-sm mt-1">Use the "Ask Doubt" feature in the bottom right corner of the dashboard to chat with an instructor or AI assistant.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Help;
