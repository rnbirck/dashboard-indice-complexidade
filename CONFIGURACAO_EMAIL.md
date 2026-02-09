# 📧 Guia de Configuração do Gmail para Envio de Emails

## Passo a Passo para Criar uma Senha de App do Gmail

### Pré-requisitos
- Ter uma conta do Gmail
- Ativar a verificação em duas etapas

---

## 📋 Passo 1: Ativar a Verificação em Duas Etapas

1. Acesse sua conta Google: https://myaccount.google.com/
2. No menu lateral esquerdo, clique em **"Segurança"**
3. Role até a seção **"Como fazer login no Google"**
4. Clique em **"Verificação em duas etapas"**
5. Clique no botão **"Começar"**
6. Siga as instruções para configurar (geralmente envolvem confirmar seu número de telefone)
7. Após configurar, você verá que a verificação em duas etapas está **ATIVADA** ✅

---

## 🔑 Passo 2: Criar uma Senha de App

1. Volte para a página de **Segurança**: https://myaccount.google.com/security
2. Role novamente até **"Como fazer login no Google"**
3. Clique em **"Senhas de app"** (aparece somente se a verificação em duas etapas estiver ativa)
   
   **Nota:** Se não aparecer "Senhas de app", certifique-se que:
   - A verificação em duas etapas está ativada
   - Você não está usando uma conta do Google Workspace gerenciada pela empresa/escola

4. Na página de Senhas de app:
   - Em **"Selecionar app"**, escolha **"Outro (nome personalizado)"**
   - Digite um nome, por exemplo: **"Dashboard Complexidade"**
   - Clique em **"Gerar"**

5. O Google vai mostrar uma senha de 16 caracteres como:
   ```
   xxxx xxxx xxxx xxxx
   ```
   
6. **IMPORTANTE:** Copie essa senha imediatamente e guarde em um local seguro!
   - Você não conseguirá ver essa senha novamente
   - Use essa senha no arquivo `.env`

---

## ⚙️ Passo 3: Configurar o Arquivo `.env`

1. No seu projeto, copie o arquivo `.env.example` e renomeie para `.env`

2. Preencha as variáveis de email no arquivo `.env`:

```env
# Configuração de Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=seu.email@gmail.com
SENDER_PASSWORD=xxxx xxxx xxxx xxxx
ADMIN_EMAIL=seu.email@gmail.com
```

**Onde:**
- `SENDER_EMAIL`: Seu email do Gmail (ex: joao.silva@gmail.com)
- `SENDER_PASSWORD`: A senha de app de 16 caracteres que você copiou (pode incluir ou remover os espaços)
- `ADMIN_EMAIL`: O email onde você quer receber as notificações de download

---

## 🧪 Passo 4: Testar a Configuração

1. Reinicie o aplicativo Streamlit
2. Vá para a página de **Download**
3. Preencha o formulário e envie
4. Você deve receber:
   - Um email com os dados anexados
   - Um email de notificação sobre a solicitação

---

## ⚠️ Problemas Comuns e Soluções

### 1. "Senha de app não aparece"
**Solução:** Verifique se a verificação em duas etapas está ativada. Essa é uma exigência obrigatória.

### 2. "Erro de autenticação ao enviar email"
**Solução:** 
- Verifique se copiou a senha corretamente (todos os 16 caracteres)
- Não use sua senha normal do Gmail, use a senha de app
- Tente gerar uma nova senha de app

### 3. "Email não chega"
**Solução:**
- Verifique a caixa de spam
- Confirme que o email de destino está correto
- Verifique os logs do terminal para mensagens de erro

### 4. "Conta do Google Workspace"
Se você usa uma conta corporativa/escolar (@empresa.com gerenciada pelo Google):
- O administrador pode ter desativado senhas de app
- Entre em contato com o suporte de TI da sua organização

---

## 🔒 Segurança

**IMPORTANTE:**
- **NUNCA** compartilhe sua senha de app
- **NUNCA** commite o arquivo `.env` no Git (ele deve estar no `.gitignore`)
- Se suspeitar que a senha foi comprometida, revogue-a imediatamente e gere uma nova

### Como revogar uma senha de app:
1. Vá em https://myaccount.google.com/security
2. Clique em "Senhas de app"
3. Encontre a senha que você criou
4. Clique em **"Remover"** ao lado dela

---

## 📞 Links Úteis

- Conta Google: https://myaccount.google.com/
- Segurança: https://myaccount.google.com/security
- Senhas de App: https://myaccount.google.com/apppasswords
- Suporte Google: https://support.google.com/accounts/answer/185833

---

## ✅ Checklist Final

- [ ] Verificação em duas etapas ativada
- [ ] Senha de app gerada e copiada
- [ ] Arquivo `.env` criado e configurado
- [ ] Aplicativo reiniciado
- [ ] Teste de envio realizado com sucesso

---

**Dúvidas?** Verifique os logs do terminal quando tentar enviar um email - eles mostrarão mensagens detalhadas sobre o que pode estar errado.
