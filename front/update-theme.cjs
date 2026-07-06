const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Global palette replacements
      content = content.replace(/amber-500/g, 'indigo-600');
      content = content.replace(/amber-600/g, 'indigo-700');
      content = content.replace(/amber-700/g, 'indigo-800');
      content = content.replace(/amber-50/g, 'indigo-50');
      content = content.replace(/amber-100/g, 'indigo-100');
      content = content.replace(/amber-400/g, 'indigo-400');
      
      content = content.replace(/emerald-/g, 'green-');
      content = content.replace(/gray-/g, 'slate-');
      
      // Override primary buttons/headers that used blue to indigo
      content = content.replace(/bg-\[\#3B71CA\]/g, 'bg-indigo-600');
      content = content.replace(/blue-600/g, 'indigo-600');
      content = content.replace(/blue-500/g, 'indigo-600');
      content = content.replace(/blue-50\/50/g, 'indigo-50/50');
      content = content.replace(/blue-50/g, 'indigo-50');
      content = content.replace(/blue-100/g, 'indigo-100');
      content = content.replace(/blue-700/g, 'indigo-700');

      // Update rounded frame
      content = content.replace(/sm:rounded-\[2\.5rem\]/g, 'sm:rounded-[3rem]');
      // Update phone frame border
      content = content.replace(/sm:border-\[8px\] sm:border-slate-900/g, 'sm:border-[6px] sm:border-slate-800 shadow-2xl');

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('./src');
