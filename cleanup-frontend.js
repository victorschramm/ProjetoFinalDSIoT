const fs = require('fs');
const path = require('path');

const publicPath = path.join(__dirname, 'backend', 'public');
const appFilePath = path.join(__dirname, 'backend', 'src', 'app.js');

console.log('🔍 Verificando pasta public...');

if (fs.existsSync(publicPath)) {
  console.log('📁 Pasta encontrada:', publicPath);

  // Remove a pasta public com segurança
  fs.rmSync(publicPath, { recursive: true, force: true });
  console.log('🗑️ Pasta public removida com sucesso');
} else {
  console.log('⚠️ Pasta public não encontrada, pulando...');
}

console.log('🔍 Ajustando app.js...');

if (fs.existsSync(appFilePath)) {
  let content = fs.readFileSync(appFilePath, 'utf-8');

  // Remove linha de static (sem quebrar o resto)
  const updatedContent = content.replace(
    /app\.use\(express\.static\(.*?\)\);/g,
    '// static removido (frontend separado no Vercel)'
  );

  fs.writeFileSync(appFilePath, updatedContent);
  console.log('✅ Linha de static removida do app.js');
} else {
  console.log('❌ app.js não encontrado');
}

console.log('🚀 Limpeza concluída com segurança!');