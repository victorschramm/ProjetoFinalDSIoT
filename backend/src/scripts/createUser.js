const sequelize = require('../config/database');
const Usuario = require('../models/Usuario');
const NivelAcesso = require('../models/NivelAcesso');

async function createTestUser() {
  try {
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');

    // Sincronizar modelos
    await sequelize.sync();
    console.log('✅ Banco sincronizado');

    // Criar nível de acesso admin se não existir
    let nivelAdmin = await NivelAcesso.findOne({ where: { nome: 'Administrador' } });
    if (!nivelAdmin) {
      nivelAdmin = await NivelAcesso.create({
        nome: 'Administrador',
        descricao: 'Acesso total ao sistema',
        nivel: 1
      });
      console.log('✅ Nível de acesso "Administrador" criado');
    }

    // Verificar se usuário admin já existe
    const existingUser = await Usuario.findOne({ where: { email: 'admin@admin.com' } });
    
    if (existingUser) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('\n📧 Email: admin@admin.com');
      console.log('🔑 Senha: admin123');
    } else {
      // Criar usuário admin
      const user = await Usuario.create({
        name: 'Administrador',
        email: 'admin@admin.com',
        password: 'admin123',
        tipo_usuario: 'admin',
        id_nivel_acesso: nivelAdmin.id
      });

      console.log('✅ Usuário admin criado com sucesso!');
      console.log('\n========================================');
      console.log('🔐 CREDENCIAIS DE ACESSO:');
      console.log('========================================');
      console.log('📧 Email: admin@admin.com');
      console.log('🔑 Senha: admin123');
      console.log('========================================\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createTestUser();
