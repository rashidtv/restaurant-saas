const fs = require('fs');
const path = require('path');

function generateTree(dir, prefix = '') {
  const files = fs.readdirSync(dir).filter(item => 
    !['node_modules', '.git', 'build', 'dist'].includes(item)
  );
  
  files.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    console.log(prefix + connector + file);
    
    if (fs.statSync(filePath).isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      generateTree(filePath, newPrefix);
    }
  });
}

generateTree('.');