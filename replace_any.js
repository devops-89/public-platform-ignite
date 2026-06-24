const fs = require('fs');

const files = ['components/layouts/Gallery.tsx', 'components/layouts/EntryDetails.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('LooseObject')) {
    content = 'import { LooseObject } from "../../types";\n' + content;
  }
  content = content.replace(/<any\>/g, '<LooseObject>');
  content = content.replace(/<any\[\]\>/g, '<LooseObject[]>');
  content = content.replace(/: any\[\]/g, ': LooseObject[]');
  content = content.replace(/: any/g, ': LooseObject');
  content = content.replace(/as any/g, 'as LooseObject');
  
  content = content.replace(/catch \(error: LooseObject\)/g, 'catch (error: unknown)');
  
  fs.writeFileSync(file, content);
}
