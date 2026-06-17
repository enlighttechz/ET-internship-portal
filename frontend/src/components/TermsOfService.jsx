import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low to-surface-container-highest p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-surface border border-glass-border rounded-2xl shadow-xl overflow-hidden p-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:text-primary-hover mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <h1 className="text-3xl font-headline-lg font-bold text-text-high mb-6">Terms of Service</h1>
        <div className="text-text-medium space-y-6 leading-relaxed">
          <p>
            Welcome to the Enlight Techz Learning Management System. By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">1. Acceptance of Terms</h2>
          <p>
            By registering for and using our services, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">2. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
          </p>
          <h2 className="text-xl font-bold text-text-high mt-4">3. Code of Conduct</h2>
          <p>
            Users must engage respectfully with instructors and peers. Any form of harassment, cheating, or unauthorized sharing of proprietary course materials is strictly prohibited and may result in account termination.
          </p>
          <p className="mt-8 text-sm text-text-dim">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
