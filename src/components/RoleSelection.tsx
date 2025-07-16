import React from 'react';
import { motion } from 'framer-motion';

const roles = [
  { key: 'student', label: 'Student' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'admin', label: 'Admin' },
];

export type UserRole = 'student' | 'faculty' | 'admin';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white/90 p-10 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-md border border-blue-100"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-center text-blue-700 tracking-tight drop-shadow-sm">
          Select Your Role
        </h2>
        <div className="flex flex-col gap-6">
          {roles.map(role => (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 24px rgba(59,130,246,0.15)' }}
              whileTap={{ scale: 0.97 }}
              key={role.key}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold shadow-md hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
              onClick={() => onSelect(role.key as UserRole)}
            >
              {role.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSelection; 