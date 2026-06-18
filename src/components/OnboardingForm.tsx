'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Code2, Rocket, Heart, ChevronRight, Loader2 } from 'lucide-react';

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('Intermediate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const languagesList = [
    'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Other'
  ];

  const experienceLevels = [
    { value: 'Beginner', label: 'Beginner', desc: 'Looking for good first issues and simple docs updates.' },
    { value: 'Intermediate', label: 'Intermediate', desc: 'Comfortable with standard debugging and adding small features.' },
    { value: 'Advanced', label: 'Advanced', desc: 'Ready for complex architectural tasks, optimizations, and deep debugging.' },
  ];

  const interestsList = [
    'Backend', 'Frontend', 'DevOps', 'AI', 'Security', 'Mobile'
  ];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNextStep = () => {
    if (step === 1 && selectedLanguages.length === 0) {
      alert('Please select at least one programming language.');
      return;
    }
    if (step === 2 && !experienceLevel) {
      alert('Please select an experience level.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest area.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languages: selectedLanguages,
          experienceLevel,
          interests: selectedInterests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding profile');
      }

      router.push('/swipe');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full relative">
      {/* Onboarding Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">Let's build your feed</h2>
        <p className="text-sm text-gray-400 mt-2">Step {step} of 3</p>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-dark-border rounded-full mt-4 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-brand-green"
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card container */}
      <div className="glass-premium rounded-3xl p-8 border border-white/5 glow-purple">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 text-brand-green">
              <Code2 className="h-6 w-6" />
              <h3 className="text-xl font-bold text-white">What languages do you code in?</h3>
            </div>
            <p className="text-sm text-gray-400">Select all that apply. We'll use these to filter repos.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-green/10 border-brand-green text-brand-green'
                        : 'bg-dark-bg border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 text-brand-blue">
              <Rocket className="h-6 w-6" />
              <h3 className="text-xl font-bold text-white">What is your experience level?</h3>
            </div>
            <p className="text-sm text-gray-400">Be honest! This helps us customize matching difficulty score weights.</p>
            
            <div className="space-y-3">
              {experienceLevels.map((lvl) => {
                const isSelected = experienceLevel === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    onClick={() => setExperienceLevel(lvl.value)}
                    className={`w-full text-left px-5 py-4 rounded-xl border flex flex-col transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
                        : 'bg-dark-bg border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">{lvl.label}</span>
                    <span className="text-xs text-gray-400 mt-1">{lvl.desc}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 text-brand-red">
              <Heart className="h-6 w-6" />
              <h3 className="text-xl font-bold text-white">Select your interests</h3>
            </div>
            <p className="text-sm text-gray-400">What fields are you looking to contribute to?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {interestsList.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-red/10 border-brand-red text-brand-red'
                        : 'bg-dark-bg border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Buttons footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-border">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-all cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white text-sm font-bold transition-all disabled:opacity-55 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Build Swipe Feed</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
