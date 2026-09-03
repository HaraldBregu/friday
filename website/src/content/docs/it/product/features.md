---
title: "Panoramica delle funzionalità"
description: "Scopri cosa puoi fare con chat, strumenti, voce, generazione di contenuti, progetti, memoria, widget e backup cloud."
category: "Product"
locale: "it"
sourcePath: "features.md"
order: 10
---

Kucedr non si limita a rispondere: usa strumenti per aiutarti a portare a termine il lavoro. In questa pagina trovi una panoramica delle funzioni disponibili e dei loro limiti attuali.

## Chat dell'assistente

Le risposte dell'assistente appaiono nella conversazione in streaming e supportano GitHub-flavored Markdown: titoli, elenchi, tabelle, citazioni, codice in linea e blocchi di codice con evidenziazione della sintassi. I link esterni si aprono fuori dall'app.

- Le chiamate agli strumenti sono raccolte in riepiloghi espandibili che mostrano stato in esecuzione, completato o errore, input, output, durata e identificativo della chiamata.
- Immagini, video e audio generati appaiono nella chat e possono essere riprodotti senza lasciare la conversazione. Il clic destro apre un menu di sistema per aprire il file, mostrarlo nella cartella, copiarlo o salvarne una copia.
- Ogni messaggio dell'assistente offre le azioni copia, lettura ad alta voce e risposta.
- Puoi allegare più immagini e PDF alla stessa richiesta. Le etichette mostrano nome e dimensione del file e consentono di rimuoverlo prima dell'invio. Kucedr non impone un proprio limite alla dimensione degli allegati, ma restano validi i limiti del provider.
- Digitando `/` si apre un menu per `/skill`, `/goal`, `/task_list`, `/create_task` e `/delete_task`.
- `Cmd/Ctrl+/` porta il cursore nell'editor del prompt. Durante un'esecuzione, il pulsante di invio diventa un pulsante di arresto. Interrompere annulla l'esecuzione e rifiuta le autorizzazioni in sospeso.

Le sessioni vengono salvate in locale, ordinate dalla più recente e intitolate in base al primo messaggio dell'utente. Cambiare sessione ripristina la conversazione salvata. La chat carica al massimo gli ultimi cinquanta messaggi memorizzati. Nelle Impostazioni, la schermata Cronologia chat permette di eliminare le singole sessioni.

## Strumenti dell'agente

| Area | Cosa fa |
| --- | --- |
| File | Legge un intero file UTF-8, crea o sovrascrive un file di testo, sostituisce un'unica corrispondenza esatta e applica patch strutturate a più file. |
| Comandi | Esegue un comando shell con cartella di lavoro, ambiente, timeout, comportamento in background e PTY opzionale. |
| Processi | Elenca, controlla, consulta i log per pagine, scrive o incolla testo, invia tasti speciali, termina, pulisce o rimuove sessioni a lunga durata conservate. |
| Ricerca web | Interroga Brave o Tavily per ottenere da 1 a 20 risultati usando la chiave salvata nelle Impostazioni. |
| Lettura web | Recupera pagine HTTP(S) pubbliche o JSON, segue fino a tre reindirizzamenti, converte HTML in testo e tronca gli output lunghi. Blocca destinazioni private, loopback e link-local. |
| Browser | Avvia o arresta un profilo Chrome visibile e persistente; gestisce schede; naviga; acquisisce DOM, testo, schermate o PDF; legge la console; fa clic, scrive, passa il puntatore, trascina, seleziona, compila, attende o esegue codice. |
| Media | Genera un'immagine, un video, una traccia musicale o un effetto sonoro e lo salva nella libreria multimediale. |
| Memoria | Salva un'informazione persistente oppure dimentica tutte quelle che contengono una corrispondenza senza distinzione tra maiuscole e minuscole. |
| Progetti | Crea, elenca, seleziona, aggiorna, elimina o scarica un workspace con nome. |
| Skill | Carica il file `SKILL.md` di una skill abilitata e restituisce al processo il percorso della sua cartella. |
| MCP | Carica dinamicamente gli strumenti dei server abilitati come `mcp__<server>__<tool>`. |
| Pianificazioni | Crea, aggiorna, sospende, riprende, elimina, esamina, elenca o avvia i record delle pianificazioni. |
| Health | Sostituisce la checklist `HEALTH.md` o aggiorna le impostazioni degli health check. |
| Subagent | Esegue un subagent indipendente con una nuova conversazione e gli stessi strumenti, senza consentire ulteriori subagent. |

I subagent non sono interattivi: qualsiasi strumento la cui policy risulta **Chiedi** viene rifiutato, perché un subagent non può mostrarti una scheda di autorizzazione.

L'elevazione dei privilegi sull'host, l'esecuzione tramite gateway e l'esecuzione su nodi remoti non sono implementate in questo runtime.

## Voce

**Disponibile.** Con un modello speech-to-text in streaming, Kucedr acquisisce audio PCM mono e aggiunge in tempo reale gli eventi di trascrizione parziali e finali. Con un modello solo batch, registra in locale, invia l'audio quando interrompi e aggiunge la trascrizione ricevuta. La dettatura comprende verifica del permesso per il microfono, tempo trascorso, disattivazione dell'audio, conferma, annullamento e stati di errore. Le risposte dell'assistente possono essere lette ad alta voce dal provider text-to-speech configurato.

**Segnaposto.** Il controllo per la conversazione vocale che appare quando l'editor è vuoto apre soltanto un pannello animato. Non avvia un modello realtime, un ciclo dal microfono all'agente o un ciclo automatico di risposta vocale.

## Generazione di immagini, video e audio

Descrivi un'immagine, un video, una traccia musicale o un effetto sonoro e Kucedr lo crea con provider e modello configurati per quel tipo di contenuto, dallo studio dedicato nelle Impostazioni oppure tramite uno strumento dell'agente durante la conversazione.

I media creati dall'agente vengono salvati nella cartella locale `library` dell'app e mostrati nella chat. La schermata Libreria elenca immagini, video e audio dal più recente, con nome del file e data di creazione. Al momento non offre ricerca, filtri, aggiornamento o eliminazione.

Consulta [Provider](/it/docs/providers) per sapere quali integrazioni multimediali eseguono davvero le richieste.

## Progetti

I progetti sono workspace persistenti con un nome, salvati come cartelle nella directory `projects` dell'agente. Ognuno contiene un file `project.json` e un proprio `AGENTS.md`.

Quando selezioni un progetto, il suo `AGENTS.md` viene aggiunto al prompt di sistema per quel turno. La selezione **non** cambia la cartella di lavoro, la policy di esecuzione o gli strumenti disponibili.

Non esiste una schermata Progetti nelle Impostazioni. La funzione è disponibile solo tramite gli strumenti dell'agente e si usa interamente dalla conversazione. Inoltre, gli strumenti dei progetti non fanno parte del sistema centralizzato dei permessi, quindi solo `delete_project` chiede conferma.

## Memoria e personalizzazione

Kucedr conserva un workspace di file Markdown nei dati locali dell'applicazione:

| File | Scopo |
| --- | --- |
| `AGENTS.md` | Istruzioni permanenti sul comportamento e sul workspace. |
| `BOOTSTRAP.md` | Configurazione conversazionale eseguita una volta per un nuovo profilo. |
| `IDENTITY.md` | Identità e presentazione dell'assistente. |
| `SOUL.md` | Indicazioni su personalità e comportamento. |
| `USER.md` | Il tuo profilo e le tue preferenze. |
| `MEMORY.md` | Informazioni persistenti caricate in ogni conversazione. |
| `HEALTH.md` | Checklist usata dagli health check periodici. |

Salvare un'informazione aggiunge un punto elenco senza duplicare una riga identica. Dimenticarla rimuove ogni punto che contiene il testo richiesto. Il contenuto del workspace e della memoria viene inserito nuovamente nel prompt di sistema prima di ogni turno del modello.

## Widget

**Parziale.** I widget sono piccole app autonome, ognuna in una cartella con un file `manifest.json` che dichiara titolo, descrizione e punto di ingresso. Il processo principale osserva le cartelle dei widget e supporta l'aggiornamento automatico. Il menu dell'applicazione può aprire ogni widget in una finestra separata. La pagina Widget nelle Impostazioni è di sola lettura e non permette ancora di installare, rimuovere o abilitare un widget.

## Backup cloud

La pagina Archiviazione nelle Impostazioni configura uno spazio remoto compatibile con S3, includendo endpoint, regione, chiave di accesso, chiave segreta, bucket, path style, percorsi locali selezionati e intervallo di sincronizzazione. Le cartelle che scegli vengono salvate periodicamente nel bucket. Si tratta di backup delle cartelle, non di sincronizzazione tra dispositivi.

Nella navigazione delle Impostazioni compare anche Database con l'indicazione "in arrivo", ma non esistono ancora una pagina o un backend dedicati.
