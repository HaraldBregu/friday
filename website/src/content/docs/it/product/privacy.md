---
title: "Privacy e sicurezza"
description: "Scopri quali dati restano sul computer, quando vengono inviati a servizi esterni e come funzionano permessi e credenziali."
category: "Privacy"
locale: "it"
sourcePath: "privacy.md"
order: 60
---

Kucedr ti permette di scegliere quali dati e strumenti usare. Qui trovi una spiegazione chiara di cosa resta sul computer, cosa può essere inviato a servizi esterni e quali limiti devi conoscere.

## Dati locali per impostazione predefinita

Kucedr salva configurazione e dati di lavoro nella cartella dei dati dell'applicazione di Electron.

| Area | Dati salvati |
| --- | --- |
| App | Impostazioni per icona nella barra di sistema, mantenimento del computer attivo, lingua e tema. |
| Provider | Nome del provider, chiave API e URL di base. |
| Agente | Modello attivo, policy, definizioni MCP e stato OAuth, skill, progetti, pianificazioni, impostazioni degli health check, file Markdown del workspace, sessioni e libreria multimediale. |
| Canali | Token dei bot, policy per i mittenti e modello usato per le risposte. |
| Servizi | Scelte indipendenti per testo, trascrizione, voce, immagini, video e audio. |
| Media | File video e audio generati separatamente. |
| Browser | Profilo persistente del browser usato dall'agente. |
| Archiviazione | Credenziali dello spazio remoto compatibile con S3 e configurazione della sincronizzazione. |
| Diagnostica | Log locali a rotazione e crash dump. La configurazione attuale non carica i crash dump su servizi esterni. |

## Quando i dati lasciano il computer

Prompt, allegati, input degli strumenti e contenuti generati possono essere inviati ai provider dei modelli, ai server MCP, ai siti web, alle destinazioni aperte nel browser, a Telegram, a Discord o allo spazio cloud configurato. Questo avviene solo quando è necessario per l'operazione richiesta e i dati non vengono inviati altrove.

## Usa le tue chiavi

Utilizzi i tuoi account dei provider. Kucedr non inserisce un altro fornitore tra te e i servizi che scegli.

## Come vengono salvate le credenziali

Dopo il salvataggio, i segreti vengono nascosti nell'interfaccia. Tuttavia, le chiavi dei provider, i token dei bot e i segreti MCP risiedono in normali file locali `electron-store`, non in un archivio cifrato per le credenziali. **Chiunque abbia accesso alla cartella dei dati dell'applicazione potrebbe leggerli.** Considera sensibile quella cartella e affidati alla cifratura del disco e alla separazione degli account offerte dal sistema operativo.

## Permessi espliciti

Ogni strumento ha un oggetto policy con i campi `default`, `allow`, `ask` e `deny`.

- `read`, `write` e `process` usano **Consenti** come impostazione predefinita. `edit`, `exec` e `apply_patch` usano **Chiedi**. Gli altri strumenti integrati usano Consenti.
- La scheda di autorizzazione offre **Nega**, **Consenti una volta** e **Consenti sempre**.
- La scelta Consenti sempre salva la cartella contenente il file per `read`, la destinazione esatta per gli altri strumenti relativi a file e patch e il comando non elaborato per `exec`.
- Una mappa `dir` di primo livello autorizza in anticipo elenchi di strumenti per una cartella. `recoursive: true` include anche le sottocartelle.
- Puoi ripristinare la policy predefinita in qualsiasi momento.

Le regole vengono risolte in tre livelli: la policy di sistema integrata per le risorse gestite dall'agente, le autorizzazioni preventive per le cartelle e infine le regole e il valore predefinito del singolo strumento. Vince il percorso corrispondente più specifico. A parità di specificità, l'ordine è Nega, Chiedi, Consenti. Una regola per uno strumento non modifica la decisione relativa a un altro.

## Limiti da conoscere

- La policy di `exec` esamina la stringa del comando. È una protezione, non una sandbox del sistema operativo, e non può dimostrare quali percorsi verranno realmente modificati.
- La policy delle cartelle valuta `exec` rispetto alla sua cartella di lavoro, ma un comando può comunque raggiungere percorsi esterni.
- I percorsi relativi della policy, per esempio `Desktop`, vengono risolti a partire dalla cartella Home.
- Gli strumenti dei progetti vengono eseguiti fuori dal sistema centralizzato delle policy. Solo `delete_project` chiede conferma.
- Gli strumenti MCP sono protetti soltanto dalla propria impostazione `require_approval`, quindi esamina un server prima di abilitarlo.

## Struttura dell'app protetta

Le finestre dell'interfaccia usano la sandbox di Electron, isolamento del contesto, integrazione Node disabilitata, sicurezza web e blocco dei contenuti non sicuri. In produzione, la navigazione è limitata ai contenuti locali `file://`. Le funzioni dell'interfaccia vengono esposte tramite API preload tipizzate invece di un accesso diretto a Node. Le richieste di permessi multimediali sono limitate alle finestre e origini attendibili dell'app. I menu contestuali di sistema per i media verificano che i file si trovino nelle cartelle dati dell'agente o dei media.

Il codice attendibile dell'interfaccia può comunque leggere i segreti dei provider tramite l'API preload dedicata.

## Certificazioni

Kucedr non dichiara certificazioni formali per il trattamento di dati regolamentati. Consulta i termini dei tuoi provider AI e dei servizi collegati per sapere come gestiscono i dati inviati.
