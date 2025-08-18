import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen ukraine-gradient flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🇺🇦 МійЗапис</h1>
        <p className="text-2xl mb-8">Ukrainian-themed booking platform</p>
        <div className="glass-effect p-6 rounded-xl">
          <p className="text-lg">Theme working! ✨</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;