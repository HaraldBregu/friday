---
title: "Come iniziare"
description: "Configura Kucedr, collega il primo provider AI, scegli i modelli e inizia a usare l'assistente sul tuo computer."
category: "Product"
locale: "it"
sourcePath: "getting-started.md"
order: 70
---

## Primo avvio

Al primo avvio, Kucedr ti guida in tre passaggi:

1. **Benvenuto** presenta Kucedr come agente personale per attività quotidiane, programmazione e lavoro in background.
2. **Provider** richiede almeno una chiave API. Ogni scheda collega alla pagina del provider dove ottenere o configurare la chiave e permette di connettere, modificare, annullare e salvare.
3. **Modelli** consente di scegliere i modelli per Assistente, Voce, Trascrizione, Immagini, Video e Audio. Per completare la configurazione è obbligatoria solo la scelta dell'Assistente.

Dopo aver salvato provider e modello dell'Assistente, agli avvii successivi Kucedr salta la configurazione e apre direttamente la chat. Puoi modificare tutte queste scelte in seguito nelle Impostazioni. Provider e modello per attività pianificate e health check si configurano separatamente nelle rispettive pagine.

## Dopo la configurazione

1. Inizia a chattare e approva le richieste di autorizzazione per le azioni che coinvolgono file, comandi o servizi esterni.
2. Allega immagini o PDF, oppure detta il messaggio invece di scriverlo.
3. Se ti servono, configura speech-to-text, text-to-speech e la generazione di immagini, video e audio.
4. Estendi Kucedr importando skill, aggiungendo server MCP o collegando un bot Telegram o Discord.

## Orientarsi nell'app

Le Impostazioni raggruppano le pagine in **Generali** (Applicazione, Sistema, Provider), **Principali** (Assistente, Skill, MCP, Libreria, Attività, con Health all'interno di Assistente), **Servizi modello** (Trascrizione, Voce, Immagini, Video, Audio), **Canali**, **Widget**, **Cloud** (Archiviazione, Database) e **Ricerca**.

- `Cmd/Ctrl+F` apre la ricerca di pagine e impostazioni.
- `Cmd/Ctrl+/` porta il cursore nell'editor del prompt.
- Le pagine interne usano breadcrumb, i percorsi sconosciuti mostrano una schermata di recupero e le transizioni rispettano la preferenza di movimento ridotto.

La pagina Ricerca configura lo stesso motore Brave o Tavily e la stessa chiave usati dallo strumento di ricerca web dell'agente. Non è una funzione separata per cercare nei file locali.

## Preferenze dell'applicazione

Puoi vedere nome e versione dell'app, mostrare o nascondere l'icona nella barra di sistema, impedire al computer di sospendersi lasciando comunque spegnere lo schermo, aprire la cartella dei dati dell'applicazione, scegliere inglese o italiano e usare il tema chiaro, scuro o di sistema. La modalità di sistema segue i cambiamenti del tema del sistema operativo.

## Permessi per i media

Le pagine di sistema riguardano Microfono, Fotocamera e Acquisizione schermo. Su macOS, Kucedr mostra lo stato dei permessi, può richiedere l'accesso e apre il pannello corretto delle Impostazioni di Sistema. Puoi anche provare e riprodurre una registrazione del microfono, un'anteprima della fotocamera e una cattura dello schermo.

Sulle altre piattaforme, lo stato esplicito dei permessi di sistema viene indicato come sconosciuto e gli interruttori del microfono e della fotocamera nell'app non impediscono ancora l'acquisizione. Per la cattura dello schermo viene scelta automaticamente la prima sorgente restituita da Electron, quindi non è disponibile un selettore della sorgente.

## Piattaforme e lingue

| Piattaforma | Pacchetti |
| --- | --- |
| Windows | Installer NSIS per x64, cartella di installazione selezionabile, collegamento sul desktop e dati dell'app conservati dopo la disinstallazione. |
| macOS | PKG e DMG per x64 e arm64, supporto alla modalità scura, runtime protetto e autorizzazioni per microfono e fotocamera. |
| Linux | AppImage e DEB. |

L'interfaccia include cataloghi in inglese e italiano con un selettore della lingua, oltre ai temi chiaro, scuro e di sistema. La localizzazione è parziale: una parte importante dei testi della configurazione iniziale e della schermata Home, inclusi i suggerimenti per i prompt e il segnaposto dell'editor, è ancora solo in inglese.
