---
name: Shorts
description: Un modern routing desk per trasformare URL lunghi in etichette brevi e tracciabili.
colors:
  paper: "oklch(0.985 0.004 95)"
  ink: "oklch(0.2 0.025 260)"
  card: "oklch(1 0 0)"
  cobalt: "oklch(0.55 0.2 265)"
  on-cobalt: "oklch(0.985 0.004 95)"
  secondary: "oklch(0.94 0.012 260)"
  secondary-ink: "oklch(0.27 0.025 260)"
  muted: "oklch(0.955 0.008 95)"
  muted-ink: "oklch(0.5 0.02 260)"
  border: "oklch(0.89 0.012 260)"
  input: "oklch(0.925 0.01 260)"
  coral-signal: "oklch(0.66 0.19 25)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  base: "0.625rem"
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "var(--radius)"
  xl: "calc(var(--radius) * 1.4)"
  2xl: "calc(var(--radius) * 1.8)"
  3xl: "calc(var(--radius) * 2.2)"
  4xl: "calc(var(--radius) * 2.6)"
spacing:
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  7: "1.75rem"
  8: "2rem"
  12: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.2xl}"
    padding: "0 1rem"
    height: "2.25rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "1.25rem"
  metric-strip:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
---

# Design System: Shorts

## Overview

**Creative North Star: "The Modern Routing Desk"**

Un URL lungo entra come una spedizione e ne esce come un’etichetta breve, leggibile e tracciabile. Il linguaggio visivo rende questa trasformazione concreta con linee di instradamento, nodi, etichette monospace e dati compatti; il seed di direzione è `32c338c9`.

Il tono è moderno, minimale e accessibile, vicino alla quiete delle superfici di autenticazione Kinde. Carta bianca, ink profondo e cobalto operativo costruiscono la gerarchia; il corallo resta un piccolo segnale di percorso. Dashboard e API hanno pari dignità: la GUI mostra l’operazione, la documentazione la rende ripetibile.

**Key Characteristics:**

- Superfici quiete, gerarchia netta e densità moderata.
- Un solo accento operativo dominante; il corallo indica, non decora.
- Dati, URL, slug, chiavi ed esempi API in monospace; il resto in Inter.
- Analytics reali e stati utili al posto di metriche SaaS decorative.
- Componenti condivisi e flussi equivalenti tra console e API.

**The Route Rule.** Ogni espressione distintiva deve aiutare a leggere origine, percorso, destinazione o risultato; non aggiungere infrastruttura grafica priva di funzione.

## Colors

La palette chiara combina carta calda, superfici bianche, ink freddo, cobalto operativo e un segnale corallo raro. I valori normativi sono nel frontmatter e corrispondono ai token di `globals.css`.

### Primary

- **Cobalto operativo** (`--primary`, `--ring`, `--chart-1`): CTA, link attivi, linea di routing, metric strip, caret e focus.
- **Carta su cobalto** (`--primary-foreground`): testo e icone sulle superfici primarie.

### Secondary

- **Piano tecnico quieto** (`--secondary` / `--secondary-foreground`): badge, risultati secondari e azioni meno prominenti.

### Tertiary

- **Segnale corallo** (`--signal`, uguale a `--chart-2`): nodi di partenza e piccoli indicatori di stato del percorso.

### Neutral

- **Carta calda** (`--background`): canvas principale.
- **Carta bianca** (`--card`, `--popover`): card, pannelli, form e dialog.
- **Ink profondo** (`--foreground`, `--card-foreground`): testo principale e pannelli inversi per codice o CTA.
- **Superficie muta** (`--muted`) e **ink secondario** (`--muted-foreground`): helper, descrizioni, empty state e raggruppamenti non interattivi.
- **Bordo freddo** (`--border`) e **campo tenue** (`--input`): separazione e input senza creare griglie pesanti.
- **Rosso distruttivo** (`--destructive`): errori e azioni irreversibili, mai come accento generico.

**The One Signal Rule.** Usa il corallo in punti piccoli e isolati come `.signal-dot`; il cobalto resta l’unica voce d’azione estesa.

Il set `.dark` è già definito per tutti i ruoli semantici, ma l’app non espone ancora un controllo tema. Consideralo una base tecnica, non una modalità di prodotto già promessa.

## Typography

**Display e body:** `Inter Variable`, caricato con `@fontsource-variable/inter` e assegnato a `--font-sans`; `--font-heading` riusa la stessa famiglia.  
**Dati e codice:** la classe `font-mono`, solo per short URL, slug, chiavi, conteggi tecnici e payload.

La personalità nasce da peso medio-alto, tracking negativo nei titoli e body arioso. Non serve una seconda famiglia display.

### Hierarchy

- **Hero display:** `text-5xl sm:text-6xl lg:text-[5.5rem]`, `font-semibold`, `tracking-[-0.04em]`, con `lg:leading-[0.96]`; massimo `12ch`.
- **Titolo marketing/auth:** `text-4xl sm:text-5xl`, `font-semibold`, `tracking-[-0.035em]`.
- **Titolo console:** `text-3xl`, `font-semibold`, `tracking-[-0.03em]`.
- **Titolo di sezione:** `text-2xl`, `font-semibold`, `tracking-[-0.025em]`.
- **Body introduttivo:** `text-lg leading-8`, fino a `60–68ch`; testo operativo base a `text-sm` o `text-base`.
- **Label e metadati:** `text-sm font-medium` e `text-xs text-muted-foreground`.
- **Metriche:** `.metric` abilita numeri tabulari; le metriche principali usano `text-4xl font-semibold tracking-[-0.04em]`.

Usa `.text-balance` per i titoli e `.text-pretty` per i paragrafi editoriali. Usa `truncate` o `overflow-x-auto` per URL e codice: non ridurre il carattere fino a renderlo illeggibile.

**The Data Is Data Rule.** Il monospace segnala contenuto copiabile o confrontabile, non è una decorazione di brand.

## Layout

Il sistema usa container centrati e pochi assi leggibili. Landing e documentazione arrivano a `max-w-7xl`; le viste console usano `max-w-7xl` o `max-w-5xl`, mentre form e testo restano tra `max-w-md`, `max-w-2xl`, `max-w-3xl` e circa `68ch`.

La scala di lavoro ricorrente è Tailwind `2/3/4/5/6/7/8/12`: `gap-2` per coppie, `gap-4` per blocchi compatti, `gap-6` per form e card, `gap-8` tra sezioni operative; `px-5 sm:px-8` sul sito e `p-4 sm:p-6 lg:p-8` nella console. Le sezioni marketing respirano con `py-24 lg:py-32`.

### Responsive

- Sotto `sm`, azioni e righe si impilano; i campi affiancati diventano una colonna e le tabelle mantengono troncamento o scorrimento.
- Da `sm`, header e form possono affiancare contenuti; il padding orizzontale sale da `px-5` a `px-8`.
- Da `md`, la metric strip passa a tre colonne e sostituisce i bordi orizzontali con divisori verticali.
- Da `lg`, il hero usa `0.86fr / 1.14fr`, l’auth `0.88fr / 1.12fr`, la documentazione mostra l’indice sticky da `13rem` e la console usa la sidebar inset. Prima di `lg`, l’indice docs è un `<details>` e l’aside auth è nascosto.

### Motion

La motion descrive il percorso, non il chrome. `.routing-path` usa `route-draw` con `--duration-very-slow` (`500ms`) e `--ease-smooth-out`; `.route-arrival` entra con `--distance-medium` (`12px`) e `--blur-medium` (`3px`). Gli stati rapidi usano `--duration-quick` (`150ms`) o `--duration-fast` (`250ms`); `--duration-stagger` è `40ms` ed è disponibile per sequenze brevi.

Con `prefers-reduced-motion: reduce`, lo scroll torna immediato, la rotta è già disegnata, l’arrivo non si anima e tutte le altre animazioni/transizioni scendono a `0.01ms` con una sola iterazione.

### Accessibility

Ogni pagina espone `#main-content` e il layout fornisce uno skip link. Il focus globale è un outline da `2px` con offset `3px`; i controlli condivisi aggiungono `focus-visible:ring-3`. Mantieni landmark e heading semantici, label reali, `aria-invalid`, errori con `role="alert"`, focus sul primo campo errato, nomi accessibili per le azioni a icona e `aria-hidden` sugli SVG decorativi. Il chart usa `accessibilityLayer`; touch target e `touch-action: manipulation` sono già globali.

## Elevation & Depth

La profondità è ibrida ma contenuta: contrasto tonale e ring sottili definiscono quasi tutte le superfici; le ombre compaiono solo su elementi sollevati o fortemente distintivi.

### Shadow Vocabulary

- **Card base** (`shadow-sm ring-1 ring-foreground/5`): card e pannelli quieti.
- **Surface signal** (`.surface-shadow`): `0 16px 42px -28px oklch(0.18 0.025 260 / 0.35), 0 2px 8px -5px oklch(0.18 0.025 260 / 0.2)` per la metric strip.
- **Routing demo:** `0 24px 80px -48px oklch(0.18 0.025 260 / 0.65)` con ring `foreground/5`.
- **Overlay e codice:** `shadow-lg` o `shadow-xl` per dialog, toast e blocchi di codice inversi.

**The Flat-by-Default Rule.** Prima usa `bg-card`, `bg-muted`, bordi o `ring-foreground/5`; aggiungi un’ombra solo quando la superficie deve emergere dal piano.

## Shapes

Il raggio base è `--radius: 0.625rem`; `--radius-sm` fino a `--radius-4xl` sono moltiplicatori reali del token. La silhouette dominante è `rounded-2xl`: bottoni, badge, input, alert, empty state, code block, routing module e metric strip. Elementi più compatti usano `rounded-xl` o `rounded-lg`; card e dialog usano `rounded-[min(var(--radius-4xl),24px)]`.

I bordi sono sottili e semantici: `border-border` per controlli outline, `divide-y` per liste, `border-b` per sezioni e `ring-foreground/5` per superfici senza bordo visibile. I nodi del percorso sono cerchi pieni; non introdurre altre geometrie decorative.

## Components

### Routing demo

È il pattern firma del sistema. Una card bianca con titolo “Banco di routing” mostra URL in ingresso, SVG `.routing-path`, short link in cobalto e conteggio secondario con `.signal-dot`. Mantieni l’ordine ingresso → linea → etichetta/risultato e usa dati esplicitamente dimostrativi.

### Metric strip

`MetricStrip` è una superficie cobalto `rounded-2xl` con percorso SVG in trasparenza, tre celle da `min-h-36`, valori `.metric` e separatori al 15%. In mobile le celle sono verticali; da `md` sono tre colonne. Usala per 2–3 KPI realmente disponibili, non per riempire il layout.

### Shell della console

`AppShell` usa `Sidebar variant="inset" collapsible="icon"`, navigazione con icona e label, stato attivo derivato dal pathname, footer account e top bar sticky `h-14 bg-background/90 backdrop-blur-md`. Il contenuto mantiene `p-4 sm:p-6 lg:p-8` e header di pagina con titolo, descrizione e una sola azione principale.

### Auth

Desktop split: form bianco `max-w-md` a sinistra, manifesto ink con linea di rotta a destra; sotto `lg` resta solo il form. Titolo e helper sono diretti, la validazione porta il focus al primo errore e l’errore generale è un blocco `bg-destructive/10`. Mantieni la semplicità vicina a Kinde: nessun social proof o claim non verificato.

### Documentation

Header sobrio, indice sticky su desktop e `<details>` nativo su mobile. Il corpo arriva a `max-w-4xl`; sezioni con `border-b py-12`, testo a `max-w-[68ch]`, endpoint in tabella e snippet inversi `bg-foreground text-background` con overflow orizzontale. La docs deve mostrare la stessa operazione disponibile nella GUI.

### Buttons, fields and feedback

- I bottoni condivisi sono `rounded-2xl text-sm font-medium duration-150`; il primary è cobalto, outline resta sul canvas, secondary è tenue, ghost compare in navigazione, destructive usa tinta rossa. `active` scende di `1px`; disabled è al 50%.
- Gli input sono `h-8 rounded-2xl bg-input/50`, con bordo trasparente a riposo e ring cobalto al focus. I form usano `FieldGroup` con `gap-6`, descrizione prima dell’errore e `type="date"` nativo per la scadenza.
- Card, tabelle, badge, empty state, skeleton, alert, dialog e toast provengono da `@workspace/ui`; estendi le loro varianti prima di creare componenti paralleli.
- I feedback nominano l’esito (“Link creato”, “API key revocata”), mostrano spinner durante le mutation e distinguono loading, empty, error e success.

### Copy

Scrivi in italiano, concreto e operativo. Titoli brevi; descrizioni spiegano cosa succede dopo; CTA con verbo (“Crea link”, “Copia”, “Revoca”); errori dicono cosa non è riuscito e il prossimo passo. Usa “dashboard” e “API” come due ingressi equivalenti. Non inventare benchmark, clienti, garanzie o claim commerciali; i dati di esempio devono dichiararsi demo.

### Extension points

- Per nuovi stati o superfici, usa prima i token semantici `background`, `card`, `muted`, `secondary`, `accent`, `destructive`, `border`, `input` e `ring` già presenti.
- Per serie analytics future, `--chart-2`…`--chart-5` esistono già; `--chart-1` resta la serie click corrente.
- Per nuove animazioni di percorso, componi i token `--duration-*`, `--distance-medium`, `--blur-medium` e `--ease-smooth-out`, mantenendo il blocco reduced-motion.
- Per nuovi flussi, implementa prima la stessa capacità nella GUI e nella docs API; riusa `Card`, `Field`, `Button`, `Alert`, `Empty` e `Skeleton` per tutti gli stati.

## Do's and Don'ts

### Do

- **Do** preserva la tesi URL lungo → rotta → etichetta breve tracciabile e il seed `32c338c9`.
- **Do** usa carta, ink e cobalto come masse principali; riserva il corallo ai segnali piccoli.
- **Do** mantieni la parità GUI/API visibile nella navigazione, nel copy e negli esempi.
- **Do** usa `max-w-*`, `text-balance`, `text-pretty`, `truncate` e `overflow-x-auto` per leggibilità reale.
- **Do** lascia sempre stati loading, empty, error, disabled e success accessibili.

### Don't

- **Don't** trasformare il hero in una griglia SaaS di numeri decorativi o card senza funzione.
- **Don't** usare monospace per titoli o testo narrativo, né corallo come CTA estesa.
- **Don't** aggiungere gradienti ornamentali, glassmorphism pesante, ombre diffuse ovunque o nuovi raggi fuori scala.
- **Don't** nascondere URL, chiavi o codice con font minuscoli: tronca dove serve e offri overflow o copia.
- **Don't** creare un componente locale quando una variante di `@workspace/ui` copre già il caso.
- **Don't** promettere dark mode finché non esiste un controllo utente, né fabbricare prove sociali o risultati.
