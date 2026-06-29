'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Tag, ChevronDown, X } from 'lucide-react';

interface FilterBarProps {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (diff: string) => void;
  minMatchScore: string;
  setMinMatchScore: (score: string) => void;
  goodFirstIssueOnly: boolean;
  setGoodFirstIssueOnly: (val: boolean) => void;
  selectedStars: string;
  setSelectedStars: (stars: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

const STAR_OPTIONS = [
  { label: 'All Stars', value: 'All' },
  { label: '< 100 Stars', value: '100' },
  { label: '< 1000 Stars', value: '1000' },
  { label: '< 5000 Stars', value: '5000' },
  { label: '< 10000 Stars', value: '10000' },
];

const PRESET_TAGS = [
  'hacktoberfest',
  'good-first-issue',
  'documentation',
  'bug',
  'help-wanted',
  'first-timers-only',
  'react',
  'nextjs',
  'typescript',
  'python',
  'rust',
];

export default function FilterBar({
  selectedLanguage,
  setSelectedLanguage,
  selectedDifficulty,
  setSelectedDifficulty,
  minMatchScore,
  setMinMatchScore,
  goodFirstIssueOnly,
  setGoodFirstIssueOnly,
  selectedStars,
  setSelectedStars,
  selectedTags,
  setSelectedTags,
}: FilterBarProps) {
  // Dropdown UI States
  const [langOpen, setLangOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [starsOpen, setStarsOpen] = useState(false);
  const [tagInputOpen, setTagInputOpen] = useState(false);

  // Tag Search States
  const [tagSearch, setTagSearch] = useState('');
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Close tag dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setTagInputOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active filters count
  const activeFiltersCount = [
    selectedLanguage !== 'All',
    selectedDifficulty !== 'All',
    minMatchScore !== 'All',
    goodFirstIssueOnly,
    selectedStars !== 'All',
    selectedTags.length > 0,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedLanguage('All');
    setSelectedDifficulty('All');
    setMinMatchScore('All');
    setGoodFirstIssueOnly(false);
    setSelectedStars('All');
    setSelectedTags([]);
  };

  const handleAddTag = (tag: string) => {
    const formatted = tag.trim().toLowerCase();
    if (formatted && !selectedTags.includes(formatted)) {
      setSelectedTags([...selectedTags, formatted]);
    }
    setTagSearch('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const filteredPresetTags = PRESET_TAGS.filter(
    (tag) => tag.includes(tagSearch.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="w-full space-y-4">
      {/* Filters Bar Row */}
      <div className="flex flex-wrap items-center gap-2 relative z-30">
        
        {/* Match Score Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setScoreOpen(!scoreOpen); setLangOpen(false); setDiffOpen(false); setStarsOpen(false); }}
            className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-text-secondary hover:text-brand-purple flex items-center space-x-1 cursor-pointer transition-all"
          >
            <span>Match: {minMatchScore === 'All' ? 'All' : `>${minMatchScore}%`}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          <AnimatePresence>
            {scoreOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-9 left-0 w-36 bg-dark-card border border-dark-border rounded-xl shadow-lg p-1.5 space-y-0.5"
              >
                {['All', '90', '80', '70'].map((score) => (
                  <button
                    key={score}
                    onClick={() => { setMinMatchScore(score); setScoreOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-pill text-xs font-semibold text-text-secondary hover:text-brand-purple"
                  >
                    {score === 'All' ? 'All Scores' : `>${score}% Match`}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setScoreOpen(false); setDiffOpen(false); setStarsOpen(false); }}
            className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-text-secondary hover:text-brand-purple flex items-center space-x-1 cursor-pointer transition-all"
          >
            <span>Lang: {selectedLanguage}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-9 left-0 w-36 bg-dark-card border border-dark-border rounded-xl shadow-lg p-1.5 space-y-0.5"
              >
                {['All', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setSelectedLanguage(lang); setLangOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-pill text-xs font-semibold text-text-secondary hover:text-brand-purple"
                  >
                    {lang}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Difficulty Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDiffOpen(!diffOpen); setLangOpen(false); setScoreOpen(false); setStarsOpen(false); }}
            className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-text-secondary hover:text-brand-purple flex items-center space-x-1 cursor-pointer transition-all"
          >
            <span>Diff: {selectedDifficulty}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          <AnimatePresence>
            {diffOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-9 left-0 w-36 bg-dark-card border border-dark-border rounded-xl shadow-lg p-1.5 space-y-0.5"
              >
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => { setSelectedDifficulty(diff); setDiffOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-pill text-xs font-semibold text-text-secondary hover:text-brand-purple"
                  >
                    {diff}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Star Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setStarsOpen(!starsOpen); setLangOpen(false); setDiffOpen(false); setScoreOpen(false); }}
            className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-text-secondary hover:text-brand-purple flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Star className="h-3.5 w-3.5 text-yellow-500 mr-0.5" />
            <span>Stars: {selectedStars === 'All' ? 'All' : `< ${selectedStars}`}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          <AnimatePresence>
            {starsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-9 left-0 w-36 bg-dark-card border border-dark-border rounded-xl shadow-lg p-1.5 space-y-0.5"
              >
                {STAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedStars(opt.value); setStarsOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-pill text-xs font-semibold text-text-secondary hover:text-brand-purple"
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Good First Issue Switch Toggle */}
        <button
          onClick={() => setGoodFirstIssueOnly(!goodFirstIssueOnly)}
          className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs font-bold text-text-secondary hover:text-brand-purple flex items-center space-x-2 cursor-pointer transition-all"
        >
          <span>Good First Issue</span>
          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${goodFirstIssueOnly ? 'bg-brand-purple' : 'bg-bg-pill'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${goodFirstIssueOnly ? 'translate-x-3.5' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          className={`px-3 py-1.5 rounded-xl border border-brand-red/20 text-brand-red bg-brand-red/5 hover:bg-brand-red/10 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${activeFiltersCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <span>Clear ({activeFiltersCount})</span>
        </button>
      </div>

      {/* Tag Filter Inputs & Badge Section */}
      <div className="flex flex-col space-y-2 relative" ref={tagDropdownRef}>
        <div className="flex flex-wrap items-center gap-2 bg-dark-card border border-dark-border p-2 rounded-2xl min-h-[44px]">
          <div className="flex items-center space-x-1.5 text-text-tertiary px-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Topics:</span>
          </div>

          {/* Render selected tags as badges */}
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-bg-highlight border border-brand-purple/20 text-brand-purple text-[10px] font-bold"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-brand-purple/10 rounded-full p-0.5 shrink-0 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Inline tag input */}
          <input
            type="text"
            placeholder={selectedTags.length > 0 ? "Add tag..." : "Search topics (e.g. hacktoberfest, react)..."}
            value={tagSearch}
            onChange={(e) => { setTagSearch(e.target.value); setTagInputOpen(true); }}
            onFocus={() => setTagInputOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagSearch.trim()) {
                handleAddTag(tagSearch);
              }
            }}
            className="flex-grow min-w-[120px] bg-transparent text-xs text-text-primary placeholder-text-tertiary outline-none px-1.5"
          />
        </div>

        {/* Suggestion Dropdown */}
        <AnimatePresence>
          {tagInputOpen && (tagSearch || filteredPresetTags.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 left-0 right-0 max-h-48 overflow-y-auto bg-dark-card border border-dark-border rounded-xl shadow-xl p-1.5 z-40 space-y-0.5"
            >
              {tagSearch && !selectedTags.includes(tagSearch.toLowerCase()) && (
                <button
                  onClick={() => handleAddTag(tagSearch)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-pill text-xs font-bold text-brand-purple flex items-center justify-between"
                >
                  <span>Add custom topic &quot;{tagSearch}&quot;</span>
                  <span className="text-[10px] text-text-tertiary font-normal">Press Enter</span>
                </button>
              )}
              {filteredPresetTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-pill text-xs font-semibold text-text-secondary hover:text-text-primary"
                >
                  #{tag}
                </button>
              ))}
              {tagSearch && filteredPresetTags.length === 0 && (
                <div className="p-2 text-center text-xs text-text-tertiary italic">
                  No preset tags found. Press enter to add a custom topic.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
