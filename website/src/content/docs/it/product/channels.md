---
title: "Canali"
description: "Parla con Kucedr da Telegram e Discord e scegli chi può contattarlo e in quali conversazioni può rispondere."
category: "Channels"
locale: "it"
sourcePath: "channels.md"
order: 40
---

Con i canali puoi parlare con Kucedr anche quando non hai davanti l'app desktop. Invia un messaggio da Telegram o Discord: Kucedr gestisce la richiesta e risponde nella stessa conversazione. I canali abilitati e dotati di token si avviano insieme all'app.

| Canale | Stato | Note |
| --- | --- | --- |
| Telegram | Disponibile | Bot in long polling per chat da telefono o desktop. |
| Discord | Disponibile | Bot per server e messaggi diretti, con supporto per thread e riferimenti alle risposte. |

## Comportamento condiviso

- I messaggi diretti, di gruppo o canale e dei thread vengono normalizzati e inoltrati all'agente.
- Quando la piattaforma lo consente, le risposte tornano alla chat, al messaggio e al thread di origine.
- Ogni canale usa il proprio provider e modello di chat configurati per le risposte.
- Le risposte lunghe vengono suddivise in parti adatte alla piattaforma. Le conferme di consegna distinguono tra invio riuscito, parziale e non riuscito.
- `/start` restituisce un messaggio fisso di avvenuta connessione. Gli altri messaggi di canale che iniziano con una barra vengono ignorati.
- Tutti i messaggi Telegram e Discord accettati condividono attualmente un unico identificativo fisso per la sessione del bot, quindi il traffico non è separato per mittente.

## Telegram

- Long polling, con gli aggiornamenti in sospeso eliminati all'avvio.
- Eventi per gli stati connesso, errore e disconnesso.
- Health check ogni 60 secondi e ritardo di riconnessione esponenziale da 2 a 60 secondi.
- Protezione in memoria dai messaggi duplicati.
- Risposte divise ogni 4.096 caratteri.
- Avvio, arresto e riavvio dall'interfaccia.

## Discord

- Intent per server, messaggi nei server, messaggi diretti e contenuto dei messaggi.
- I messaggi scritti da bot vengono ignorati.
- Sono supportati thread e riferimenti alle risposte.
- La riconnessione è gestita da discord.js.
- Risposte divise ogni 2.000 caratteri.

## Controllo degli accessi

Ogni canale conserva separatamente stato di abilitazione, token, policy per i messaggi diretti, elenco dei mittenti diretti consentiti, elenco dei gruppi o canali consentiti e modello usato per le risposte.

- I canali disabilitati o privi di token rifiutano i messaggi in ingresso. Anche i messaggi vuoti vengono ignorati.
- La policy per i messaggi diretti può essere **Elenco consentiti** (predefinita), **Aperto**, **Associazione** o **Nega**.
- La modalità Elenco consentiti accetta solo gli ID mittente configurati.
- Un elenco facoltativo di gruppi o canali limita gli ID dei percorsi accettati.

**Parziale.** L'associazione non è ancora utilizzabile: la policy rifiuta sempre con `pairing_required` e non esiste un flusso per generare o approvare un codice.

Dopo il salvataggio, i token dei canali vengono nascosti nell'interfaccia, ma sono archiviati in normali file di configurazione locali. Consulta [Privacy e sicurezza](/it/docs/privacy).

## Limite noto

La schermata Canali mostra lo stato di esecuzione in tempo reale solo per Telegram e indica Discord come "solo configurazione", anche se il processo principale avvia Discord quando è abilitato e dispone di un token.
