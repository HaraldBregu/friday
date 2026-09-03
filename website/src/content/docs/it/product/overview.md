---
title: "Cos'è Kucedr"
description: "Scopri cos'è Kucedr, a chi serve e come trasforma una richiesta in azioni controllabili sul tuo computer."
category: "Product"
locale: "it"
sourcePath: "overview.md"
order: 0
---

Kucedr è un assistente AI personale che lavora direttamente dal desktop. Puoi chiedergli ciò che ti serve con parole tue e ottenere un risultato concreto: una risposta con fonti, un file aggiornato, un'immagine, una trascrizione o un'attività completata su una pagina web. È disponibile come app Electron per Windows, macOS e Linux.

A differenza di un chatbot sul web, Kucedr funziona come applicazione sul tuo computer. Usi le chiavi dei tuoi provider AI, impostazioni e credenziali restano nei dati locali dell'applicazione e le azioni sensibili richiedono un'autorizzazione esplicita.

## A chi è rivolto Kucedr

- A chi desidera un assistente AI personale sul desktop, non in una scheda del browser.
- A professionisti e power user che vogliono gestire file, preparare documenti, eseguire comandi e usare strumenti collegati.
- A chi presta attenzione alla privacy e preferisce i propri account dei provider AI e dati locali.
- A persone curiose e team che vogliono skill personalizzate, server MCP e integrazioni con app di messaggistica.

## Concetti principali

- **Una chat che agisce.** Kucedr esegue un ciclo di strumenti per portare a termine il lavoro, non si limita a descriverlo.
- **Scegli tu l'AI.** Puoi configurare provider e modello separatamente per chat, trascrizione, voce, immagini, video, audio, attività pianificate e health check.
- **Local first.** Impostazioni, credenziali, cronologia, memoria, progetti e media generati risiedono nella cartella dei dati dell'applicazione.
- **Azioni autorizzate.** Ogni strumento ha una policy dedicata. Modifiche ai file, comandi shell e patch chiedono il permesso prima dell'esecuzione.
- **Estendibile.** Puoi aggiungere skill locali e collegare server MCP HTTP remoti o stdio locali.
- **Attività in background.** Una checklist `HEALTH.md` viene eseguita a intervalli e segnala solo ciò che richiede attenzione.

## Come viene gestita una richiesta

1. Invia una richiesta in chat, scrivendola, dettandola o allegando immagini e PDF.
2. Kucedr costruisce il prompt di sistema del turno usando il contratto base dell'assistente, le descrizioni degli strumenti, i file del profilo del workspace, la memoria salvata, le istruzioni del progetto attivo e le eventuali skill caricate durante l'esecuzione.
3. Il turno del modello viene mostrato in streaming e raccoglie testo, continuità del ragionamento quando supportata dal provider e chiamate agli strumenti.
4. Le chiamate protette si fermano su una scheda di autorizzazione. Dopo l'approvazione, vengono eseguite e la loro attività appare nella conversazione.
5. Il ciclo continua finché il modello non richiede più strumenti, annulli l'esecuzione, si verifica un errore o viene raggiunto il limite di venti turni.
6. I dati utili nel tempo possono essere salvati in memoria per le conversazioni successive.

Ogni turno del modello consente attualmente fino a 8.192 token in uscita e viene riprovato una volta dopo un errore del provider.

## Stati delle funzionalità

La documentazione usa gli stessi stati del riferimento interno alle funzionalità di Kucedr, così un'impostazione visibile non viene scambiata per una funzione già completa.

| Stato | Significato |
| --- | --- |
| Disponibile | Interfaccia e processo principale sono collegati a un'implementazione funzionante. Potrebbero comunque servire credenziali del provider o permessi del sistema operativo. |
| Parziale | Una parte utile funziona, ma manca un controllo importante o un percorso di esecuzione. |
| Segnaposto | Il controllo o la schermata esiste, ma il flusso previsto non è collegato. |
| Solo catalogo | Il provider o modello è selezionabile, ma non esiste ancora un'integrazione in grado di eseguire la richiesta. |
