---
title: "Automazione"
description: "Configura controlli periodici e pianificazioni cron. Scopri cosa funziona già e quali parti sono ancora in sviluppo."
category: "Automation"
locale: "it"
sourcePath: "automation.md"
order: 50
---

Kucedr può controllare periodicamente una checklist definita da te e conservare pianificazioni cron. Gli health check sono già disponibili; l'esecuzione automatica dei prompt pianificati è ancora in sviluppo.

## Health check

**Disponibile.** `HEALTH.md` definisce una checklist che Kucedr esegue in background.

- Intervalli disponibili: Disattivato, 1 minuto, 30 minuti o 1 ora.
- Le esecuzioni vengono saltate quando l'agente principale o quello dedicato agli health check è occupato.
- Puoi impostare fasce orarie giornaliere oppure date iniziali e finali incluse.
- Le esecuzioni possono usare una sessione `health` isolata per non mescolarsi alla conversazione principale.
- Le checklist vuote o composte solo da titoli vengono ignorate.
- Una risposta esattamente uguale a `HEALTH_OK` indica che tutto è in ordine. Qualsiasi altra risposta viene registrata come elemento che richiede attenzione.

La schermata Health legge, modifica e salva checklist e configurazione. Lo strumento dell'agente può inoltre aggiornare contesto leggero, sessione isolata, opzione per saltare l'esecuzione quando il sistema è occupato, orari di attività e inclusione del ragionamento.

**Parziale.** Il runtime applica attualmente intervallo, verifica dello stato occupato, orari e date di attività e comportamento della sessione isolata. I campi salvati relativi a destinazione, policy diretta, contesto leggero, inclusione del ragionamento, provider e modello non vengono ancora letti dall'esecutore. Gli health check usano il normale modello attivo dell'agente, indipendentemente da ciò che mostra la schermata Health.

## Pianificazione delle attività

**Parziale.** Kucedr conserva record cron con:

- Un nome e una descrizione facoltativa.
- Un'espressione cron.
- Stato abilitato o in pausa.
- Un'azione di debug o un prompt per l'agente.
- Data di creazione e di aggiornamento.
- Una scelta di provider e modello riservata alle attività pianificate.

Le operazioni per creare, aggiornare, sospendere, riprendere, eliminare, ottenere, elencare e avviare subito funzionano tutte sui record. All'avvio, la riconciliazione ricarica e ripianifica quanto è stato salvato.

**Cosa non funziona ancora:** il callback cron registra le azioni di debug e crea i metadati dell'attivazione, ma il ramo dedicato alle azioni dell'agente non esegue nulla. I prompt pianificati e **Esegui ora** non avviano una richiesta dell'agente. Considera lo scheduler un archivio persistente delle pianificazioni, non un sistema di esecuzione autonoma.

Le pianificazioni si creano e si gestiscono dalla conversazione e tramite i comandi slash `/task_list`, `/create_task` e `/delete_task`, non con moduli nelle Impostazioni. La schermata Attività seleziona provider e modello dedicati ed elenca nome, prompt, espressione cron e stato di ogni pianificazione.
