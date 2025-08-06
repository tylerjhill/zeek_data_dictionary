import React from 'react';
import { motion } from 'framer-motion';
import { categories } from '../data/zeekLogs';
import { Network, Shield, Database, FileText } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: Set<string>;
  onCategoryToggle: (categoryId: string) => void;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'Network': return Network;
    case 'Security': return Shield;
    case 'Content': return Database;
    default: return FileText;
  }
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryToggle
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Categories</h3>
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category.id);
        const isSelected = selectedCategories.has(category.id);
        
        return (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryToggle(category.id)}
            className={`
              w-full flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200
              ${isSelected
                ? 'bg-slate-700/50 border-slate-600 shadow-lg'
                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'
              }
            `}
          >
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent 
                className="w-4 h-4" 
                style={{ color: category.color }} 
              />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-slate-100">
                {category.name}
              </div>
              <div className="text-xs text-slate-400">
                {category.description}
              </div>
            </div>
            <div className={`
              w-4 h-4 rounded-full border-2 transition-colors
              ${isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-slate-500'
              }
            `}>
              {isSelected && (
                <div className="w-full h-full rounded-full bg-white scale-50" />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};