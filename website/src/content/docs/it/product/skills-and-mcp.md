---
title: "Skill e MCP"
description: "Aggiungi skill locali e collega server Model Context Protocol remoti o in esecuzione sul tuo computer."
category: "Extension"
locale: "it"
sourcePath: "skills-and-mcp.md"
order: 30
---

Puoi insegnare a Kucedr nuovi flussi di lavoro e collegare strumenti esterni senza modificare l'applicazione principale.

## Skill

Le skill sono cartelle locali nella directory `skills` dell'agente. Ognuna deve contenere un file `SKILL.md`.

La convalida richiede le proprietà frontmatter `name` e `description`. Il nome deve essere un identificativo in minuscolo, alfanumerico o con trattini, lungo da 1 a 64 caratteri. La descrizione può contenere al massimo 1.024 caratteri. Se importi una skill con un ID già presente, la cartella esistente viene sostituita.

L'area Skill nelle Impostazioni consente di:

- Elencare le skill installate con nome e descrizione e aprire la cartella principale nel file manager.
- Importare una o più cartelle di skill, mostrando il numero di elementi importati e ignorati.
- Esaminare ID, formato, versione, categoria, livello di sicurezza, visibilità, autore, strumenti richiesti e consentiti, connettori necessari, tag, visibilità per il modello, percorso della cartella, percorso del file della skill e diagnostica di convalida.
- Abilitare o disabilitare una skill, esportarne la cartella, aggiornare il catalogo ed eliminarla dopo una conferma.

Possono essere caricate solo le skill abilitate. L'interruttore di attivazione è il controllo effettivo. Livello di sicurezza e visibilità sono mostrati per consentirti di valutarli, ma non vengono applicati come policy bloccante.

Il menu slash cerca tra le skill installate e l'agente carica il file `SKILL.md` della skill scelta durante l'esecuzione. Il caricatore restituisce il percorso della cartella. Script, riferimenti e risorse inclusi devono essere letti separatamente quando servono.

## Server MCP

Kucedr supporta Model Context Protocol, uno standard aperto per collegare strumenti e dati esterni agli assistenti AI, tramite due tipi di trasporto.

| Trasporto | Configurazione |
| --- | --- |
| HTTP remoto | ID e nome del server, URL, bearer token facoltativo, ID client OAuth e client secret facoltativi. |
| stdio locale | ID e nome del server, comando, argomenti separati da spazi, variabili d'ambiente `KEY=value` facoltative e cartella di lavoro facoltativa. |

Le Impostazioni MCP offrono elenchi separati per server remoti e locali; stati configurato, disabilitato ed errore con un interruttore sia nell'elenco sia nei dettagli; finestre per aggiungere e modificare un server, con ID e tipo di trasporto non modificabili dopo la creazione; una pagina di dettaglio con ID, stato, URL o comando, tipo di autenticazione, date e ultimo errore; autorizzazione o nuova autorizzazione OAuth per i server HTTP senza bearer token.

All'inizio di ogni normale esecuzione dell'agente, i server abilitati si collegano in parallelo, espongono i propri strumenti al modello come `mcp__<server>__<tool>` e si chiudono al termine. Un server irraggiungibile o non autenticato viene ignorato per quella esecuzione, senza interromperla.

### Limiti attuali

- L'interfaccia non offre un controllo per eliminare un server configurato.
- Il campo salvato `require_approval` viene applicato. Imposta il permesso predefinito dello strumento MCP caricato su Consenti o Chiedi.
- Il campo salvato `defer_loading` non viene ancora applicato dal caricatore degli strumenti.
- Gli strumenti MCP non fanno parte dell'elenco centralizzato degli strumenti protetti, quindi vale soltanto la loro impostazione `require_approval`. Esamina un server prima di abilitarlo.
