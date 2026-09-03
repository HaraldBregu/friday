import kucedrEn from "./data/kucedr-product.json";
import integrationsEn from "./data/integrations.json";
import operatorsEn from "./data/operators.json";
import siteEn from "./data/site.json";

export const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];

export const localeMeta: Record<Locale, { label: string; shortLabel: string; hreflang: string }> = {
  en: {
    label: "English",
    shortLabel: "EN",
    hreflang: "en",
  },
  it: {
    label: "Italiano",
    shortLabel: "IT",
    hreflang: "it",
  },
};

const localizedCategory: Record<string, string> = {
  Code: "Codice",
  Channels: "Canali",
  Operators: "Operatori",
  Data: "Dati",
  Infrastructure: "Infrastruttura",
  "AI Providers": "Provider AI",
};

const siteIt = {
  ...siteEn,
  tagline: "Il tuo assistente AI personale per desktop",
  description:
    "Kucedr lavora sui tuoi file, cerca sul web e usa gli strumenti che scegli. Tu controlli provider, dati e autorizzazioni.",
  audience:
    "Professionisti, persone attente alla privacy e team che vogliono un assistente AI personale sul desktop, con azioni sempre sotto controllo.",
  cta: {
    label: "Scarica Kucedr",
    url: "#download",
  },
  secondaryCta: {
    label: "Scopri le integrazioni",
    url: "/integrations",
  },
} satisfies typeof siteEn;

const kucedrIt = {
  ...kucedrEn,
  nav: [
    { label: "Prodotto", href: "#product" },
    { label: "Funzioni", href: "#features" },
    { label: "Docs", href: "/docs" },
    { label: "Scarica", href: "#download" },
  ],
  release: {
    ...kucedrEn.release,
    phase: "Beta pubblica",
  },
  hero: {
    eyebrow: "Assistente AI per desktop",
    headline: "Kucedr.",
    description:
      "Chiedi a Kucedr ciò che ti serve, con la voce o per iscritto. Lavora sui file, esegue comandi, cerca sul web, usa il browser e crea contenuti con i provider che scegli tu.",
  },
  demoSuggestions: [
    {
      question: "Riassumi i miei messaggi Telegram",
      answer:
        "Hai 4 messaggi diretti e 2 thread di gruppo. Il thread da guardare è #launch: Priya è bloccata sulla domanda del timeout API e ti ha taggato 11 minuti fa.",
    },
    {
      question: "Scrivi un rifiuto gentile a Maya",
      answer:
        "Ciao Maya, grazie mille per l'invito. Giovedì non riesco a partecipare, ma mi farebbe piacere trovare un altro momento. Vuoi che invii alcune opzioni per la prossima settimana?",
    },
    {
      question: "Cosa ho fatto ieri?",
      answer:
        "Hai passato la mattina sulla landing page di Kucedr, hai rilasciato un piccolo aggiornamento prodotto dopo pranzo e hai chiuso il portatile alle 18:12.",
    },
  ],
  heroPillars: [
    { icon: "Sparkles", title: "Attività in più passaggi", text: "Sceglie gli strumenti e continua finché il compito non è completo." },
    { icon: "Cpu", title: "Provider a tua scelta", text: "Scegli provider e modello diversi per chat, voce, immagini, video e audio." },
    { icon: "ShieldCheck", title: "Dati salvati in locale", text: "Chiavi, cronologia, memoria e contenuti generati restano nei dati dell'app." },
    { icon: "Cloud", title: "Backup cloud", text: "Salva le cartelle che scegli su un tuo bucket S3-compatibile." },
  ],
  landingFeatures: [
    {
      key: "01",
      status: "Chat",
      title: "Chat che agisce",
      description:
        "Descrivi ciò che ti serve e Kucedr usa gli strumenti necessari: legge file, applica modifiche, esegue comandi, gestisce processi, cerca sul web e usa un browser reale.",
    },
    {
      key: "02",
      status: "Local-first",
      title: "I tuoi dati restano tuoi",
      description:
        "Kucedr è un'app desktop Electron. Chiavi dei provider, conversazioni, memoria, progetti e contenuti generati restano nei dati locali dell'app, senza richiedere un account online.",
    },
    {
      key: "03",
      status: "Permessi",
      title: "Il lavoro sensibile richiede approvazione",
      description:
        "Ogni strumento segue regole precise. Modifiche ai file, comandi shell e patch chiedono conferma per impostazione predefinita. Puoi negare, consentire una volta o creare una regola per le cartelle di cui ti fidi.",
    },
    {
      key: "04",
      status: "Voce",
      title: "Dettatura e lettura ad alta voce",
      description:
        "Detta nel prompt con trascrizione parziale in tempo reale sui modelli streaming, oppure registra e trascrivi in un passaggio. Le risposte vengono lette dal provider text-to-speech che scegli.",
    },
    {
      key: "05",
      status: "Estendibile",
      title: "Skill e MCP",
      description:
        "Installa skill come cartelle locali con un SKILL.md e richiamale dal menu slash. Collega server MCP remoti HTTP o locali stdio e i loro strumenti entrano nel set per quella esecuzione.",
    },
    {
      key: "06",
      status: "Automazione",
      title: "Pianificazioni e health check",
      description:
        "Una checklist HEALTH.md gira in background all'intervallo che scegli, salta quando sei occupato e resta in silenzio se non serve attenzione. I record cron restano salvati e si ricaricano all'avvio.",
    },
  ],
  howSteps: [
    {
      label: "PASSO 01",
      glyph: "Chiedi",
      title: "Fai una richiesta",
      description: "Scrivi, detta o allega immagini e PDF. Il menu slash raggiunge skill installate, obiettivi del thread e la lista delle pianificazioni senza uscire dall'editor.",
    },
    {
      label: "PASSO 02",
      glyph: "Piano",
      title: "Sceglie gli strumenti",
      description: "Kucedr costruisce ogni turno dai file del workspace, dalla memoria salvata e dalle istruzioni del progetto attivo, poi manda in streaming le chiamate: file, comandi, web, browser, media, MCP o un subagent.",
    },
    {
      label: "PASSO 03",
      glyph: "Agisci",
      title: "Approvi e verifichi",
      description: "Le azioni protette si fermano su una card di permesso. Ogni chiamata resta nella trascrizione con input, output e durata, e il pulsante stop annulla l'esecuzione e le approvazioni in sospeso.",
    },
  ],
  quote: {
    text: "A differenza di un chatbot web, Kucedr gira sulla tua macchina e lavora con provider, credenziali e permessi scelti da te.",
    cite: "Product brief Kucedr",
  },
  landingMcp: [
    {
      name: "Server MCP remoti",
      label: "Estensione",
      description: "Collega server MCP remoti via HTTP con bearer token o OAuth. I server abilitati si connettono all'inizio dell'esecuzione, mettono a disposizione i propri strumenti e si chiudono al termine.",
      icon: "PlugZap",
    },
    {
      name: "Server MCP locali",
      label: "Estensione",
      description: "Esegui server stdio dalla tua macchina con comando, argomenti, variabili d'ambiente e directory di lavoro. Un server irraggiungibile viene saltato per quella esecuzione, non è un errore fatale.",
      icon: "Workflow",
    },
    {
      name: "Qualsiasi tool MCP",
      label: "Estensione",
      description: "Gli strumenti arrivano come mcp__server__tool e seguono lo stesso modello di permessi, quindi un server può richiedere approvazione prima che i suoi tool vengano eseguiti.",
      icon: "Plus",
    },
  ],
  landingChannels: [
    {
      name: "Telegram",
      status: "Attivo",
      description:
        "Bot in long polling con health check ogni 60 secondi e riconnessione esponenziale. Le risposte si dividono a 4.096 caratteri e tornano nella chat, nel messaggio e nel thread di origine.",
      icon: "Send",
    },
    {
      name: "Discord",
      status: "Attivo",
      description:
        "Bot per server e DM con supporto a thread e riferimenti di risposta. Le risposte si dividono a 2.000 caratteri e tornano nel canale di origine.",
      icon: "MessageSquare",
    },
  ],
  landingOperators: [
    {
      name: "Chat assistente",
      description: "Esegui turni agent da una chat Markdown pulita, con attività strumenti visibile, cronologia sessione e prompt di permesso per azioni sensibili.",
      icon: "Layers",
      status: "Live",
    },
    {
      name: "Voce",
      description: "Detta richieste con speech-to-text e fai leggere le risposte da Kucedr tramite il provider voce e il modello che scegli.",
      icon: "Bot",
      status: "Live",
    },
    {
      name: "Scheduler cron",
      description: "Crea, aggiorna, pausa, riprendi, elenca ed esegui lavori assistente ricorrenti con istruzioni, provider e modello dedicati.",
      icon: "Clock",
      status: "Live",
    },
    {
      name: "Health check",
      description: "Esegui controlli periodici basati su checklist e ricevi un report quando qualcosa nella configurazione richiede attenzione.",
      icon: "HeartHandshake",
      status: "Live",
    },
    {
      name: "Generazione immagini",
      description: "Crea immagini da descrizioni testuali in chat o nel workspace immagini usando il provider e il modello selezionati.",
      icon: "Image",
      status: "Live",
    },
    {
      name: "Video e audio",
      description: "Genera video, musica ed effetti sonori dal testo con il provider e il modello che scegli, salvati nella libreria media e riproducibili in chat.",
      icon: "Video",
      status: "Live",
    },
  ],
  landingOperatorGroups: [
    {
      label: "Assistente",
      description: "Il ciclo di strumenti che pianifica, chiede approvazione e restituisce risultati concreti.",
      items: [
        {
          name: "Chat assistente",
          description:
            "Markdown in streaming con codice evidenziato, chiamate a strumenti raggruppate in riepiloghi apribili, cronologia per sessione e card di permesso sulle azioni protette.",
          icon: "Layers",
          status: "Live",
        },
      ],
    },
    {
      label: "Generazione",
      description:
        "Operatori media per voce, immagini, video e audio, ognuno con provider e modello salvati separatamente.",
      items: [
        {
          name: "Generazione voce",
          description:
            "Sei provider per la trascrizione, streaming o batch, e sette per la lettura ad alta voce: Cartesia, Deepgram, ElevenLabs, Google, MiniMax, Mistral e OpenAI.",
          icon: "Volume2",
          status: "Live",
        },
        {
          name: "Generazione immagini",
          description:
            "Sette provider con adapter funzionanti, da FLUX.2 e Gemini 3.1 Flash Image a Stable Image Ultra. L'output dell'agent finisce nella libreria media e appare in chat.",
          icon: "Image",
          status: "Live",
        },
        {
          name: "Generazione video",
          description: "Otto provider con adapter funzionanti: Veo 3.1, Kling 2.5 Turbo, Runway Gen-4, Ray 3, Hailuo 2.3, Pika, Wan 2.5 e Grok Imagine. I risultati si riproducono senza uscire dalla conversazione.",
          icon: "Video",
          status: "Live",
        },
        {
          name: "Generazione audio",
          description: "Musica ed effetti sonori tramite Eleven Music, ElevenLabs Sound Effects e Stable Audio 2.5, salvati in una libreria locale datata che puoi riascoltare dalle impostazioni.",
          icon: "AudioLines",
          status: "Live",
        },
      ],
    },
    {
      label: "Automazione",
      description:
        "Lavoro in background guidato dalla tua checklist e dalle pianificazioni, separato dalla generazione media.",
      items: [
        {
          name: "Scheduler cron",
          description:
            "Record di pianificazione persistenti con espressione cron, stato in pausa e provider e modello dedicati. Li crei, metti in pausa ed elenchi in conversazione; all'avvio vengono ricaricati. L'esecuzione dei prompt è in arrivo.",
          icon: "Clock",
          status: "Beta",
        },
        {
          name: "Health check",
          description:
            "Una checklist HEALTH.md ogni minuto, ogni trenta minuti o ogni ora, in una sessione dedicata, saltata quando sei occupato. Un HEALTH_OK secco resta in silenzio, tutto il resto viene registrato.",
          icon: "HeartHandshake",
          status: "Live",
        },
      ],
    },
  ],
  landingProviderGroups: [
    { label: "Assistente", examples: ["OpenAI", "Anthropic", "Google", "xAI", "Mistral", "DeepSeek", "Qwen", "Kimi", "Z.ai", "MiniMax", "Reka", "Perplexity", "OpenAI-compatible"] },
    { label: "Speech-to-Text", examples: ["OpenAI", "Deepgram", "ElevenLabs", "Mistral", "xAI", "Qwen"] },
    { label: "Text-to-Speech", examples: ["OpenAI", "ElevenLabs", "Cartesia", "Deepgram", "Google", "MiniMax", "Mistral"] },
    { label: "Text-to-Image", examples: ["Black Forest Labs", "Google", "Ideogram", "Luma", "Qwen", "Stability AI", "xAI"] },
    { label: "Text-to-Video", examples: ["Google Veo", "Kling", "Runway", "Luma", "MiniMax", "Pika", "Qwen", "xAI"] },
    { label: "Music / Audio", examples: ["ElevenLabs", "Stability AI"] },
  ],
  faqs: [
    {
      question: "Che cos'è Kucedr?",
      answer:
        "Kucedr è un assistente desktop per Windows, macOS e Linux. Può lavorare su file e processi, eseguire comandi, cercare sul web, usare il browser, ricordare informazioni, caricare skill, collegarsi a server MCP e creare contenuti.",
    },
    {
      question: "Kucedr invia i miei dati da qualche parte?",
      answer:
        "Kucedr è local-first. Impostazioni, chiavi provider, cronologia, memoria, progetti e media generati vivono nei dati applicativi locali. Prompt, allegati e input degli strumenti escono solo verso i provider, i server MCP, i siti, i canali o l'endpoint di storage che un'attività richiede davvero. Le chiavi sono mascherate nell'interfaccia ma salvate in normali file di configurazione locali: tratta quella cartella come sensibile.",
    },
    {
      question: "Devo usare un provider AI specifico?",
      answer:
        "No. Aggiungi le tue chiavi e scegli provider e modello in modo indipendente per assistente, trascrizione, voce, immagini, video, audio, lavoro pianificato e health check. Anthropic passa dalla Messages API, OpenAI dalla Responses API e ogni altro provider di chat dal percorso Chat Completions OpenAI-compatible.",
    },
    {
      question: "Come funzionano i permessi?",
      answer:
        "Ogni strumento ha regole per consentire, chiedere o negare un'azione. Letture, scritture e controllo dei processi sono consentiti per impostazione predefinita; modifiche, comandi shell e patch chiedono conferma. Puoi negare, consentire una volta o autorizzare in anticipo cartelle specifiche. Il controllo dei comandi è una protezione, non una sandbox di sistema.",
    },
    {
      question: "Kucedr può lavorare fuori dall'app?",
      answer:
        "Sì. I bot Telegram e Discord inviano a Kucedr messaggi diretti, di gruppo e nei thread, poi riportano la risposta nella stessa conversazione. Ogni canale ha token, regole di accesso, elenco dei mittenti consentiti e modello di risposta propri.",
    },
    {
      question: "Cosa si può automatizzare?",
      answer:
        "Gli health check funzionano già: una checklist HEALTH.md ogni minuto, ogni trenta minuti o ogni ora, con fasce orarie e intervalli di date opzionali, saltata quando sei occupato e con report solo se serve attenzione. I job cron ricorrenti si creano, mettono in pausa, riprendono ed elencano in conversazione; l'esecuzione dei loro prompt è in arrivo.",
    },
    {
      question: "Quali piattaforme desktop sono supportate?",
      answer:
        "Build Electron per Windows (NSIS, x64), macOS (PKG e DMG, Intel e Apple Silicon, hardened runtime) e Linux (AppImage e DEB). L'interfaccia è in inglese e italiano con tema chiaro, scuro e di sistema, anche se parte delle schermate iniziali è ancora solo in inglese.",
    },
    {
      question: "Kucedr è certificato per dati regolamentati?",
      answer:
        "No. Kucedr non dichiara alcuna certificazione formale per dati regolamentati. Chiavi provider, token dei bot e segreti MCP stanno in file di configurazione locali e non in un vault cifrato: verifica i termini dei tuoi provider e la sicurezza del tuo disco prima di trattare materiale sensibile.",
    },
  ],
} satisfies typeof kucedrEn;

const integrationsIt = [
  {
    name: "Telegram",
    category: localizedCategory.Channels,
    description:
      "Scrivi a Kucedr da Telegram. Scegli chi può contattare il bot e in quali chat può rispondere.",
    icon: "MessageSquare",
  },
  {
    name: "Discord",
    category: localizedCategory.Channels,
    description:
      "Usa Kucedr nei server Discord o nei messaggi diretti. Le risposte tornano sempre nel canale o nel thread di origine.",
    icon: "MessageSquare",
  },
  {
    name: "Slack",
    category: localizedCategory.Channels,
    description:
      "In arrivo: conversazioni di team, approvazioni e risposte di Kucedr direttamente nei thread di Slack.",
    icon: "MessageSquare",
  },
  {
    name: "WhatsApp",
    category: localizedCategory.Channels,
    description:
      "In arrivo: richieste veloci e aggiornamenti dall'assistente direttamente su WhatsApp.",
    icon: "MessageSquare",
  },
  {
    name: "Email",
    category: localizedCategory.Channels,
    description:
      "In arrivo: richieste, riepiloghi e attività di follow-up gestiti tramite email.",
    icon: "MessageSquare",
  },
  {
    name: "Server MCP remoti",
    category: "MCP",
    description: "Collega server MCP remoti via HTTP e proteggili con token o chiave quando necessario.",
    icon: "PlugZap",
  },
  {
    name: "Server MCP locali",
    category: "MCP",
    description: "Avvia server MCP stdio sul computer e aggiungi a Kucedr gli strumenti che ti servono.",
    icon: "Workflow",
  },
  {
    name: "Skill",
    category: "Estensione",
    description:
      "Installa o importa flussi di lavoro riutilizzabili con istruzioni, riferimenti, modelli e script facoltativi.",
    icon: "BookOpen",
  },
  {
    name: "Endpoint compatibili OpenAI",
    category: localizedCategory["AI Providers"],
    description: "Collega altri provider compatibili indicando endpoint e chiave API.",
    icon: "Cpu",
  },
  {
    name: "Provider assistente",
    category: localizedCategory["AI Providers"],
    description: "Scegli il provider e il modello che gestiscono la chat e le attività dell'agente.",
    icon: "Bot",
  },
  {
    name: "Provider voce",
    category: localizedCategory["AI Providers"],
    description:
      "Scegli provider e modello separati per la dettatura e la lettura ad alta voce.",
    icon: "Mic",
  },
  {
    name: "Provider immagini",
    category: localizedCategory["AI Providers"],
    description: "Crea immagini con il provider e il modello che preferisci.",
    icon: "Image",
  },
  {
    name: "Pianificazioni",
    category: "Automazione",
    description:
      "Crea, modifica e metti in pausa le pianificazioni. L'esecuzione automatica dei prompt è ancora in sviluppo.",
    icon: "Clock",
  },
  {
    name: "Health check",
    category: "Automazione",
    description: "Esegui periodicamente la tua checklist e ricevi un avviso solo quando qualcosa richiede attenzione.",
    icon: "HeartHandshake",
  },
  {
    name: "Workspace locale",
    category: localizedCategory.Data,
    description:
      "Conserva sul computer file, dati di lavoro, impostazioni, credenziali, memoria e cronologia.",
    icon: "Database",
  },
] satisfies typeof integrationsEn;

const operatorCopyIt: Record<string, {
  name: string;
  description: string;
  providers: string[];
  highlights: string[];
  status?: string;
}> = {
  "assistant-chat": {
    name: "Chat dell'assistente",
    description: "Il punto di partenza per parlare con Kucedr, seguire l'attività degli strumenti e ritrovare le conversazioni salvate sul computer.",
    providers: ["Provider dell'assistente", "Modello configurato", "Cronologia locale"],
    highlights: ["Richieste in linguaggio naturale", "Attività degli strumenti visibile", "Markdown, codice e immagini nella chat", "Cronologia salvata in locale"],
  },
  "agent-tools": {
    name: "Strumenti dell'agente",
    description: "Gli strumenti che Kucedr usa per lavorare su file e processi, eseguire comandi, cercare sul web, usare il browser e creare contenuti.",
    providers: ["Strumenti locali", "Server MCP", "Skill"],
    highlights: ["Conferma prima delle azioni sensibili", "File, shell, web, browser, media, skill e MCP", "Risultati degli strumenti visibili", "Nessuna modifica agli account senza autorizzazione"],
  },
  voice: {
    name: "Voce",
    description: "Detta le richieste e ascolta le risposte usando il provider e il modello vocale che preferisci.",
    providers: ["Speech-to-Text", "Text-to-Speech", "Permesso del microfono"],
    highlights: ["Dettatura in tempo reale", "Trascrizione delle registrazioni", "Lettura delle risposte", "Scelta del provider e del modello vocale"],
  },
  "image-generation": {
    name: "Generazione di immagini",
    description: "Crea immagini da una descrizione nella chat o nel workspace dedicato.",
    providers: ["Provider Text-to-Image", "Modello configurato"],
    highlights: ["Immagini mostrate nella conversazione", "Salvataggio dei file generati", "Scelta di provider e modello", "Disponibile in chat e nelle Impostazioni"],
  },
  skills: {
    name: "Skill",
    description: "Flussi di lavoro riutilizzabili che spiegano a Kucedr come gestire un'attività specifica.",
    providers: ["Libreria personale", "Skill abilitate"],
    highlights: ["Importa, abilita e disabilita le skill", "Istruzioni caricate quando servono", "Strumenti e requisiti dichiarati", "Attività di caricamento visibile"],
  },
  "mcp-servers": {
    name: "Server MCP",
    description: "Collega server Model Context Protocol remoti o locali e metti i loro strumenti a disposizione dell'assistente.",
    providers: ["MCP remoto", "MCP stdio locale"],
    highlights: ["Server HTTP con autenticazione facoltativa", "Server eseguiti come processi locali", "Nuovi strumenti senza modificare Kucedr", "Strumenti disponibili dopo la connessione"],
  },
  channels: {
    name: "Canali",
    description: "Parla con Kucedr da Telegram e Discord e ricevi la risposta nella stessa chat. Slack, WhatsApp ed email sono in programma.",
    providers: ["Telegram", "Discord", "Slack in arrivo", "WhatsApp in arrivo", "Email in arrivo"],
    highlights: ["Messaggi tramite bot", "Riconnessione automatica", "Regole di accesso per messaggi diretti e canali", "Token e stato separati per ogni canale"],
  },
  "task-scheduler": {
    name: "Pianificazioni",
    description: "Crea e gestisci attività ricorrenti. Le pianificazioni vengono salvate e ripristinate, ma i prompt non vengono ancora eseguiti automaticamente.",
    providers: ["Pianificazione cron", "Provider riservato alle attività"],
    highlights: ["Crea, modifica, sospendi e riprendi", "Pianificazioni salvate sul computer", "Provider e modello configurabili", "Esecuzione dei prompt in sviluppo"],
    status: "pending-runtime",
  },
  "health-checks": {
    name: "Health check",
    description: "Esegui periodicamente una checklist e ricevi un avviso quando qualcosa richiede attenzione.",
    providers: ["Checklist", "Intervallo", "Sessione dedicata"],
    highlights: ["Controlli periodici basati su checklist", "Intervallo configurabile", "Esecuzione saltata quando Kucedr è occupato", "Nessun avviso quando tutto è in ordine"],
  },
  memory: {
    name: "Memoria e personalizzazione",
    description: "Preferenze, informazioni utili e contesto del workspace aiutano Kucedr a darti risposte più pertinenti.",
    providers: ["Memoria locale", "Profilo utente", "Workspace"],
    highlights: ["Preferenze disponibili nel tempo", "Profilo e tono personalizzati", "Workspace locale per i file", "Dati di personalizzazione sul dispositivo"],
  },
  "media-video-audio": {
    name: "Generazione di video e audio",
    description: "Crea video, musica ed effetti sonori con il provider e il modello che scegli. I risultati restano nella libreria locale e si riproducono nella chat.",
    providers: ["Text-to-Video", "Musica e audio"],
    highlights: ["Video generati da testo", "Musica ed effetti sonori", "Scelta separata per ogni tipo di media", "File salvati nella libreria locale"],
  },
};

const operatorsIt = operatorsEn.map((operator) => ({
  ...operator,
  ...operatorCopyIt[operator.id],
})) satisfies typeof operatorsEn;
const en = {
  locale: "en",
  site: siteEn,
  kucedr: kucedrEn,
  integrations: integrationsEn,
  operators: operatorsEn,
  ui: {
    skipToContent: "Skip to content",
    primaryNavigation: "Primary navigation",
    socialLinks: "Social links",
    languageSwitcher: "Language",
    themeToggle: "Toggle color theme",
    downloadFallbackLabel: "Download Kucedr",
    downloadCta: "Download",
    releaseNotes: "Release notes",
    github: "GitHub",
    starOnGithub: "Star on GitHub",
    viewAllIntegrations: "View all integrations",
    supportedChannels: "Supported messaging channels",
    footerGroups: [
      {
        title: "Product",
        links: [
          { label: "Home", href: "/" },
          { label: "Features", href: "/#features" },
          { label: "How it works", href: "/#how" },
          { label: "MCP", href: "/#mcp" },
          { label: "Tools", href: "/tools" },
          { label: "Docs", href: "/docs" },
        ],
      },
      {
        title: "Solutions",
        links: [
          { label: "Overview", href: "/solutions" },
          { label: "Enterprise", href: "/solutions#enterprise" },
          { label: "Education", href: "/solutions#education" },
          { label: "Personal", href: "/solutions#personal" },
        ],
      },
      {
        title: "Explore",
        links: [
          { label: "Channels", href: "/channels" },
          { label: "Integrations", href: "/integrations" },
          { label: "Providers", href: "/providers" },
          { label: "Operators", href: "/operators" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "Community", href: "/community" },
          { label: "Blog", href: "/blog" },
          { label: "FAQ", href: "/#faq" },
          { label: "Terms of Service", href: "/terms-of-service" },
          { label: "Privacy policy", href: "/privacy-policy" },
        ],
      },
    ],
    footerRights: "All rights reserved.",
    footerPermissionNote: "Review provider, tool, and channel permissions before enabling automation.",
    footerCredit: "Built with love by ",
  },
  home: {
    ogTitle: "Kucedr: Your Desktop AI Personal Assistant",
    ogDescription:
      "A desktop agent that reads and edits files, runs commands, searches the web, drives a browser, and generates images, video, and audio, all with your own provider keys and your approval on anything sensitive.",
    featuresEyebrow: "Features",
    featuresTitle: "A capable assistant,|running on your desktop.",
    howEyebrow: "How it works",
    howTitle: "Ask naturally.|Approve real actions.",
    mcpEyebrow: "MCP",
    mcpTitle: "Extend Kucedr|with MCP servers.",
    channelsEyebrow: "Channels",
    channelsTitle: "Chat with Kucedr|from anywhere.",
    channelsPanelDescription:
      "Connect a Telegram or Discord bot and reach Kucedr from your phone. Direct, group, and thread messages route to the agent, and each channel keeps its own token, access policy, and reply model.",
    operatorsEyebrow: "Workflows",
    operatorsTitle: "Generation and automation,|split by workflow.",
    providersEyebrow: "AI Providers",
    providersTitle: "Bring your own AI.|Mix models by capability.",
    faqEyebrow: "FAQ",
    faqTitle: "Common questions.",
    downloadTitle: "Get Kucedr for desktop.",
    downloadLabel: "Download Kucedr",
    downloadNote: "Desktop beta for macOS, Windows, and Linux.",
    releaseFootnote: "desktop builds",
  },
  integrationsPage: {
    title: "Integrations",
    description: "Supported providers, channels, productivity tools, data sources, and infrastructure integrations.",
    eyebrow: "Integrations",
    heading: "Connect the systems that make work real.",
    intro: "Channels, AI providers, automation, and local data that plug into Kucedr.",
    singular: "integration",
    plural: "integrations",
    ctaEyebrow: "Need a different system?",
    ctaTitle: "Add the integration that matters to your team.",
    ctaDescription:
      "Use the JSON data model as a starter, then connect real providers as your product matures.",
  },
  communityPage: {
    title: "Community",
    description: "The mission behind Kucedr, how to contribute to the desktop assistant, and where the community gathers around issues, discussions, and releases.",
    eyebrow: "Community",
    heading: "Make useful AI feel accountable, inspectable, and owned by the team.",
    intro: "Assistants should work in the open, explain their actions, and fit the workflows you already trust.",
    cards: [
      {
        icon: "Users",
        title: "Built with operators",
        description:
          "The product should reflect how teams actually work: messy context, approval steps, shared channels, and evolving internal rules.",
      },
      {
        icon: "BookOpen",
        title: "Documented by default",
        description:
          "Workflows, prompts, provider choices, and integration settings should be easy to inspect, improve, and share.",
      },
      {
        icon: "HeartHandshake",
        title: "Open to contributors",
        description:
          "Add adapters, improve starter workflows, write docs, or help shape the safety model for agentic desktop tools.",
      },
    ],
    joinEyebrow: "Join in",
    joinTitle: "Follow development and contribute where you can help.",
    ctaEyebrow: "Contribute a workflow",
    ctaTitle: "Turn your repeated task into a reusable command.",
    ctaDescription:
      "Start with the sample data and replace it with your real contribution paths, docs, and repository links.",
  },
  operatorsPage: {
    title: "Operators",
    description:
      "Kucedr workflows for chat, tools, voice, images, skills, MCP, channels, scheduling, health checks, and memory.",
    eyebrow: "Operators",
    heading: "The assistant capabilities, grouped by workflow.",
    intro: "Each operator handles one job (chat, voice, media, or automation) with its own provider and model.",
    supportedProviders: "Supported providers",
    statusLabel: {
      implemented: "Live",
      "pending-runtime": "Coming soon",
      placeholder: "Planned",
    },
    ctaEyebrow: "Bring your own provider",
    ctaTitle: "Every operator is provider-agnostic.",
    ctaDescription:
      "Configure your preferred provider and model in Settings. Credentials stay local; the operator resolves them at runtime.",
  },
  notFoundPage: {
    title: "Page not found",
    description: "This page could not be found.",
    heading: "This page is not available.",
    intro: "The route may have moved, or the link may need to be updated.",
    action: "Return home",
  },
  productMockup: {
    windowLabel: "Kucedr desktop app preview",
    localWorkspace: "Local workspace",
    titlebarRoute: "Home",
    commandMenuLabel: "Command menu",
    commandShortcut: "Cmd K",
    statusReady: "Ready",
    profileLabel: "Account",
    appAreasLabel: "Kucedr app areas",
    conversationLabel: "Assistant conversation preview",
    navItems: [
      { label: "Chat", icon: "MessagesSquare", active: true },
      { label: "Tools", icon: "TerminalSquare" },
      { label: "Skills", icon: "Workflow" },
      { label: "Channels", icon: "RadioTower" },
      { label: "Cron", icon: "CalendarDays" },
      { label: "Privacy", icon: "ShieldCheck" },
    ],
    userMessage: "Summarize this repo, draft a release note, and ask before running tests.",
    chatUserGreeting: "Run the release checklist.",
    chatAssistantGreeting: "I’ll inspect the project and ask before making changes.",
    chatMessages: [
      { role: "user", text: "Check my calendar for tomorrow." },
      {
        role: "assistant",
        text: "You have three events: a 9:30 standup, lunch with Marco at 13:00, and a design review at 16:00.",
      },
      { role: "user", text: "Create a task to follow up with the design team." },
      {
        role: "assistant",
        text: "Added “Follow up with the design team” to your tasks, due at the end of the week, with a 9:00 reminder.",
      },
      { role: "user", text: "Send an email to Sara with the launch date." },
      {
        role: "assistant",
        text: "Drafted an email to Sara confirming the launch on July 15. I'll ask before sending it.",
      },
    ],
    imageHeader: "Created image",
    libraryFeed: [
      {
        file: "image-1783179258677.jpeg",
        user: "Generate a blue supercar parked on a coastal road at sunset.",
        reply: "Done. Sapphire blue body, ocean sunset behind it.",
      },
      {
        file: "image-1783179862362.jpeg",
        user: "Now the same scene with a red one, in motion.",
        reply: "Here it is at speed along the coast, sun low on the water.",
      },
      {
        file: "image-1783180448601.jpeg",
        user: "A national team lined up in a packed stadium at night.",
        reply: "Lineup under the floodlights, flags across the stands.",
      },
      {
        file: "image-1783253703352.jpeg",
        user: "A striped hot-air balloon against a clear blue sky.",
        reply: "Red, yellow, and blue stripes drifting between the clouds.",
      },
      {
        file: "image-1783269109315.jpeg",
        user: "The Sun and Earth from space, with the solar wind visible.",
        reply: "Solar flares streaming toward Earth's magnetic field.",
      },
      {
        file: "image-1783337979792.jpeg",
        user: "A gray wolf on a rock in a misty forest at dawn.",
        reply: "Standing watch in the first light, mist through the pines.",
      },
      {
        file: "image-1783442946799.jpeg",
        user: "A mountain lake at sunset with perfect reflections.",
        reply: "Still water mirroring the peaks and the burning sky.",
      },
      {
        file: "image-1783449590506.jpeg",
        user: "A summer day at the Colosseum, cafe umbrellas and gelato.",
        reply: "Sunny piazza, colorful umbrellas, gelato at every table.",
      },
      {
        file: "image-1783449852408.jpeg",
        user: "The Trevi Fountain at golden hour.",
        reply: "Warm evening light on the marble, crowds at the edge.",
      },
      {
        file: "image-1783495226058.jpeg",
        user: "A lake at sunrise, framed by tall pines.",
        reply: "Fiery clouds mirrored between the silhouetted trees.",
      },
      {
        file: "image-1783546430702.jpeg",
        user: "A minimalist living room in warm beige tones.",
        reply: "Clean lines, soft daylight, and a few green accents.",
      },
      {
        file: "image-1783546631450.jpeg",
        user: "Make it cozier: fireplace, bookshelves, warm light.",
        reply: "Fire lit, shelves full, blankets ready for the evening.",
      },
      {
        file: "image-1783694585292.jpeg",
        user: "Rome in a heatwave, make it dramatic.",
        reply: "Blazing sun over the Forum, and the gelato is losing the fight.",
      },
      {
        file: "image-1783695407850.jpeg",
        user: "A winged horse rising through golden clouds.",
        reply: "Pegasus climbing into the light between the clouds.",
      },
      {
        file: "image-1783756461580.jpeg",
        user: "An astronaut fishing for stars from a crescent moon.",
        reply: "Line cast into a spiral galaxy, lantern lit beside him.",
      },
      {
        file: "image-1784044528440.jpeg",
        user: "Dinner at a Roman trattoria, pizza on the table.",
        reply: "Checkered tablecloths, full glasses, a margherita to share.",
      },
      {
        file: "image-1784044624641.jpeg",
        user: "Lunch in a Roman piazza by the fountain.",
        reply: "Tables in the sun around the fountain and the obelisk.",
      },
      {
        file: "image-1784044745187.jpeg",
        user: "A terrace restaurant facing the Colosseum.",
        reply: "Front-row tables, pizza arriving, arches in the background.",
      },
      {
        file: "image-1784044781332.jpeg",
        user: "Aperitivo hour on a cobbled street near the Colosseum.",
        reply: "Spritz and pizza under yellow umbrellas on the cobblestones.",
      },
      {
        file: "image-1784044799230.jpeg",
        user: "One more from the terrace, bright midday sun.",
        reply: "Midday at the Colosseum. Umbrellas up, plates full.",
      },
    ],
    historyLabel: "History",
    attachedFile: "project-notes.md",
    removeAttachment: "Remove attachment",
    listeningLabel: "Listening...",
    dictationText: "Summarize my morning and suggest the next task.",
    interactiveReply:
      "I can do that. I will use the configured tools, keep activity visible, and ask before writing files, sending messages, or touching private data.",
    assistantStatus: "using tools with approval checks",
    planItems: ["Inspect changed files", "Draft release notes", "Ask before running tests"],
    toolActivityLabel: "Tool activity",
    toolActivityValue: "read / web search / image",
    toolRequest: "Tool request",
    toolCommand: "Run `bun run build`",
    approve: "Approve",
    settingsLabel: "Settings",
    modelLabel: "Assistant",
    modelValue: "Your provider",
    voiceLabel: "Voice input",
    voiceValue: "Realtime Whisper",
    activityLabel: "Activity",
    contextLabel: "Context",
    workspaceLabel: "Workspace",
    workspaceValue: "12 files inspected",
    scheduledLabel: "Scheduled",
    scheduledValue: "Daily 9:00 brief",
    channelLabel: "Channel",
    channelValue: "Telegram live",
    privacyLabel: "Privacy",
    privacyValue: "Local keys",
    actionPreviewLabel: "Workspace action preview",
    composerLabel: "Kucedr prompt composer preview",
    addAttachment: "Add attachment",
    voiceInput: "Voice input",
    sendPrompt: "Send prompt",
    composerPlaceholder: "Ask anything",
  },
};

const it = {
  locale: "it",
  site: siteIt,
  kucedr: kucedrIt,
  integrations: integrationsIt,
  operators: operatorsIt,
  ui: {
    skipToContent: "Vai al contenuto",
    primaryNavigation: "Navigazione principale",
    socialLinks: "Link social",
    languageSwitcher: "Lingua",
    themeToggle: "Cambia tema",
    downloadFallbackLabel: "Scarica Kucedr",
    downloadCta: "Scarica",
    releaseNotes: "Note di versione",
    github: "GitHub",
    starOnGithub: "Aggiungi una stella su GitHub",
    viewAllIntegrations: "Scopri tutte le integrazioni",
    supportedChannels: "Canali di messaggistica supportati",
    footerGroups: [
      {
        title: "Prodotto",
        links: [
          { label: "Home", href: "/" },
          { label: "Funzioni", href: "/#features" },
          { label: "Come funziona", href: "/#how" },
          { label: "MCP", href: "/#mcp" },
          { label: "Strumenti", href: "/tools" },
          { label: "Documentazione", href: "/docs" },
        ],
      },
      {
        title: "Soluzioni",
        links: [
          { label: "Panoramica", href: "/solutions" },
          { label: "Enterprise", href: "/solutions#enterprise" },
          { label: "Education", href: "/solutions#education" },
          { label: "Personal", href: "/solutions#personal" },
        ],
      },
      {
        title: "Esplora",
        links: [
          { label: "Canali", href: "/channels" },
          { label: "Integrazioni", href: "/integrations" },
          { label: "Provider", href: "/providers" },
          { label: "Operatori", href: "/operators" },
        ],
      },
      {
        title: "Azienda",
        links: [
          { label: "Community", href: "/community" },
          { label: "Blog", href: "/blog" },
          { label: "FAQ", href: "/#faq" },
          { label: "Termini di servizio", href: "/terms-of-service" },
          { label: "Informativa sulla privacy", href: "/privacy-policy" },
        ],
      },
    ],
    footerRights: "Tutti i diritti riservati.",
    footerPermissionNote: "Controlla i permessi di provider, strumenti e canali prima di attivare le automazioni.",
    footerCredit: "Creato con amore da ",
  },
  home: {
    ogTitle: "Kucedr: Assistente Personale AI per Desktop",
    ogDescription:
      "Un agente desktop che legge e modifica file, esegue comandi, cerca sul web, pilota un browser e genera immagini, video e audio, con le tue chiavi provider e la tua approvazione su ciò che conta.",
    featuresEyebrow: "Funzioni",
    featuresTitle: "Un assistente capace,|sul tuo desktop.",
    howEyebrow: "Come funziona",
    howTitle: "Chiedi in modo naturale.|Approva le azioni reali.",
    mcpEyebrow: "MCP",
    mcpTitle: "Estendi Kucedr|con i server MCP.",
    channelsEyebrow: "Canali",
    channelsTitle: "Parla con Kucedr|da ovunque.",
    channelsPanelDescription:
      "Collega un bot Telegram o Discord e raggiungi Kucedr dal telefono. Messaggi diretti, di gruppo e nei thread arrivano all'agent, e ogni canale mantiene token, policy di accesso e modello di risposta propri.",
    operatorsEyebrow: "Workflow",
    operatorsTitle: "Generazione e automazione,|separate per workflow.",
    providersEyebrow: "Provider AI",
    providersTitle: "Porta la tua AI.|Combina modelli per capacità.",
    faqEyebrow: "FAQ",
    faqTitle: "Domande comuni.",
    downloadTitle: "Scarica Kucedr per desktop.",
    downloadLabel: "Scarica Kucedr",
    downloadNote: "Beta desktop per macOS, Windows e Linux.",
    releaseFootnote: "build desktop",
  },
  integrationsPage: {
    title: "Integrazioni",
    description: "Scopri i provider, i canali, i server MCP e le automazioni che puoi collegare a Kucedr.",
    eyebrow: "Integrazioni",
    heading: "Collega Kucedr agli strumenti che usi ogni giorno.",
    intro: "Scegli provider AI, canali, server MCP e automazioni. Kucedr li riunisce in un unico spazio di lavoro.",
    singular: "integrazione",
    plural: "integrazioni",
    ctaEyebrow: "Ti serve altro?",
    ctaTitle: "Collega a Kucedr gli strumenti del tuo team.",
    ctaDescription:
      "Parti dalle integrazioni disponibili oppure crea una skill o un server MCP per il tuo flusso di lavoro.",
  },
  communityPage: {
    title: "Community",
    description: "Scopri come seguire lo sviluppo di Kucedr, proporre miglioramenti e condividere flussi di lavoro con la community.",
    eyebrow: "Community",
    heading: "Costruiamo insieme un assistente più utile e trasparente.",
    intro: "Kucedr cresce grazie a persone che condividono idee, documentazione e flussi di lavoro reali.",
    cards: [
      {
        icon: "Users",
        title: "Parte dai problemi reali",
        description:
          "Kucedr deve adattarsi al modo in cui persone e team lavorano davvero, comprese approvazioni, contesto incompleto e regole che cambiano.",
      },
      {
        icon: "BookOpen",
        title: "Documentato fin dall'inizio",
        description:
          "Flussi di lavoro, provider e impostazioni devono essere facili da capire, controllare e migliorare.",
      },
      {
        icon: "HeartHandshake",
        title: "Aperto ai contributi",
        description:
          "Puoi aggiungere integrazioni, migliorare la documentazione o aiutare a rendere più sicuri gli strumenti dell'agente.",
      },
    ],
    joinEyebrow: "Partecipa",
    joinTitle: "Segui lo sviluppo e partecipa al progetto.",
    ctaEyebrow: "Condividi il tuo flusso di lavoro",
    ctaTitle: "Trasforma un'attività ripetitiva in una skill riutilizzabile.",
    ctaDescription:
      "Condividi istruzioni, esempi e strumenti che possono essere utili anche ad altre persone.",
  },
  operatorsPage: {
    title: "Operatori",
    description:
      "Scopri le funzioni di Kucedr per chat, strumenti, voce, immagini, skill, MCP, canali, pianificazioni e memoria.",
    eyebrow: "Operatori",
    heading: "Una funzione chiara per ogni tipo di attività.",
    intro: "Chat, voce, media e automazioni restano separati, con provider, modello e controlli dedicati.",
    supportedProviders: "Provider supportati",
    statusLabel: {
      implemented: "Attivo",
      "pending-runtime": "In arrivo",
      placeholder: "Pianificato",
    },
    ctaEyebrow: "Scegli i tuoi provider",
    ctaTitle: "Usa il modello più adatto a ogni attività.",
    ctaDescription:
      "Configura provider e modello nelle Impostazioni. Kucedr conserva le credenziali sul tuo computer e usa la scelta corretta quando serve.",
  },
  notFoundPage: {
    title: "Pagina non trovata",
    description: "La pagina che cerchi non è disponibile.",
    heading: "Questa pagina non è disponibile.",
    intro: "Potrebbe essere stata spostata oppure il link potrebbe non essere più valido.",
    action: "Torna alla pagina iniziale",
  },
  productMockup: {
    windowLabel: "Anteprima dell'app desktop Kucedr",
    localWorkspace: "Workspace locale",
    titlebarRoute: "Home",
    commandMenuLabel: "Menu comandi",
    commandShortcut: "Cmd K",
    statusReady: "Pronto",
    profileLabel: "Account",
    appAreasLabel: "Aree dell'app Kucedr",
    conversationLabel: "Anteprima conversazione assistente",
    navItems: [
      { label: "Chat", icon: "MessagesSquare", active: true },
      { label: "Strumenti", icon: "TerminalSquare" },
      { label: "Skill", icon: "Workflow" },
      { label: "Canali", icon: "RadioTower" },
      { label: "Cron", icon: "CalendarDays" },
      { label: "Privacy", icon: "ShieldCheck" },
    ],
    userMessage: "Riassumi questo repo, prepara una nota di release e chiedi prima di eseguire i test.",
    chatUserGreeting: "Esegui la checklist release.",
    chatAssistantGreeting: "Ispeziono il progetto e chiedo prima di fare modifiche.",
    chatMessages: [
      { role: "user", text: "Controlla il mio calendario per domani." },
      {
        role: "assistant",
        text: "Hai tre eventi: standup alle 9:30, pranzo con Marco alle 13:00 e design review alle 16:00.",
      },
      { role: "user", text: "Crea un task per ricontattare il team di design." },
      {
        role: "assistant",
        text: "Aggiunto “Ricontattare il team di design” ai tuoi task, scadenza venerdì, con promemoria alle 9:00.",
      },
      { role: "user", text: "Invia un'email a Sara con la data di lancio." },
      {
        role: "assistant",
        text: "Ho preparato una bozza per Sara che conferma il lancio il 15 luglio. Chiedo prima di inviarla.",
      },
    ],
    imageHeader: "Immagine creata",
    libraryFeed: [
      {
        file: "image-1783179258677.jpeg",
        user: "Genera una supercar blu parcheggiata su una strada costiera al tramonto.",
        reply: "Fatto: carrozzeria blu zaffiro e tramonto sull'oceano.",
      },
      {
        file: "image-1783179862362.jpeg",
        user: "Ora la stessa scena con una rossa, in movimento.",
        reply: "Eccola in corsa lungo la costa, con il sole basso sull'acqua.",
      },
      {
        file: "image-1783180448601.jpeg",
        user: "Una nazionale schierata in uno stadio pieno, di notte.",
        reply: "Schierati sotto i riflettori, bandiere su tutti gli spalti.",
      },
      {
        file: "image-1783253703352.jpeg",
        user: "Una mongolfiera a strisce contro un cielo azzurro.",
        reply: "Strisce rosse, gialle e blu che fluttuano tra le nuvole.",
      },
      {
        file: "image-1783269109315.jpeg",
        user: "Il Sole e la Terra dallo spazio, con il vento solare visibile.",
        reply: "Brillamenti solari che raggiungono il campo magnetico terrestre.",
      },
      {
        file: "image-1783337979792.jpeg",
        user: "Un lupo grigio su una roccia in una foresta nebbiosa all'alba.",
        reply: "Di guardia alle prime luci, con la nebbia tra i pini.",
      },
      {
        file: "image-1783442946799.jpeg",
        user: "Un lago di montagna al tramonto con riflessi perfetti.",
        reply: "Acqua immobile che riflette le cime e il cielo infuocato.",
      },
      {
        file: "image-1783449590506.jpeg",
        user: "Una giornata estiva al Colosseo, ombrelloni e gelato.",
        reply: "Piazza soleggiata, ombrelloni colorati e gelato a ogni tavolo.",
      },
      {
        file: "image-1783449852408.jpeg",
        user: "La Fontana di Trevi all'ora d'oro.",
        reply: "Luce calda della sera sul marmo, folla raccolta sul bordo.",
      },
      {
        file: "image-1783495226058.jpeg",
        user: "Un lago all'alba, incorniciato da pini alti.",
        reply: "Nuvole infuocate riflesse tra le sagome degli alberi.",
      },
      {
        file: "image-1783546430702.jpeg",
        user: "Un soggiorno minimalista nei toni del beige.",
        reply: "Linee pulite, luce naturale morbida e qualche tocco di verde.",
      },
      {
        file: "image-1783546631450.jpeg",
        user: "Rendilo più accogliente: camino, librerie, luce calda.",
        reply: "Fuoco acceso, scaffali pieni e coperte pronte per la sera.",
      },
      {
        file: "image-1783694585292.jpeg",
        user: "Roma durante un'ondata di caldo: rendila drammatica.",
        reply: "Sole rovente sul Foro, e il gelato sta perdendo la sfida.",
      },
      {
        file: "image-1783695407850.jpeg",
        user: "Un cavallo alato che sale tra nuvole dorate.",
        reply: "Un pegaso che sale verso la luce tra le nuvole.",
      },
      {
        file: "image-1783756461580.jpeg",
        user: "Un astronauta che pesca stelle da una falce di luna.",
        reply: "Lenza calata in una galassia a spirale, lanterna accesa accanto.",
      },
      {
        file: "image-1784044528440.jpeg",
        user: "Cena in una trattoria romana, pizza in tavola.",
        reply: "Tovaglie a quadretti, calici pieni e una margherita da dividere.",
      },
      {
        file: "image-1784044624641.jpeg",
        user: "Pranzo in una piazza romana vicino alla fontana.",
        reply: "Tavoli al sole intorno alla fontana e all'obelisco.",
      },
      {
        file: "image-1784044745187.jpeg",
        user: "Un ristorante con terrazza di fronte al Colosseo.",
        reply: "Tavoli in prima fila, pizza in arrivo e le arcate sullo sfondo.",
      },
      {
        file: "image-1784044781332.jpeg",
        user: "Ora dell'aperitivo in una via acciottolata vicino al Colosseo.",
        reply: "Spritz e pizza sotto ombrelloni gialli sui sanpietrini.",
      },
      {
        file: "image-1784044799230.jpeg",
        user: "Un'altra dalla terrazza, con il sole di mezzogiorno.",
        reply: "Mezzogiorno al Colosseo: ombrelloni aperti e piatti pieni.",
      },
    ],
    historyLabel: "Cronologia",
    attachedFile: "note-progetto.md",
    removeAttachment: "Rimuovi allegato",
    listeningLabel: "Sto ascoltando...",
    dictationText: "Riassumi la mia mattina e suggerisci il prossimo compito.",
    interactiveReply:
      "Posso farlo. Userò gli strumenti configurati, terrò visibile l'attività e chiederò conferma prima di scrivere file, inviare messaggi o usare dati privati.",
    assistantStatus: "usa strumenti con controlli di approvazione",
    planItems: ["Ispeziona file modificati", "Prepara note di release", "Chiedi prima di eseguire i test"],
    toolActivityLabel: "Attività degli strumenti",
    toolActivityValue: "read / web search / image",
    toolRequest: "Richiesta strumento",
    toolCommand: "Esegui `bun run build`",
    approve: "Approva",
    settingsLabel: "Impostazioni",
    modelLabel: "Assistente",
    modelValue: "Il tuo provider",
    voiceLabel: "Input vocale",
    voiceValue: "Realtime Whisper",
    activityLabel: "Attivita",
    contextLabel: "Contesto",
    workspaceLabel: "Workspace",
    workspaceValue: "12 file ispezionati",
    scheduledLabel: "Pianificato",
    scheduledValue: "Brief alle 9:00",
    channelLabel: "Canale",
    channelValue: "Telegram attivo",
    privacyLabel: "Privacy",
    privacyValue: "Chiavi locali",
    actionPreviewLabel: "Anteprima azioni workspace",
    composerLabel: "Anteprima composer prompt Kucedr",
    addAttachment: "Aggiungi allegato",
    voiceInput: "Input vocale",
    sendPrompt: "Invia prompt",
    composerPlaceholder: "Chiedi qualsiasi cosa",
  },
} satisfies typeof en;

const dictionaries = {
  en,
  it,
} satisfies Record<Locale, typeof en>;

export function normalizeLocale(locale?: string): Locale {
  return locale === "it" ? "it" : "en";
}

export function getLocaleContent(locale?: string) {
  return dictionaries[normalizeLocale(locale)];
}

export function localizedPath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (locale === "en") {
    return normalizedPath;
  }

  return normalizedPath === "/" ? "/it/" : `/it${normalizedPath}`;
}

const translatedRoutePaths = new Set([
  "/",
  "/community",
  "/docs",
  "/integrations",
  "/operators",
  "/privacy-policy",
  "/releases",
  "/terms-of-service",
]);

export function hasTranslatedRoute(path: string, locale: Locale): boolean {
  if (locale === "en") return true;

  const [pathname] = path.split("#");
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname || "/";
  return translatedRoutePaths.has(normalizedPath) || normalizedPath.startsWith("/docs/") || normalizedPath.startsWith("/releases/");
}

export function localizedRoutePath(path: string, locale: Locale): string {
  const [pathname, hash] = path.split("#");
  const normalizedPath = pathname
    ? pathname.startsWith("/") ? pathname : `/${pathname}`
    : "/";
  const resolvedPath = hasTranslatedRoute(normalizedPath, locale)
    ? localizedPath(normalizedPath, locale)
    : normalizedPath;

  return `${resolvedPath}${hash ? `#${hash}` : ""}`;
}

export function getAlternateLinks(path: string, siteUrl: URL) {
  return locales.map((locale) => ({
    ...localeMeta[locale],
    locale,
    url: new URL(localizedPath(path, locale), siteUrl).toString(),
  }));
}
