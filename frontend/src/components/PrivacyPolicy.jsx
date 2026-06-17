import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-surface border border-glass-border rounded-2xl shadow-xl overflow-hidden p-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:text-primary-hover mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <h1 className="text-3xl font-headline-lg font-bold text-text-high mb-6">Privacy Policy</h1>
        <div className="text-text-medium space-y-6 leading-relaxed">
          <p>
            At Enlight Techz, we value your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our Learning Management System (LMS).
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, update your profile, submit coursework, or communicate with us. This may include your name, email address, phone number, and educational data.
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">2. How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve our services, process your transactions, send you technical notices and support messages, and respond to your comments and questions.
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">3. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
          </p>
          <p className="mt-8 text-sm text-text-dim">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
