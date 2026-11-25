# Auditorias (F3 roteiro · F5 final)

## F3 — Auditoria do roteiro (antes do ElevenLabs)
Rode `scripts/preparar_narracao.py <slug> --so-metricas` e preencha a seção "Auditoria" do `02-roteiro.md`.

### 1. Três ganchos
Escreva 3 variações (ver tipos em `engenharia-de-roteiro.md` §4), pontue cada uma (0–5) em: identificação,
especificidade do desastre, clareza em 1 audição, visualidade nos 3 primeiros segundos. Escolha e **justifique**.

### 2. Checklist de fidelidade (cada item: ✔ / ✘ + correção)
- [ ] 1ª frase começa com "Se você" e cabe em ≤ 9 s
- [ ] Desastre concreto e visual no gancho
- [ ] 6–13 ciclos; cada "Mas" nasce da solução anterior ou do crescimento
- [ ] Todo termo vem depois da função, em frase isolada de 3–5 palavras
- [ ] ≥ 1 "É por isso que" com fato observável
- [ ] 2–4 números verificados e traduzidos em imagem
- [ ] 1–3 toques de humor, nenhum no gancho
- [ ] Acabamento em lista + "Agora é só…" + "Parabéns! Você construiu…" literal
- [ ] CTA binário de 1 palavra
- [ ] Nenhuma frase das referências copiada

### 3. Métricas (alvo)
palavras 470–560 · média 10–14 palavras/frase · nenhuma frase > 22 palavras (ou justificar) · 0 tags `[XXX]` ·
duração estimada 140–165 s.

### 4. Qualidade
- Primeiros segundos: a imagem do gancho é clara sem som? E sem imagem?
- Clareza: alguém leigo entende cada ciclo ouvindo uma vez?
- Progressão: a ameaça cresce? Há re-gancho visual a cada 2–3 ciclos?
- Enrolação: alguma frase não adiciona nem ação, nem função, nem nome, nem problema? → cortar.
- Naturalidade falada: frases trava-língua, sequências de "que", siglas.
- Desfecho: fecha o desejo do gancho?
- **Precisão técnica**: tabela "Verificação técnica" preenchida; dúvidas sinalizadas ao usuário.

Não encurte cortando informação importante; corte redundância.
Ao final: `scripts/estado.py <slug> roteiro_auditado true`.

## F5 — Auditoria final (ENTREGA 6)
Notas 0–5 com evidência:
1. **Fidelidade ao formato** — checklist F3 + regras visuais (`engenharia-visual.md`).
2. **Qualidade narrativa** — cadeia, recompensas, fecho.
3. **Coerência audiovisual** — toda cena corresponde a um trecho do áudio; imagem literal no verbo.
4. **Ritmo** — mudança visual a cada 2–3 s; nenhum trecho > 4 s sem evento visual (exceto CTA).
5. **Clareza** — legendas legíveis, etiquetas não cobrem a ação, área segura respeitada.
6. **Potencial de retenção (hipótese)** — liste possíveis pontos de queda e o que os compensa.
7. **Execução** — stills conferidos, áudio −14 LUFS, voz 12–15 dB acima do fundo, sem artefatos.
Corrija o que reprovar antes de entregar.
