# Adota Pet

Site de um abrigo de animais, onde você poderá adotar animais.

## Colaboradores

- Orientador: Mário Melo
- Sávio Gabriel
- William Souza
- Gabriela Félix
- Matheus Felipe de Souza

## Como rodar

```bash
python -m venv venv
venv\Scripts\activate          # Windows  (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # Linux/Mac: cp .env.example .env  -> preencha o .env
python backend/run.py
```

Acesse http://127.0.0.1:5000

## Configuração obrigatória no Supabase

Em **Authentication → URL Configuration**, adicione em *Redirect URLs*:

- `http://127.0.0.1:5000/auth/confirm`
- `http://127.0.0.1:5000/redefinir-senha`

Sem isso, os links de confirmação de e-mail e de redefinição de senha
não levam para o site. Ao publicar o projeto, adicione também as URLs
do domínio final (e ajuste `BASE_URL` no `.env`).

## Banco de dados

Tabela `usuarios`: `id` (int4, PK), `nome`, `email` (único), `telefone`,
`data_cadastro`, `auth_id` (uuid, único, FK para `auth.users.id`).
