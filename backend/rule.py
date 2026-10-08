# ==========================================
# REGRAS DE VALIDAÇÃO - ADOTAPET
# ==========================================


import re


# ==========================================
# VALIDAÇÃO DO NOME
# ==========================================

# Aceita letras (com acento), podendo ter hífen ou apóstrofo
# no meio. Exemplos: "Ana-Maria", "D'Ávila".
PARTE_NOME = re.compile(r"[^\W\d_]+(?:[-'][^\W\d_]+)*")


def nome_valido(nome):

    nomes = nome.strip().split()

    if len(nomes) < 2:
        return False

    if len(nomes[0]) < 3:
        return False

    if len(nomes[-1]) < 3:
        return False

    for nome_atual in nomes:

        if not PARTE_NOME.fullmatch(nome_atual):
            return False

    return True


# ==========================================
# VALIDAÇÃO DO E-MAIL
# ==========================================

def email_valido(email):

    email = email.strip()

    if email == "":
        return False

    # algo@dominio.ext (sem espaços, um único @,
    # domínio com ponto e extensão de 2+ letras)
    padrao = r"[^@\s]+@[^@\s.]+(\.[^@\s.]+)*\.[^@\s.]{2,}"

    return re.fullmatch(padrao, email) is not None


# ==========================================
# VALIDAÇÃO DO TELEFONE
# ==========================================

def telefone_valido(telefone):

    numeros = ""

    for caractere in telefone:

        if caractere.isdigit():
            numeros += caractere

    if len(numeros) != 11:
        return False

    return True


# ==========================================
# VALIDAÇÃO DA SENHA
# ==========================================

SENHA_MINIMA = 6  # o Supabase exige no mínimo 6 caracteres


def senha_valida(senha):

    if senha.strip() == "":
        return False

    if len(senha) < SENHA_MINIMA:
        return False

    return True


# ==========================================
# CONFIRMAÇÃO DA SENHA
# ==========================================

def senhas_iguais(senha, confirmar_senha):

    if senha != confirmar_senha:
        return False

    return True