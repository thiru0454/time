import React from "react";

const Footer = () => (
  <footer className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 shadow-inner mt-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-2">Getting Started</h3>
          <ol className="list-decimal list-inside text-zinc-700 dark:text-zinc-300 space-y-1 text-sm">
            <li>Select your department</li>
            <li>Choose the academic year</li>
            <li>Pick the section</li>
            <li>Proceed to timetable management</li>
          </ol>
        </div>
        <div className="flex flex-col md:items-end gap-2">
          <span className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} TimeTableGen. All rights reserved.</span>
          <div className="flex gap-4 text-sm">
            <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer; 