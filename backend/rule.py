# ==========================================
# REGRAS DE VALIDAÇÃO - ADOTAPET
# ==========================================


# ==========================================
# VALIDAÇÃO DO NOME
# ==========================================

def nome_valido(nome):

    nomes = nome.strip().split()

    if len(nomes) < 2:
        return False

    if len(nomes[0]) < 3:
        return False

    if len(nomes[-1]) < 3:
        return False

    for nome_atual in nomes:

        if not nome_atual.isalpha():
            return False

    return True


# ==========================================
# VALIDAÇÃO DO E-MAIL
# ==========================================

def email_valido(email):

    email = email.strip()

    if email == "":
        return False

    if "@" not in email:
        return False

    parte_depois_do_arroba = email.split("@")[-1]

    if "." not in parte_depois_do_arroba:
        return False

    return True


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

def senha_valida(senha):

    if senha.strip() == "":
        return False

    return True


# ==========================================
# CONFIRMAÇÃO DA SENHA
# ==========================================

def senhas_iguais(senha, confirmar_senha):

    if senha != confirmar_senha:
        return False

    return True