<p align="center">
  <img src="assets/bug-mate-logo.png" width="180" alt="Bug-Mate logo"/>
</p>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=1000&color=4ADE80&center=true&vCenter=true&width=300&lines=Bug-Mate"/>
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=1000&color=16A34A&center=true&vCenter=true&width=300&lines=Bug-Mate" alt="Bug-Mate"/>
  </picture>
</h1>

<p align="center">
  <strong>Bot de soporte con IA para WhatsApp — 100% configurable por JSON, sin tocar código.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white"/>
</p>

<p align="center">
  <a href="#guía-para-no-técnicos">Guía rápida</a> ·
  <a href="#inicio-rápido">Inicio rápido</a> ·
  <a href="#configuración-del-bot">Configuración</a> ·
  <a href="#flujos-condicionales">Flujos</a> ·
  <a href="#base-de-conocimiento">Base de conocimiento</a> ·
  <a href="#arquitectura">Arquitectura</a>
</p>

---

> [!WARNING]
> **Aviso importante — uso de WhatsApp**
>
> BugMate utiliza [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), una librería no oficial que automatiza WhatsApp Web mediante Puppeteer. **No está afiliada ni respaldada por Meta/WhatsApp.**
>
> El uso de bots automatizados puede violar los [Términos de Servicio de WhatsApp](https://www.whatsapp.com/legal/terms-of-service). En consecuencia, **los números de teléfono utilizados podrían ser suspendidos o baneados permanentemente** sin previo aviso.
>
> **Al clonar o utilizar este proyecto, aceptás estos riesgos y asumís total responsabilidad** por el uso que hagas del mismo. Los autores no se hacen responsables por cuentas bloqueadas, pérdida de datos ni ningún otro perjuicio derivado del uso de esta herramienta.
>
> Se recomienda usar un **número de WhatsApp dedicado** (no tu número personal ni el de producción de tu empresa) para operar el bot.

---

## Guía para no técnicos

> Esta sección es para vos si nunca instalaste un bot o no sabés programar. Seguí los pasos en orden y en 20 minutos tenés BugMate funcionando.

### ¿Qué es BugMate?

BugMate es un bot de WhatsApp que atiende a tus clientes automáticamente. Cuando un cliente te escribe, el bot:

- Lo saluda y le da opciones para elegir
- Si reporta un error → lo registra y te avisa por WhatsApp + crea una tarjeta en Trello
- Si tiene una consulta → responde usando los documentos de tu sistema con IA
- Si quiere hablar con alguien → te avisa directamente

Vos configurás todo sin tocar código — solo editás archivos de texto (JSON).

---

### Paso 1 — Instalar los programas necesarios

Necesitás instalar tres cosas. Hacé click en cada link y seguí las instrucciones de instalación:

1. **Node.js** → [nodejs.org](https://nodejs.org) — elegí la versión "LTS" (la recomendada)
2. **Git** → [git-scm.com/downloads](https://git-scm.com/downloads) — necesario para descargar el proyecto
3. **Un editor de texto** → recomendamos [Visual Studio Code](https://code.visualstudio.com/) — para editar los archivos de configuración

Después de instalar Node.js, abrí una terminal (en Windows: buscá "cmd" o "PowerShell" en el menú Inicio) y verificá que quedó bien:

```
node --version
```

Tiene que aparecer algo como `v22.0.0`. Si aparece un número, está perfecto.

---

### Paso 2 — Descargar el proyecto

En la terminal, ejecutá estos comandos uno por uno:

```bash
git clone https://github.com/tu-org/bug-mate.git
cd bug-mate
npm install
```

El último comando puede tardar un par de minutos — está descargando las dependencias. Es normal.

---

### Paso 3 — Elegir el proveedor de IA

BugMate necesita una IA para responder preguntas. Tenés dos opciones:

**Opción A — Gemini (Google) ✅ Recomendado para empezar**
- Es gratis para uso básico
- Funciona en la nube — no necesitás una PC potente
- Cómo obtener tu clave gratuita:
  1. Entrá a [aistudio.google.com](https://aistudio.google.com)
  2. Iniciá sesión con tu cuenta de Google
  3. Hacé click en **"Get API Key"** → **"Create API Key"**
  4. Copiá la clave que aparece (algo como `AIzaSy...`)

**Opción B — Ollama (corre en tu computadora)**
- Completamente gratuito y privado — nada sale de tu PC
- Requiere una computadora con al menos 8GB de RAM
- Ver [instrucciones detalladas de Ollama](#ollama-local-open-source) más abajo

---

### Paso 4 — Crear el archivo de configuración `.env`

En la carpeta del proyecto, copiá el archivo de ejemplo:

- **Windows:** en la terminal escribí `copy .env.example .env`
- **Mac/Linux:** `cp .env.example .env`

Después abrí el archivo `.env` con el editor de texto y completá los valores:

```env
# Elegí "gemini" u "ollama"
AI_PROVIDER=gemini

# Si elegiste gemini, pegá acá tu clave de API de Google
GEMINI_API_KEY=AIzaSy...tu_clave_aqui

# Tu número de WhatsApp (sin el +, sin espacios)
# Ejemplo Argentina: 5491123456789
DEVELOPER_PHONE=5491123456789
```

Guardá el archivo.

---

### Paso 5 — Configurar el bot

Abrí el archivo `config/bot.config.json` con tu editor de texto. Ahí podés cambiar:

- **Nombre del bot** — campo `"name"` dentro de `"identity"`
- **Nombre de tu empresa** — campo `"company"`
- **Tu nombre** — campo `"developerName"` (aparece en los mensajes al cliente)

Por ejemplo:
```json
"identity": {
  "name": "MiBot",
  "company": "Mi Empresa S.A.",
  "developerName": "Juan"
}
```

---

### Paso 6 — Agregar tus clientes

Abrí el archivo `config/clients.json`. Si no existe, copiá el de ejemplo:
- **Windows:** `copy config\clients.example.json config\clients.json`
- **Mac/Linux:** `cp config/clients.example.json config/clients.json`

Editá el archivo con los datos de tus clientes:

```json
[
  {
    "phone": "5491123456789",
    "name": "María García",
    "company": "Empresa del Cliente S.A.",
    "systems": ["Nombre del sistema que usan"],
    "knowledgeDocs": ["nombre-del-archivo-de-conocimiento.md"],
    "trelloLists": {
      "bugs": "ID_DE_COLUMNA_BUGS"
    },
    "notes": "Cualquier nota interna"
  }
]
```

El campo `phone` es el número de WhatsApp del cliente, **sin el +** y sin espacios. Para Argentina sería `549` + el número celular.

> **Importante:** Este archivo contiene datos privados — nunca lo subas a GitHub. Ya está protegido por `.gitignore`.

---

### Paso 7 — Agregar conocimiento del sistema (opcional)

Si querés que el bot pueda responder preguntas sobre tu sistema, creá un archivo de texto con la documentación:

1. Creá un archivo `.md` o `.txt` en la carpeta `config/knowledge-docs/`
   - Ejemplo: `config/knowledge-docs/mi-sistema-knowledge.md`
2. Escribí ahí todo lo que el bot necesita saber: cómo funciona el sistema, errores comunes y sus soluciones, preguntas frecuentes, etc.
3. En `clients.json`, en el campo `knowledgeDocs` del cliente, poné el nombre de ese archivo:
   ```json
   "knowledgeDocs": ["mi-sistema-knowledge.md"]
   ```

El bot va a leer ese documento y podrá responder preguntas basándose en él.

---

### Paso 8 — Configurar Trello (opcional)

Si querés que el bot cree tarjetas en Trello automáticamente cuando un cliente reporta un error:

**8.1 — Obtener tus credenciales de Trello:**
1. Entrá a [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Hacé click en **"Crear un Power-Up"**, dale un nombre (ej. "BugMate") y guardá
3. Copiá el **API Key** que aparece
4. Hacé click en **"Token"**, autorizá la app, y copiá el **Token**

**8.2 — Agregá las credenciales al `.env`:**
```env
TRELLO_API_KEY=tu_api_key_aqui
TRELLO_TOKEN=tu_token_aqui
```

**8.3 — Descubrir los IDs de tus columnas:**

Primero iniciá el bot (Paso 9), configurá el grupo de control, y enviá el comando `!trello` desde ese grupo. El bot te va a responder con todos tus tableros y columnas con sus IDs.

**8.4 — Asignar columnas a cada cliente:**

En `clients.json`, agregá los IDs de las columnas de Trello de ese cliente:
```json
"trelloLists": {
  "bugs": "ID_de_la_columna_Bugs",
  "pendientes": "ID_de_la_columna_Pendientes"
}
```

---

### Paso 9 — Iniciar el bot

En la terminal, dentro de la carpeta del proyecto:

```bash
npm run start:dev
```

La primera vez va a aparecer un **código QR** en la terminal. Tenés que escanearlo con WhatsApp:

1. Abrí WhatsApp en tu celular
2. Tocá los tres puntitos (⋮) → **Dispositivos vinculados**
3. Tocá **"Vincular un dispositivo"**
4. Escaneá el QR que aparece en la terminal

Una vez escaneado, el bot está activo. Escribile desde otro número de WhatsApp y debería responder.

> **Nota:** El número de WhatsApp que escanea el QR es el número del bot — es el que va a responder a los clientes. Idealmente usá un número dedicado para el bot.

---

### Paso 10 — Configurar el grupo de control (opcional pero recomendado)

El grupo de control es un grupo de WhatsApp privado donde podés enviarle comandos al bot sin que los clientes lo vean.

1. Creá un grupo de WhatsApp (ej. "Control BugMate")
2. Agregá al grupo el número del bot
3. Enviá `!grupos` desde ese grupo — el bot te va a responder con el ID del grupo
4. Copiá ese ID y pegálo en el `.env`:
   ```env
   CONTROL_GROUP_ID=120363XXXXXXXXXX@g.us
   ```
5. Reiniciá el bot

Desde ese grupo podés usar comandos como `!estado`, `!sesiones`, `!trello`, etc.

---

### ¿Problemas comunes?

| Problema | Solución |
|---|---|
| El QR no aparece | Esperá 30 segundos, si no aparece reiniciá con `npm run start:dev` |
| El bot no responde | Verificá que el número del bot esté en línea en WhatsApp |
| Error "GEMINI_API_KEY not set" | Revisá que el `.env` tenga la clave correcta y sin espacios extra |
| Quiero cambiar el flujo | Editá `bot.config.json`, guardá, y reiniciá el bot |
| El bot no encuentra al cliente | Verificá que el `phone` en `clients.json` tenga el formato correcto (sin +) |
| Quiero re-indexar el conocimiento | Borrá el archivo `data/knowledge.sqlite` y reiniciá el bot |

---

## Índice

1. [Inicio rápido](#inicio-rápido)
2. [Variables de entorno](#variables-de-entorno)
3. [Proveedores de IA](#proveedores-de-ia)
4. [Configuración del bot (bot.config.json)](#configuración-del-bot)
   - [identity](#identity)
   - [greeting](#greeting)
   - [menu](#menu)
   - [Flujos condicionales](#flujos-condicionales)
   - [Flujos legacy](#flujos-legacy)
   - [Configuración de IA](#configuración-de-ia)
   - [humanDelay](#humandelay)
   - [media](#media)
   - [escalation](#escalation)
5. [DSL de flujos condicionales — Referencia completa](#dsl-de-flujos-condicionales)
   - [Tipos de pasos](#tipos-de-pasos)
   - [Variables del sistema](#variables-del-sistema)
   - [Acciones](#acciones)
   - [Ejemplo completo](#ejemplo-completo)
6. [Clientes (clients.json)](#clientes)
7. [Base de conocimiento](#base-de-conocimiento)
   - [FAQ (knowledge.json)](#faq)
   - [Documentos (knowledge-docs/)](#documentos)
   - [Filtrado por cliente](#filtrado-por-cliente)
8. [Integración con Trello](#integración-con-trello)
9. [Comandos del grupo de control](#comandos-del-grupo-de-control)
10. [Toma de control humana](#toma-de-control-humana)
11. [Diseñá tu propio bot](#diseñá-tu-propio-bot)
12. [Estructura de archivos](#estructura-de-archivos)
13. [Arquitectura](#arquitectura)

---

## Inicio rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/your-org/bug-mate.git
cd bug-mate
npm install

# 2. Configurar
cp .env.example .env
# Editá .env con tus datos

# 3. Ejecutar
npm run start:dev
# Escaneá el código QR con tu WhatsApp
```

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```env
# ── Proveedor de IA ─────────────────────────────────────────
# Qué proveedor usar: "gemini" u "ollama"
AI_PROVIDER=gemini

# ── Gemini (Google) ─────────────────────────────────────────
# Obtenés tu clave gratis en https://aistudio.google.com/app/apikey
GEMINI_API_KEY=tu_clave_aqui

# ── Ollama (local / open source) ────────────────────────────
OLLAMA_URL=http://localhost:11434
OLLAMA_AUTO_START=false

# ── Contacto del desarrollador ──────────────────────────────
# Tu número de WhatsApp (solo dígitos, sin + ni espacios)
# Argentina (+54): 5491123456789
DEVELOPER_PHONE=5491123456789

# ── Grupo de control (opcional) ─────────────────────────────
# ID del grupo de WhatsApp para enviarle comandos al bot.
# Ejecutá !grupos desde cualquier grupo para encontrar el ID.
# CONTROL_GROUP_ID=120363XXXXXXXXXX@g.us

# ── App ─────────────────────────────────────────────────────
PORT=3000
```

---

## Proveedores de IA

### Gemini (Google) — por defecto

- Configurá `AI_PROVIDER=gemini` y `GEMINI_API_KEY=...`
- Modelo por defecto: `gemini-2.0-flash`
- Modelo de embeddings: `text-embedding-004`
- Plan gratuito disponible en [aistudio.google.com](https://aistudio.google.com)

### Ollama (local, open source)

- Configurá `AI_PROVIDER=ollama`
- Instalá Ollama: [ollama.ai](https://ollama.ai)
- Descargá los modelos:
  ```bash
  ollama pull qwen3:8b          # modelo de chat
  ollama pull nomic-embed-text  # modelo de embeddings (requerido para la base de conocimiento)
  ```
- Configurá los modelos en `bot.config.json`:
  ```json
  "ai": {
    "model": "qwen3:8b",
    "embeddingModel": "nomic-embed-text"
  }
  ```

| | Gemini | Ollama |
|---|---|---|
| Costo | Plan gratuito (limitado) | Gratis (corre local) |
| Privacidad | Nube (Google) | 100% local |
| Velocidad | Rápido | Depende del hardware |
| Calidad | Alta | Depende del modelo |
| Requiere internet | Sí | No |

---

## Configuración del bot

Todo el comportamiento del bot se configura en `config/bot.config.json`. **No hay que modificar código** — alcanza con cambiar el JSON para deployar un bot completamente distinto.

### identity

```json
"identity": {
  "name": "BugMate",
  "company": "Tu Empresa",
  "developerName": "Nacho",
  "tone": "amigable, empático, profesional y conciso."
}
```

| Campo | Descripción |
|---|---|
| `name` | Nombre del bot que aparece en los mensajes |
| `company` | Nombre de la empresa usado en los templates |
| `developerName` | Nombre del dev que aparece en los mensajes de escalación |
| `tone` | Instrucción de tono inyectada en el system prompt de la IA |

### greeting

```json
"greeting": {
  "enabled": true,
  "message": "¡Hola {clientName}! Soy *{botName}* de *{company}*.",
  "unknownClientName": "👋",
  "sessionTimeoutMinutes": 30
}
```

- `{clientName}` → se resuelve desde `clients.json` por número de teléfono, o usa `unknownClientName` si no se encuentra
- `sessionTimeoutMinutes` → tiempo de inactividad antes de que la sesión se resetee y se vuelva a enviar el saludo

### menu

El menú principal que se muestra después del saludo.

```json
"menu": {
  "message": "Elegí una opción respondiendo con el número:",
  "invalidChoiceMessage": "No entendí tu respuesta.",
  "unrecognizedOptionMessage": "Opción no reconocida.",
  "options": [
    { "id": "1", "label": "Soy cliente", "conditionalFlowId": "clientFlow" },
    { "id": "2", "label": "Tengo una consulta", "conditionalFlowId": "prospectFlow" },
    { "id": "3", "label": "Contactar atención", "action": "ESCALATE" }
  ]
}
```

Cada opción puede usar uno de tres mecanismos de ruteo:

| Campo | Tipo | Descripción |
|---|---|---|
| `action` | `"ESCALATE"` \| `"SHOW_MENU"` | Acción integrada, no requiere flujo |
| `conditionalFlowId` | string | ID de un flujo condicional en el mapa `conditionalFlows` |
| `conditionalFlowStartStep` | string | Sobreescribe el `startStep` del flujo (opcional) |
| `flowId` | string | ID de un flujo legacy en el mapa `flows` |

**Bot mínimo — solo saludo:** Configurá `"options": []` y el bot únicamente saludará y esperará. El dev puede tomar el control manualmente via toma de control humana.

---

## Flujos condicionales

El sistema de flujos condicionales es la forma recomendada para construir conversaciones complejas con ramificaciones. Usa un **grafo de pasos nombrados** — cada paso tiene un ID y declara a dónde ir después.

```json
"conditionalFlows": {
  "miFlow": {
    "startStep": "primerPaso",
    "steps": {
      "primerPaso": { ... },
      "segundoPaso": { ... }
    }
  }
}
```

Los flujos se disparan desde una opción del menú:

```json
{ "id": "1", "label": "Soy cliente", "conditionalFlowId": "clientFlow" }
```

---

## DSL de flujos condicionales

### Tipos de pasos

#### `input` — Recolectar texto del usuario

Envía un prompt y espera la respuesta del usuario. La respuesta se guarda en `flowData`.

```json
{
  "type": "input",
  "prompt": "¿Cuál es tu consulta?",
  "saveAs": "userQuery",
  "acceptMedia": false,
  "mediaFallback": "[archivo adjunto]",
  "nextStep": "siguientePaso"
}
```

| Campo | Requerido | Descripción |
|---|---|---|
| `prompt` | ✅ | Texto enviado al usuario. Soporta interpolación `{variable}`. |
| `saveAs` | ✅ | Clave en `flowData` donde se guarda la respuesta |
| `acceptMedia` | ❌ | Si se aceptan imágenes/audio (por defecto: false) |
| `mediaFallback` | ❌ | Texto guardado cuando se recibe media en vez de texto |
| `nextStep` | ✅ | ID del siguiente paso o `"END"` |

---

#### `menu` — Mostrar opciones numeradas

Muestra una lista numerada y rutea según la elección del usuario.

```json
{
  "type": "menu",
  "message": "¿En qué te puedo ayudar?",
  "options": [
    { "id": "1", "label": "Reportar error", "nextStep": "pedirDescripcion" },
    { "id": "2", "label": "Hablar con desarrollo", "action": "ESCALATE", "notification": "..." }
  ],
  "invalidMessage": "Por favor elegí una opción válida."
}
```

Cada opción puede tener:

| Campo | Descripción |
|---|---|
| `id` | Número o texto que el usuario escribe para seleccionar esta opción |
| `label` | Texto mostrado en el menú |
| `nextStep` | Paso al que navegar |
| `action` | Acción terminal (`ESCALATE`, `END`, `SHOW_MENU`, `NOTIFY_DEVELOPER`) |
| `notification` | Template de notificación al desarrollador (usado con `ESCALATE` o `NOTIFY_DEVELOPER`) |

---

#### `validate` — Validar input contra una fuente de datos

Verifica una variable recolectada previamente contra una fuente de datos. Rutea a `onMatch` o `onNoMatch` según el resultado.

Fuente de datos soportada actualmente: `"clients"` (desde `clients.json`).

La coincidencia es difusa: case-insensitive, elimina sufijos legales (S.A., S.R.L., etc.), verifica los campos `name` y `company`. También coincide por número de teléfono exacto.

```json
{
  "type": "validate",
  "dataSource": "clients",
  "inputVar": "clientInput",
  "onMatch": {
    "saveAs": "matchedClient",
    "nextStep": "clientMenu"
  },
  "onNoMatch": {
    "message": "No encontré tu empresa. Voy a notificar a {developerName}.",
    "action": "ESCALATE",
    "notification": "⚠️ Empresa no encontrada: {clientInput} — {senderPhone}"
  }
}
```

Cuando se encuentra una coincidencia, el registro completo del cliente se guarda como objeto bajo `saveAs`. Luego podés usar `{matchedClient.name}`, `{matchedClient.company}`, `{matchedClient.phone}`, etc. en cualquier template siguiente.

---

#### `message` — Enviar un mensaje estático + acción opcional

Envía un mensaje y opcionalmente dispara un efecto secundario (notificar al dev, escalar, terminar el flujo).

```json
{
  "type": "message",
  "text": "✅ Reporte registrado. ¡Gracias! 🙏",
  "action": "NOTIFY_DEVELOPER",
  "notification": "🐛 Error de {matchedClient.name}: {errorDescription}",
  "nextStep": "END"
}
```

| Campo | Requerido | Descripción |
|---|---|---|
| `text` | ✅ | Mensaje enviado al usuario. Soporta interpolación `{variable}`. |
| `action` | ❌ | Efecto secundario disparado después del mensaje |
| `notification` | ❌ | Template de notificación al desarrollador |
| `nextStep` | ✅ | ID del siguiente paso o `"END"` |

---

#### `ai` — Respuesta con IA y RAG opcional

Envía un prompt de entrada, luego procesa la consulta del usuario con el proveedor de IA, opcionalmente buscando en la base de conocimiento primero.

```json
{
  "type": "ai",
  "inputPrompt": "Contame tu consulta:",
  "textOnlyMessage": "Por favor escribí tu consulta con texto.",
  "useKnowledge": true,
  "systemPromptOverride": "Sos un asistente de soporte de {company}...",
  "ragContextInstruction": "Respondé de forma natural y conversacional.",
  "fallbackToEscalation": true,
  "noResultMessage": "No encontré información. Voy a notificar a {developerName}.",
  "noResultNotification": "❓ Consulta sin respuesta: {userQuery}",
  "continuePrompt": "¿Hay algo más en lo que pueda ayudarte?",
  "saveQueryAs": "userQuery",
  "nextStep": "END"
}
```

| Campo | Descripción |
|---|---|
| `useKnowledge` | Buscar en la base de conocimiento antes de llamar a la IA |
| `systemPromptOverride` | System prompt personalizado solo para este paso |
| `ragContextInstruction` | Instrucción adicional al system prompt cuando se encuentra un resultado |
| `fallbackToEscalation` | Escalar al dev cuando no hay resultado en la base de conocimiento |
| `noResultMessage` | Mensaje al usuario cuando no hay resultado |
| `noResultNotification` | Notificación al dev cuando no hay resultado |
| `saveQueryAs` | Clave en `flowData` donde se guarda la consulta del usuario (por defecto: `userQuery`) |
| `continuePrompt` | Mensaje enviado después de una respuesta exitosa de la IA |

> **Nota:** Si el cliente no tiene `knowledgeDocs` configurado en `clients.json`, la búsqueda en la base de conocimiento se omite completamente y el paso cae directamente en escalación. Esto evita que clientes accedan a documentación de otros sistemas.

---

### Variables del sistema

Estas variables están siempre disponibles en cualquier template (sintaxis `{variable}`):

| Variable | Valor |
|---|---|
| `{senderPhone}` | Número de teléfono del usuario (solo dígitos, sin sufijo) |
| `{clientName}` | Nombre del cliente desde `clients.json`, o el emoji `unknownClientName` |
| `{timestamp}` | Fecha y hora actual (zona horaria Argentina) |
| `{flowPath}` | Breadcrumb de pasos visitados, ej. `askClientName → validateClient → clientMenu` |
| `{developerName}` | Desde `identity.developerName` |
| `{company}` | Desde `identity.company` |
| `{botName}` | Desde `identity.name` |

Más cualquier variable recolectada via `saveAs` en pasos `input`, y acceso con notación punto a objetos de pasos `validate` (ej. `{matchedClient.name}`, `{matchedClient.company}`).

---

### Acciones

| Acción | Descripción |
|---|---|
| `END` | Termina el flujo, devuelve la sesión a IDLE |
| `ESCALATE` | Envía `escalation.clientMessage` al usuario + `notification` al dev. El bot deja de responder (estado: ESCALATED) |
| `NOTIFY_DEVELOPER` | Envía `notification` al dev, continúa el flujo normalmente |
| `SHOW_MENU` | Termina el flujo y vuelve a mostrar el menú principal |

---

### Ejemplo completo

Flujo de soporte con validación de cliente:

```json
"conditionalFlows": {
  "clientFlow": {
    "startStep": "askClientName",
    "steps": {

      "askClientName": {
        "type": "input",
        "prompt": "Ingresá tu nombre o empresa para verificar tu cuenta:",
        "saveAs": "clientInput",
        "nextStep": "validateClient"
      },

      "validateClient": {
        "type": "validate",
        "dataSource": "clients",
        "inputVar": "clientInput",
        "onMatch": {
          "saveAs": "matchedClient",
          "nextStep": "clientMenu"
        },
        "onNoMatch": {
          "message": "No encontré tu empresa. Voy a notificar a {developerName}.",
          "action": "ESCALATE",
          "notification": "⚠️ Empresa no encontrada\n\nTeléfono: {senderPhone}\nIngresó: {clientInput}\nHora: {timestamp}"
        }
      },

      "clientMenu": {
        "type": "menu",
        "message": "¡Hola {matchedClient.name}! ¿En qué te ayudo?",
        "options": [
          { "id": "1", "label": "Reportar error", "nextStep": "askError" },
          { "id": "2", "label": "Consulta técnica", "nextStep": "aiQuery" },
          { "id": "3", "label": "Hablar con desarrollo", "action": "ESCALATE",
            "notification": "👨‍💻 Solicitud de {matchedClient.name} ({matchedClient.company}) — {senderPhone}" }
        ],
        "invalidMessage": "Elegí una opción del 1 al 3."
      },

      "askError": {
        "type": "input",
        "prompt": "Describí el error:",
        "saveAs": "errorDescription",
        "nextStep": "askScreenshot"
      },

      "askScreenshot": {
        "type": "input",
        "prompt": "¿Captura de pantalla? Sino escribí *no tengo*.",
        "saveAs": "errorScreenshot",
        "acceptMedia": true,
        "mediaFallback": "[imagen adjunta]",
        "nextStep": "confirmError"
      },

      "confirmError": {
        "type": "message",
        "text": "✅ Reporte registrado. Te contactamos a la brevedad. 🙏",
        "action": "NOTIFY_DEVELOPER",
        "notification": "🐛 Error de {matchedClient.name} ({matchedClient.company})\nTeléfono: {senderPhone}\nDescripción: {errorDescription}\nCaptura: {errorScreenshot}\nHora: {timestamp}\nRuta: {flowPath}",
        "nextStep": "END"
      },

      "aiQuery": {
        "type": "ai",
        "inputPrompt": "Contame tu consulta:",
        "textOnlyMessage": "Por favor escribí tu consulta con texto.",
        "useKnowledge": true,
        "fallbackToEscalation": true,
        "noResultMessage": "No encontré información. Voy a notificar a {developerName}.",
        "noResultNotification": "❓ Consulta sin respuesta\nCliente: {matchedClient.name}\nConsulta: {userQuery}",
        "continuePrompt": "¿Algo más en lo que pueda ayudarte?",
        "nextStep": "END"
      }
    }
  }
}
```

---

## Flujos legacy

El sistema de flujos original sigue siendo compatible. Útil para casos de uso simples y directos.

### Flujo guiado — preguntas secuenciales

Hace preguntas de a una, recolecta las respuestas, luego notifica al dev.

```json
"flows": {
  "reportError": {
    "type": "guided",
    "steps": [
      { "key": "description", "prompt": "Describí el error:" },
      { "key": "screenshot", "prompt": "¿Captura de pantalla?" }
    ],
    "noMediaFallback": "No adjuntó captura",
    "confirmationMessage": "Reporte registrado. ¡Gracias! 🙏",
    "developerNotification": "🐛 Error de {clientName} ({clientPhone})\n{description}\n{screenshot}"
  }
}
```

### Flujo AI — respuesta única con IA

```json
"flows": {
  "queryKnowledge": {
    "type": "ai",
    "inputPrompt": "Contame tu consulta:",
    "textOnlyMessage": "Por favor escribí tu consulta con texto.",
    "useKnowledge": true,
    "fallbackToEscalation": true,
    "noResultMessage": "No encontré información. Notifico a {developerName}.",
    "noResultDeveloperNotification": "❓ Sin respuesta: {query} — {clientPhone}",
    "continuePrompt": "¿Algo más?"
  }
}
```

---

## Configuración de IA

```json
"ai": {
  "model": "gemini-2.0-flash",
  "embeddingModel": "text-embedding-004",
  "systemPrompt": "Sos BugMate, asistente de soporte de {company}...",
  "ragMinScore": 0.72,
  "ragTopK": 3,
  "fallbackToEscalation": true,
  "maxHistoryMessages": 10
}
```

| Campo | Descripción |
|---|---|
| `model` | Nombre del modelo de chat (específico del proveedor) |
| `embeddingModel` | Modelo de embeddings para búsqueda vectorial |
| `systemPrompt` | System prompt global. Soporta `{company}`, `{developerName}`, `{botName}`, `{tone}` |
| `ragMinScore` | Puntaje mínimo de similitud coseno (0–1) para aceptar un resultado |
| `ragTopK` | Cantidad de chunks a recuperar en la búsqueda vectorial |
| `fallbackToEscalation` | Por defecto global: escalar cuando la IA no encuentra resultado |
| `maxHistoryMessages` | Cantidad de pares de mensajes guardados en el historial para contexto de la IA |

---

## humanDelay

Simula el comportamiento humano de tipeo.

```json
"humanDelay": {
  "enabled": true,
  "readingDelayMinMs": 1000,
  "readingDelayMaxMs": 3500,
  "minDelayMs": 2000,
  "maxDelayMs": 12000,
  "msPerCharacter": 55
}
```

| Campo | Descripción |
|---|---|
| `enabled` | Activar/desactivar todos los delays |
| `readingDelayMinMs` / `readingDelayMaxMs` | Delay aleatorio antes de empezar a tipear (simula lectura) |
| `minDelayMs` / `maxDelayMs` | Rango de clampeo del delay de tipeo |
| `msPerCharacter` | Velocidad de tipeo — multiplicado por la longitud de la respuesta |

---

## media

```json
"media": {
  "processImages": true,
  "processAudio": true,
  "imagePrompt": "Analizá esta imagen...",
  "audioPrompt": "Transcribí exactamente el audio en español.",
  "unsupportedMessage": "Recibí tu {mediaType}, pero no puedo procesarlo. ¿Podés describirlo?"
}
```

Con `processImages: true`, las imágenes recibidas por el bot son analizadas por la IA usando `imagePrompt` y la descripción se usa como el mensaje del usuario. Lo mismo aplica para audio con `audioPrompt`.

---

## escalation

Se dispara cuando el usuario escribe una keyword de la lista, o cuando un paso del flujo usa `action: "ESCALATE"`.

```json
"escalation": {
  "keywords": ["hablar con alguien", "soporte humano", "quiero hablar con una persona"],
  "clientMessage": "Voy a notificar a *{developerName}* para que te contacte. 🙏",
  "developerNotification": "🔔 Solicitud de soporte\n{clientName} ({clientPhone})\n\"{message}\"",
  "alreadyEscalatedMessage": "Tu consulta ya fue enviada a {developerName}. 🙏"
}
```

Después de la escalación el bot deja de responderle al usuario (estado: `ESCALATED`). Usá `!reactivar <teléfono>` desde el grupo de control para reactivarlo.

---

## Clientes

`config/clients.json` — array de clientes conocidos usado para validación y filtrado de conocimiento:

```json
[
  {
    "phone": "5491123456789",
    "name": "María García",
    "company": "Empresa S.A.",
    "systems": ["Sistema de Facturación"],
    "knowledgeDocs": ["empresa-knowledge.md"],
    "trelloLists": {
      "bugs": "ID_columna_bugs",
      "pendientes": "ID_columna_pendientes"
    },
    "notes": "Usuaria principal del módulo de facturación"
  }
]
```

| Campo | Descripción |
|---|---|
| `phone` | Teléfono en formato internacional (solo dígitos, sin +) |
| `name` | Nombre del cliente — usado en `{clientName}` y `{matchedClient.name}` |
| `company` | Nombre de la empresa — usado en `{matchedClient.company}` y para la validación difusa |
| `systems` | Lista de sistemas que usa este cliente (informativo) |
| `knowledgeDocs` | Archivos de conocimiento que este cliente puede consultar (ver abajo) |
| `trelloLists` | IDs de columnas de Trello por nombre lógico (ej. `"bugs"`, `"pendientes"`) — cada cliente apunta a su propio tablero |
| `notes` | Notas internas (no se muestran al usuario) |

El paso `validate` coincide contra `name` y `company` usando matching difuso (case-insensitive, elimina S.A./S.R.L. etc), y también coincide por número de teléfono exacto.

> El archivo `clients.json` está en `.gitignore` para proteger los datos de tus clientes. Usá `clients.example.json` como plantilla.

---

## Base de conocimiento

### FAQ

`config/knowledge.json` — respuestas instantáneas por palabras clave (sin costo de IA):

```json
[
  {
    "id": "reset-password",
    "question": "¿Cómo reseteo mi contraseña?",
    "tags": ["contraseña", "password", "resetear", "olvidé"],
    "answer": "Para resetear tu contraseña, seguí estos pasos:",
    "steps": [
      "Ir a la pantalla de login",
      "Hacer click en 'Olvidé mi contraseña'",
      "Ingresar tu email y seguir las instrucciones"
    ]
  }
]
```

El matching de FAQ verifica si la consulta del usuario contiene algún `tag` o los primeros 20 caracteres de `question`. Retorna score 1.0 — no requiere embeddings.

### Documentos

Colocá archivos `.md` o `.txt` en `config/knowledge-docs/`. Se indexan automáticamente al iniciar:

1. El texto se divide en chunks (~500 palabras cada uno)
2. Cada chunk se embeddea via el `embeddingModel` configurado
3. Los vectores se guardan en `data/knowledge.sqlite`
4. En las consultas, se calcula similitud coseno contra los chunks almacenados

**Tips para mejores resultados:**
- Usá líneas en blanco entre temas — el chunker divide por saltos de línea
- Preferí títulos descriptivos en vez de genéricos ("Cómo crear una orden" vs "Sección 3")
- Evitá tablas complejas — convertílas a prosa
- Si actualizás un documento, borrá `data/knowledge.sqlite` y reiniciá para re-indexar

**Para convertir un documento Word:** Guardalo como texto plano (`.txt`) o copiá el contenido en un archivo `.md` en `knowledge-docs/`.

### Filtrado por cliente

Cada cliente puede estar restringido a consultar únicamente su propia documentación via el campo `knowledgeDocs` en `clients.json`:

```json
{
  "name": "Ignacio Becher",
  "company": "Cima Tecno",
  "knowledgeDocs": ["cima-knowledge.md"]
}
```

**Comportamiento:**
- Cliente con `knowledgeDocs` con archivos → solo busca en esos archivos
- Cliente con `knowledgeDocs: []` (vacío) → sin búsqueda, escala al dev
- Cliente sin campo `knowledgeDocs` → sin búsqueda, escala al dev

Esto garantiza que los clientes no puedan acceder a documentación de los sistemas de otras empresas.

Para agregar conocimiento a un nuevo cliente:
1. Creá `config/knowledge-docs/cima-knowledge.md`
2. Agregá `"knowledgeDocs": ["cima-knowledge.md"]` a ese cliente en `clients.json`
3. Borrá `data/knowledge.sqlite` y reiniciá para re-indexar

---

## Integración con Trello

BugMate puede crear tarjetas en Trello automáticamente cuando un cliente reporta un error. Las tarjetas se crean en las columnas de tus tableros **ya existentes** — el bot nunca crea tableros ni columnas.

### Configuración

**Paso 1 — Obtener credenciales (2 minutos):**
1. Entrá a [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Creá un Power-Up (ej. "BugMate Bot") → copiá el `API Key`
3. Hacé click en "Token" → autorizá → copiá el `Token`

**Paso 2 — Agregar al `.env`:**
```env
TRELLO_API_KEY=tu_api_key
TRELLO_TOKEN=tu_token
```

**Paso 3 — Descubrir IDs de columnas:**

Enviá `!trello` desde el grupo de control. El bot responde con todos tus tableros y columnas:

```
📋 Tableros y columnas de Trello

📌 Mi Tablero de Desarrollo
  • Por hacer      ID: `abc123`
  • En progreso    ID: `def456`
  • Hecho          ID: `ghi789`
```

**Paso 4 — Habilitá Trello en `bot.config.json`:**
```json
"trello": {
  "enabled": true
}
```

**Paso 5 — Asigná las columnas a cada cliente en `clients.json`:**
```json
{
  "name": "María García",
  "company": "Empresa S.A.",
  "trelloLists": {
    "bugs": "abc123",
    "pendientes": "def456"
  }
}
```

Cada cliente puede tener sus propias columnas en su propio tablero. Solo necesitás el ID de la columna — no el del tablero.

### Crear una tarjeta desde un flujo

Agregá `trelloCard` a cualquier paso `message`. El campo `listId` soporta interpolación — usá `{matchedClient.trelloLists.bugs}` para apuntar automáticamente a la columna del cliente que está chateando:

```json
{
  "type": "message",
  "text": "✅ Reporte registrado. Te contactamos a la brevedad. 🙏",
  "action": "NOTIFY_DEVELOPER",
  "notification": "🐛 Error de {matchedClient.name}: {errorDescription}",
  "trelloCard": {
    "listId": "{matchedClient.trelloLists.bugs}",
    "title": "🐛 [{matchedClient.company}] {errorDescription}",
    "description": "**Cliente:** {matchedClient.name}\n**Teléfono:** {senderPhone}\n**Error:** {errorDescription}\n**Captura:** {errorScreenshot}\n**Hora:** {timestamp}"
  },
  "nextStep": "END"
}
```

El `listId`, `title` y `description` soportan interpolación `{variable}` igual que el resto del DSL.

> Si Trello no está configurado (`TRELLO_API_KEY` ausente) o el cliente no tiene `trelloLists`, la tarjeta se omite silenciosamente — el flujo continúa normalmente.

---

## Comandos del grupo de control

Creá un grupo de WhatsApp, agregá el número del bot, y configurá `CONTROL_GROUP_ID` en `.env`. Todos los comandos responden **directamente en el chat del grupo** — no necesitás revisar la consola para monitorear el bot.

| Comando | Descripción |
|---|---|
| `!ayuda` | Lista todos los comandos disponibles con su estado actual |
| `!estado` | Estado del bot: uptime, proveedor IA, sesiones activas, senders pausados |
| `!sesiones` | Lista todas las sesiones activas con flujo, paso actual y última actividad |
| `!flujos` | Lista todos los flujos configurados (condicionales y legacy) con sus pasos |
| `!pausar <teléfono>` | Pausa el bot para un número (tomás el control manualmente) |
| `!reactivar <teléfono>` | Reactiva el bot para un número |
| `!grupos` | Lista todos los grupos de WhatsApp en los que está el bot (con sus IDs) |
| `!trello` | Lista todos los tableros y columnas de Trello con sus IDs para configurar |

**Para encontrar tu group ID:** Enviá `!grupos` desde cualquier grupo donde esté el bot — va a responder con todos los nombres e IDs.

**Notificaciones automáticas en el grupo:**
- Cuando el dev toma control de una conversación manualmente → `⏸️ Bot pausado para 549XXXXXX`
- Cuando un cliente escala a humano → notificación al dev
- Cuando se crea una tarjeta en Trello (si está habilitado el log en consola)

---

## Toma de control humana

Cuando respondés manualmente a un cliente desde el número de WhatsApp del bot:

1. El bot **se pausa automáticamente** para esa conversación
2. Se envía una notificación al grupo de control (si está configurado): `⏸️ Bot pausado para 549XXXXXX`
3. Para reactivarlo: enviá `!reactivar 549XXXXXX` desde el grupo de control

El bot permanece pausado aunque el cliente envíe más mensajes — solo se reactiva cuando ejecutás `!reactivar`.

---

## Diseñá tu propio bot

BugMate es completamente configurable — podés deployar bots completamente distintos con solo editar los archivos JSON, sin cambiar nada de código.

### Bot mínimo — solo saludo

Configurá `options: []` en el menú. El bot saludará a cada usuario nuevo y esperará. Vos manejás las conversaciones manualmente via toma de control humana.

```json
"menu": {
  "message": "",
  "invalidChoiceMessage": "",
  "unrecognizedOptionMessage": "",
  "options": []
}
```

### Bot de reporte simple — sin validación

```json
"conditionalFlows": {
  "simpleReport": {
    "startStep": "ask",
    "steps": {
      "ask": {
        "type": "input",
        "prompt": "Describí tu problema:",
        "saveAs": "problem",
        "nextStep": "done"
      },
      "done": {
        "type": "message",
        "text": "¡Recibido! Te contactamos pronto.",
        "action": "NOTIFY_DEVELOPER",
        "notification": "📩 Nuevo reporte\nTeléfono: {senderPhone}\nProblema: {problem}\nHora: {timestamp}",
        "nextStep": "END"
      }
    }
  }
}
```

### Chat con IA directa — sin base de conocimiento

```json
"conditionalFlows": {
  "directAI": {
    "startStep": "chat",
    "steps": {
      "chat": {
        "type": "ai",
        "inputPrompt": "¿En qué puedo ayudarte?",
        "textOnlyMessage": "Por favor escribí tu consulta.",
        "useKnowledge": false,
        "continuePrompt": "¿Algo más?",
        "nextStep": "END"
      }
    }
  }
}
```

### Soporte completo — validación + submenú + IA + filtrado de conocimiento

Ver el ejemplo completo en la sección [DSL de flujos condicionales](#ejemplo-completo).

---

## Estructura de archivos

```
bug-mate/
├── assets/
│   └── bug-mate-logo.png        # Logo del proyecto
├── config/
│   ├── bot.config.json          # Configuración principal del bot (comportamiento, flujos, mensajes)
│   ├── clients.json             # Clientes conocidos + sus docs de conocimiento (NO commitear)
│   ├── clients.example.json     # Plantilla de clientes (seguro para commitear)
│   ├── knowledge.json           # Entradas de FAQ (matching por palabras clave)
│   └── knowledge-docs/          # Documentos para búsqueda vectorial (uno por sistema)
│       ├── medilab-knowledge.md
│       └── cima-knowledge.md
├── data/
│   └── knowledge.sqlite         # Base de datos vectorial auto-generada (borrar para re-indexar)
├── src/
│   └── modules/
│       ├── ai/                  # Proveedores Gemini y Ollama
│       ├── bot/
│       │   ├── bot.service.ts              # Router principal de mensajes
│       │   ├── conditional-flow.service.ts # Intérprete de flujos condicionales
│       │   └── validate.service.ts         # Validación contra fuentes de datos
│       ├── config/              # Carga de configuración, tipos, interpolación
│       ├── knowledge/           # Motor de búsqueda vectorial y FAQ
│       ├── messaging/           # Adaptador de WhatsApp y comandos del grupo de control
│       └── session/             # Manejo de sesiones en memoria
├── .env                         # Variables de entorno (NO commitear)
├── .env.example                 # Plantilla
└── README.md
```

---

## Arquitectura

Esta sección es para desarrolladores que quieran entender los internos, contribuir o extender el proyecto.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | NestJS (inyección de dependencias, módulos) |
| WhatsApp | whatsapp-web.js (basado en Puppeteer) |
| IA — nube | Google Gemini API |
| IA — local | Ollama (cualquier modelo compatible) |
| Vector store | SQLite via better-sqlite3 (sin BD externa) |
| Sesiones | In-memory Map (se resetea al reiniciar) |

### Flujo de un mensaje

```
Mensaje recibido por WhatsApp
        │
        ▼
WhatsAppAdapter.handleIncomingMessage()
  • Ignorar si es propio, de grupo, o anterior al inicio del server
  • Ignorar si el sender está pausado (toma de control del dev)
  • Construir IncomingMessage (descargar y describir media si corresponde)
        │
        ▼
BotService.handleMessage()
  • Obtener o crear sesión para el sender
  • Agregar mensaje al historial
  • Rutear según session.state:
        │
        ├─ IDLE / sesión nueva ─────────→ sendGreetingAndMenu()
        │                                  setState → AWAITING_MENU_SELECTION
        │
        ├─ AWAITING_MENU_SELECTION ─────→ handleMenuSelection()
        │   • Verificar keywords de escalación
        │   • Buscar opción del menú por id o label
        │   • Rutear a: ESCALATE / flujo legacy / flujo condicional
        │
        ├─ FLOW_ACTIVE ─────────────────→ handleActiveFlow()  [legacy]
        │   • Guided: recolectar paso a paso, notificar al dev al terminar
        │   • AI: buscar en conocimiento → generar respuesta
        │
        ├─ CONDITIONAL_FLOW_ACTIVE ─────→ ConditionalFlowService.handleStep()
        │   • Buscar el paso actual en el grafo del flujo
        │   • Procesar el input del usuario para ese tipo de paso
        │   • Rutear al siguiente paso o acción terminal
        │
        └─ ESCALATED ───────────────────→ responder "consulta ya enviada"
```

### Descripción de módulos

#### `messaging/` — Adaptador de WhatsApp

`WhatsAppAdapter` es el único punto de entrada de mensajes. Se encarga de:
- Gestionar el cliente de WhatsApp (auth por QR, estado ready, desconexiones)
- Filtrar mensajes irrelevantes (grupos, propios, previos al arranque)
- Descargar y enriquecer media (imágenes → base64, audio → base64)
- Detectar mensajes salientes del dev → pausar el bot automáticamente
- Escuchar comandos del grupo de control (`!ayuda`, `!estado`, `!sesiones`, etc.)
- Simular delay de tipeo humano antes de enviar respuestas

Implementa la interfaz `MessageAdapter`, lo que lo hace intercambiable. Para agregar un adaptador de Telegram, implementá la misma interfaz y swapeá el token del proveedor.

#### `bot/` — Lógica central

**`BotService`** — el router principal de mensajes. Lee el estado de sesión y despacha al handler correspondiente. También maneja directamente los flujos legacy (guided y AI).

**`ConditionalFlowService`** — el intérprete de flujos condicionales. Recorre el grafo de pasos nombrados definido en `bot.config.json`. Cada tipo de paso tiene un handler dedicado:

| Tipo de paso | Ejecutar (mostrar prompt) | Procesar (manejar input del usuario) |
|---|---|---|
| `input` | Enviar prompt | Guardar texto en `flowData`, avanzar |
| `menu` | Enviar opciones numeradas | Buscar selección, rutear o actuar |
| `validate` | — (se ejecuta inmediatamente) | Matching difuso contra fuente de datos |
| `message` | Enviar texto + acción opcional | — (auto-ejecutable) |
| `ai` | Enviar prompt de entrada | Buscar en conocimiento → generar respuesta |

**`ValidateService`** — valida el input del usuario contra fuentes de datos. Actualmente soporta `"clients"` (desde `clients.json`). Estrategia de matching: teléfono exacto → nombre/empresa difuso (case-insensitive, elimina sufijos legales como S.A., S.R.L.).

#### `session/` — Manejo de sesiones

Las sesiones se guardan en un `Map<senderId, ConversationSession>` en memoria. Cada sesión trackea:

```typescript
{
  senderId: string            // ID de WhatsApp (ej. "5491123456789@c.us")
  clientName: string          // Resuelto desde clients.json o unknownClientName
  state: ConversationState    // IDLE | AWAITING_MENU_SELECTION | FLOW_ACTIVE |
                              // CONDITIONAL_FLOW_ACTIVE | ESCALATED
  activeFlowId: string|null   // Flujo legacy activo
  flowStep: number            // Índice del paso en flujo legacy
  activeConditionalFlowId: string|null  // Flujo condicional activo
  activeStepId: string|null             // ID del paso actual
  flowPath: string[]                    // Breadcrumb de pasos visitados
  flowData: Record<string, string|object>  // Variables recolectadas
  history: {role, content}[]  // Historial de conversación para la IA
  lastActivityAt: Date        // Para tracking de timeout
}
```

Las sesiones expiran después de `greeting.sessionTimeoutMinutes` de inactividad. Un intervalo de limpieza corre cada 5 minutos.

#### `knowledge/` — Motor RAG

`KnowledgeService` ejecuta una búsqueda en dos etapas para cada consulta a la IA:

1. **Matching FAQ** (gratis, instantáneo) — verifica si la consulta contiene algún tag o el prefijo de la pregunta desde `knowledge.json`. Retorna score 1.0 si coincide.
2. **Búsqueda vectorial** — embeddea la consulta, calcula similitud coseno contra todos los chunks almacenados, retorna los top-K resultados por encima de `ragMinScore`.

Los documentos en `knowledge-docs/` se indexan automáticamente al iniciar:
- El texto se normaliza (CRLF → LF) y se divide en chunks de ~500 palabras por saltos de línea
- Cada chunk se embeddea y se guarda en SQLite como BLOB (`Float32Array`)
- Los chunks ya indexados se saltean (clave: `filename::chunkIndex`)

Cuando un cliente tiene `knowledgeDocs` configurado, la búsqueda vectorial se filtra a solo esos archivos fuente antes de calcular la similitud.

#### `config/` — Carga de configuración

**`ConfigLoaderService`** — carga y cachea todos los archivos de config al iniciar:
- `bot.config.json` → `BotConfig`
- `clients.json` → `ClientConfig[]`
- `knowledge.json` → `KnowledgeEntry[]`
- `knowledge-docs/*.md|.txt` → texto crudo para indexar

También expone `interpolate(template, vars)` para sustitución de `{variable}`.

**`BotConfigService`** — wrapper delgado que lee variables de entorno (`DEVELOPER_PHONE`, `CONTROL_GROUP_ID`, `AI_PROVIDER`) y expone valores derivados como `developerWhatsAppId`.

#### `ai/` — Abstracción de proveedores

Ambos proveedores implementan la interfaz `AIProvider`:

```typescript
interface AIProvider {
  generate(options: { prompt: string; systemPrompt: string; history?: ... }): Promise<{ text: string }>
}

interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
}
```

El proveedor activo se selecciona al iniciar via la variable `AI_PROVIDER` y se inyecta via tokens de NestJS (`AI_PROVIDER`, `EMBEDDING_PROVIDER`). Para agregar un nuevo proveedor (ej. OpenAI), implementá ambas interfaces y registrálas en `AiModule`.

### Agregar un nuevo tipo de paso

1. Agregá la interfaz a `src/modules/config/types/conditional-flow.types.ts`
2. Sumalo al tipo unión `ConditionalFlowStep`
3. Agregá un handler en `ConditionalFlowService` (switches `executeStep` y `processStepInput`)
4. Documentalo en la referencia DSL de arriba

### Agregar una nueva fuente de datos para `validate`

1. Agregá el nombre de la fuente al tipo `ValidateDataSource` en `conditional-flow.types.ts`
2. Agregá un case en `ValidateService.validate()`
3. Cargá los datos en `ConfigLoaderService` si es necesario
