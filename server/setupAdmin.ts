import bcrypt from 'bcryptjs';
import { storage } from './storage.js';

export async function createAdminUser() {
  try {
    // Verificar se já existe um admin
    const existingAdmin = await storage.getUserByEmail('admin@blackbyte.com');
    if (existingAdmin) {
      console.log('👤 Usuário admin já existe');
      return existingAdmin;
    }

    // Criar usuário admin padrão
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await storage.createLocalUser({
      id: 'admin_blackbyte_2024',
      email: 'admin@blackbyte.com',
      firstName: 'Admin',
      lastName: 'BlackByte',
      password: hashedPassword,
      authType: 'local',
      role: 'admin',
      emailVerified: true,
    });

    console.log('🎉 Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@blackbyte.com');
    console.log('🔑 Senha: admin123');
    console.log('👑 Role: admin');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  }
}