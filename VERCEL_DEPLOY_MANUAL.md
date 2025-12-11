# 🚀 Como Fazer Deploy Manual na Vercel

Seu código está pronto no GitHub, mas o deploy automático não foi acionado. Aqui estão **3 maneiras** de fazer o deploy:

---

## ✅ Opção 1: Deploy via Vercel Web (Recomendado - Mais Fácil)

### Passo a Passo:

1. **Acesse Vercel**
   - Vá em https://vercel.com
   - Faça login com sua conta (Google, GitHub, etc)

2. **Criar Novo Projeto**
   - Clique em "Add New" → "Project"
   - Selecione "Continue with GitHub"

3. **Autorizar GitHub**
   - Clique "Install Vercel"
   - Autorize o acesso ao seu repositório
   - Procure por `giropro-motoristas-v2`

4. **Selecionar Repositório**
   - Clique em `vinih2/giropro-motoristas-v2`
   - Clique "Import"

5. **Configurar Variáveis de Ambiente**
   - Na seção "Environment Variables"
   - Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

6. **Deploy**
   - Clique "Deploy"
   - Aguarde 2-3 minutos
   - Seu app estará em: `https://giropro-motoristas.vercel.app`

---

## ✅ Opção 2: Deploy via GitHub Actions (Automático no Futuro)

Se quer que cada push faça deploy automaticamente:

### Passo 1: Crie o arquivo `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Passo 2: Adicione Secret no GitHub
1. Vá em: https://github.com/vinih2/giropro-motoristas-v2/settings/secrets/actions
2. Clique "New repository secret"
3. Nome: `VERCEL_TOKEN`
4. Valor: Seu token Vercel (veja abaixo como gerar)

### Passo 3: Gerar Token Vercel
1. Acesse: https://vercel.com/account/tokens
2. Clique "Create"
3. Copie o token
4. Cole no GitHub secret

---

## ✅ Opção 3: Deploy via Vercel CLI (Linha de Comando)

Se preferir do terminal:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login (interativo)
vercel login

# 3. Deploy em produção
vercel deploy --prod

# 4. Seu app estará em:
# https://giropro-motoristas.vercel.app
```

---

## 🔍 Após o Deploy

### Verificações Importantes:
- [ ] App carrega em https://giropro-motoristas.vercel.app
- [ ] Login com Google funciona
- [ ] Dashboard carrega dados
- [ ] Dark mode funciona
- [ ] Mobile view está responsivo
- [ ] Calculadora funciona

### Se Tiver Erro:
1. Verifique as variáveis de ambiente no painel Vercel
2. Verifique os logs: Deployments → Clique no deploy → View Build Logs
3. Procure por mensagens de erro

### Se Tudo OK:
🎉 **Seu app está LIVE!**

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique as variáveis de ambiente
2. Verifique os logs de build na Vercel
3. Verifique se o código está no GitHub (pushado)
4. Tente fazer deploy novamente

---

**Recomendação:** Use a **Opção 1** (Web) - é a mais fácil e rápida! 🚀
