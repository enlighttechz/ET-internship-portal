import React, { useState } from 'react';
import * as soundLibrary from '../utils/soundLibrary';

const Assessment = ({ assessment, onSubmit }) => {
  const [answers, setAnswers] = useState(() => {
    if (!assessment || !assessment.questions) return [];
    return assessment.questions.map(q => {
      // For rearrange questions, initialize with the provided options
      if (q.type === 'rearrange') {
        return [...q.options];
      }
      if (q.type === 'msq') {
        return [];
      }
      if (q.type === 'text_input') {
        return '';
      }
      return null;
    });
  });

  const handleSelect = (qIndex, value) => {
    const newAnswers = [...answers];
    const qType = assessment.questions[qIndex].type;
    
    if (qType === 'msq') {
      const currentArr = newAnswers[qIndex] || [];
      if (currentArr.includes(value)) {
        newAnswers[qIndex] = currentArr.filter(v => v !== value);
      } else {
        newAnswers[qIndex] = [...currentArr, value];
      }
    } else {
      newAnswers[qIndex] = value;
    }
    
    setAnswers(newAnswers);
  };

  const moveItem = (qIndex, itemIndex, direction) => {
    const newAnswers = [...answers];
    const items = [...newAnswers[qIndex]];
    if (direction === -1 && itemIndex > 0) {
      // Move up
      [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
    } else if (direction === 1 && itemIndex < items.length - 1) {
      // Move down
      [items[itemIndex + 1], items[itemIndex]] = [items[itemIndex], items[itemIndex + 1]];
    }
    newAnswers[qIndex] = items;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!assessment || !assessment.questions) return;

    // Check if any question is unanswered
    const isUnanswered = answers.some((ans, idx) => {
      const type = assessment.questions[idx].type;
      if (type === 'rearrange') return false;
      if (type === 'msq') return !ans || ans.length === 0;
      if (type === 'text_input') return typeof ans !== 'string' || ans.trim() === '';
      return ans === null;
    });

    if (isUnanswered) {
      return alert("Please answer all questions before submitting.");
    }

    // Play success sound on submission
    soundLibrary.playSuccessChime();

    onSubmit(answers);
  };

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return <p className="text-center text-text-dim p-8 bg-surface-container rounded-xl">No assessment questions available yet.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {assessment.questions.map((q, qIndex) => (
        <div key={qIndex} className="mb-8 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm">
          <p className="font-bold text-lg mb-4 text-text-primary">{qIndex + 1}. {q.questionText}</p>
          
          {(!q.type || q.type === 'text' || q.type === 'mcq') && (
            <div className="flex flex-col gap-3">
              {q.options.map((opt, optIndex) => (
                <label 
                  key={optIndex} 
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer border transition-all ${answers[qIndex] === optIndex ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm' : 'bg-surface border-transparent hover:border-outline-variant/50'}`}
                >
                  <input 
                    type="radio" 
                    name={`question-${qIndex}`} 
                    checked={answers[qIndex] === optIndex} 
                    onChange={() => handleSelect(qIndex, optIndex)} 
                    className="w-4 h-4 text-primary bg-background border-outline-variant focus:ring-primary focus:ring-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === 'msq' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-dim mb-1 italic">Select all that apply</p>
              {q.options.map((opt, optIndex) => (
                <label 
                  key={optIndex} 
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer border transition-all ${(answers[qIndex] || []).includes(optIndex) ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm' : 'bg-surface border-transparent hover:border-outline-variant/50'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={(answers[qIndex] || []).includes(optIndex)} 
                    onChange={() => handleSelect(qIndex, optIndex)} 
                    className="w-4 h-4 text-primary bg-background border-outline-variant rounded focus:ring-primary focus:ring-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === 'text_input' && (
            <div className="flex flex-col gap-3">
              <textarea 
                value={answers[qIndex] || ''}
                onChange={(e) => handleSelect(qIndex, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px] resize-y bg-surface"
              ></textarea>
            </div>
          )}

          {q.type === 'image_selection' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.options.map((optUrl, optIndex) => (
                <div 
                  key={optIndex} 
                  onClick={() => handleSelect(qIndex, optIndex)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-4 transition-all ${answers[qIndex] === optIndex ? 'border-primary shadow-lg scale-[1.02]' : 'border-transparent hover:border-primary/50'}`}
                >
                  <img src={optUrl} alt={`Option ${optIndex + 1}`} className="w-full h-40 object-cover bg-surface-container" />
                </div>
              ))}
            </div>
          )}

          {q.type === 'rearrange' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-dim mb-3 italic">Use the up/down arrows to rearrange the items into the correct order.</p>
              {answers[qIndex]?.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant/50 shadow-sm transition-all hover:border-primary/30">
                  <span className="font-medium text-text-primary text-sm flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">{itemIndex + 1}</span>
                    {item}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => moveItem(qIndex, itemIndex, -1)}
                      disabled={itemIndex === 0}
                      className="p-1.5 bg-surface-container text-text-dim rounded-md hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-surface-container disabled:hover:text-text-dim transition-colors"
                      title="Move Up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button 
                      onClick={() => moveItem(qIndex, itemIndex, 1)}
                      disabled={itemIndex === answers[qIndex].length - 1}
                      className="p-1.5 bg-surface-container text-text-dim rounded-md hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-surface-container disabled:hover:text-text-dim transition-colors"
                      title="Move Down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button 
        onClick={handleSubmit} 
        className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-primary-container transition-all hover:scale-[1.02]"
      >
        Submit Assessment
      </button>
    </div>
  );
};

export default Assessment;
