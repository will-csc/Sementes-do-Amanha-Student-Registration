# app/services/turma.py
from datetime import date

def calcular_turma(data_nascimento):
    idade = (date.today() - data_nascimento).days // 365
    if 5 <= idade <= 9:  return "Turma 05–09"
    if 10 <= idade <= 12: return "Turma 10–12"
    if 13 <= idade <= 16: return "Turma 13–16"
    return "Fora da faixa"