import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { loginSchema, registerSchema } from "@shared/schema";
import type { Express, Request, Response } from "express";

// Middleware para verificar autenticação local
export const isLocalAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Não autorizado" });
};

export function setupLocalAuth(app: Express) {
  // Rota de registro
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Verificar se o email já existe
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Criptografar a senha
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Criar o usuário
      const newUser = await storage.createLocalUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        authType: "local",
        emailVerified: false,
      });

      // Salvar na sessão
      (req.session as any).userId = newUser.id;
      (req.session as any).authType = "local";

      res.status(201).json({ 
        message: "Conta criada com sucesso",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        }
      });
    } catch (error: any) {
      console.error("Erro no registro:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Buscar usuário por email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verificar se é usuário local
      if (user.authType !== "local" || !user.password) {
        return res.status(401).json({ 
          message: "Este email está associado a uma conta do Replit. Use o login do Replit." 
        });
      }

      // Verificar se está banido
      if (user.banned) {
        return res.status(403).json({ message: "Sua conta foi suspensa" });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Salvar na sessão
      (req.session as any).userId = user.id;
      (req.session as any).authType = "local";

      res.json({ 
        message: "Login realizado com sucesso",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
        }
      });
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Rota para obter dados do usuário atual (apenas autenticação local)
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const session = req.session as any;

      // Verificar apenas autenticação local
      if (!session || !session.userId || session.authType !== "local") {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        authType: user.authType,
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

// Middleware de autenticação apenas local
export const isAuthenticated = async (req: Request, res: Response, next: any) => {
  try {
    const session = req.session as any;
    
    // Verificar apenas autenticação local
    if (!session || !session.userId || session.authType !== "local") {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    const user = await storage.getUser(session.userId);
    if (!user || user.banned) {
      return res.status(401).json({ message: "Usuário não encontrado ou banido" });
    }
    
    (req as any).currentUser = user;
    (req as any).user = { claims: { sub: user.id } }; // Compatibilidade com código existente
    return next();
  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};