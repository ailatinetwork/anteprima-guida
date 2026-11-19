/* Guide 3D Euroklimat: procedure del pannello di comando (terminale pGD1, controllore c.pCO).
   Fonte: video "(P56) ..." in EuroKlimat/01-Progetti/Video Pannello di comando
   (sottotitoli del progetto Premiere e voce trascritta; sequenza schermate e tasti dagli XML).

   Ogni passo ha "b" (battute): una schermata {k:...}, un tasto {key:'ENTER'}, più tasti
   tenuti premuti {key:['ALARM','ENTER'], hold:3}, oppure {ill:'usb'} per un'illustrazione.
   I testi del display restano in inglese come sul controllore. */
(function () {
  // ── schermate ricorrenti ────────────────────────────────────────────
  const HOME = (o = {}) => Object.assign({ k: 'home', date: '00/00/00', day: 'Mon', time: '16.00', out: '26.0°C', inn: '26.0°C', set: '10.0°C', icon: 'snow', status: 'OFF BY KEYBOARD', badge: 'set' }, o);
  const HOME_P56 = HOME({ date: '01/01/25', day: 'Thu', badge: 'power' });

  const MAIN = ['io:Input/Output', 'exv:EXV', 'comp:Compressor', ':—', ':—', 'unit:Unit config', 'log:Alarm logs', 'set:Setting', 'out:Logout'];
  const MENU = (sel, sub = 'Service Password') => ({ k: 'menu', head: 'Main Menu', items: MAIN, sel, sub: sel === 5 ? '' : sub });
  const SETTINGS = sel => ({ k: 'menu', head: 'Settings Menu', items: ['clock:Date/Time', 'uom:UoM', 'lang:Language', 'net:Network', 'key:Pwd Change', 'init:Initialization'], sel, sub: '' });

  const P56MENU = sel => ({ k: 'list', head: 'Main menu', items: ['Plant', 'Unit Config', 'Alarm logs'], sel });
  const LOGIN = pw => ({ k: 'login', pw });
  const UC = (sel, rows) => ({ k: 'form', head: 'Unit configuration', sub: 'Params Import/Export', subSel: sel, rows });
  const IMPEXP = (mode, cur, conf = 'No', vals = true) => UC(true, [
    { l: 'Import/Export:', v: vals ? mode : '', cur: cur === 0 },
    { l: 'Memory type:', v: vals ? 'USB' : '', cur: cur === 1 },
    { l: 'File name:', v: vals ? 'Export_01' : '', cur: cur === 2 },
    { l: 'Confirm:', v: vals ? conf : '', cur: cur === 3 }]);
  const RESULT = txt => ({ k: 'msg', head: 'Imp/Exp result', text: txt, foot: 'Press ESC to back' });

  const SYS = sel => ({ k: 'sys', items: ['INFORMATION', 'SETTINGS', 'APPLICATION', 'UPGRADE', 'LOGGER', 'DIAGNOSTICS'], sel });

  const PUMP = { k: 'form', head: 'Unit configurator', sub: 'Evaporator pump 1', small: true, rows: [
    { l: 'Hours:', v: '0h', r: true }, { l: 'Hours memory:', v: '0h', r: true }, { l: 'Next thr.:', v: '99000h', r: true },
    { l: 'Reset h.:', v: '☐', r: true }, { l: 'Status:', v: 'OFF', r: true }, { l: 'Manual:', v: 'AUTO', r: true }] };
  const ALEXP = (mem, cur, conf = 'NO') => ({ k: 'form', head: 'Unit configurator', sub: 'Alarm Export', small: true, rows: [
    { gap: 1 }, { l: 'Memory type:' }, { l: '', v: mem, cur: cur === 'mem', ind: 1 },
    { l: 'File name:', v: 'AL_EXPORT_00', cur: cur === 'file' }, { gap: 1 }, { l: 'Confirm?', v: conf, cur: cur === 'conf', tab: 1 }] });

  const SETP = (head, label, val, act, actv, cur) => ({ k: 'setp', head, label, val, act, actv, cur });

  const SERIAL_BMS = (addr, cur) => ({ k: 'form', head: 'Serial Ports', sub: 'BMS', rows: [
    { gap: 1 }, { l: 'Address:', v: addr, r: true, cur }, { l: 'Baudrate:', v: '19200', r: true }, { l: 'Stopbits:', v: '2', r: true }, { l: 'Parity:', v: 'None', r: true }] });
  const SERIAL_BAC = (id, cur) => ({ k: 'form', head: 'Serial Ports', sub: 'BACnet IP', rows: [
    { gap: 1 }, { l: 'Device ID:', v: id, r: true, cur }, { gap: 1 }, { gap: 1 }, { l: '(license required)' }] });
  const NET1 = { k: 'net' };
  const NETQ = (q, a) => ({ k: 'big', head: 'NET Configuration', page: q ? '' : '2/2', lines: q ? ['Would you like to reboot', 'to apply the changes?'] : ['', 'Update Config?   ' + a], right: q ? a : '' });

  const P = [];

  // ════════ 1. Operazioni preliminari ════════
  P.push({
    id: 'preliminari', min: 5, short: 'Preliminari', grp: 'aggiornamento', name: 'Operazioni preliminari',
    sub: 'Preparare la chiavetta USB con il nuovo software',
    video: '(P56) PRELIMINATY OPERATION NEW.mp4',
    intro: 'Prima di aggiornare il software del controllore prepara una chiavetta USB con il file fornito da Euroklimat.',
    need: ['Chiavetta USB vuota, fino a 32 GB', 'Computer', 'File del software (.ap1)'],
    steps: [
      { t: 'Prepara la chiavetta USB', d: 'Prendi una chiavetta USB vuota, di capacità fino a 32 GB.', b: [{ ill: 'usb' }] },
      { t: 'Crea la cartella UPGRADE', d: 'Collega la chiavetta al computer e crea una cartella chiamata UPGRADE.', b: [{ ill: 'folder' }] },
      { t: 'Copia il file del software', d: 'Copia nella cartella UPGRADE il file del software fornito: è quello con estensione .ap1.', b: [{ ill: 'file' }] },
      { t: 'Inserisci la chiavetta nel controllore', d: 'Inserisci la chiavetta USB nella porta USB del controllore c.pCO.',
        note: 'Ora puoi passare all’esportazione dei parametri.', b: [{ ill: 'plug' }, HOME_P56] }
    ]
  });

  // ════════ 2. Esportazione parametri ════════
  const impExpSteps = mode => [
    { t: 'Apri il menu principale', d: 'Dalla schermata principale premi il tasto Prg.', b: [HOME_P56, { key: 'PRG' }, LOGIN('')] },
    { t: 'Inserisci la password', d: 'Se la password non è stata cambiata, inserisci quella predefinita 0000 e conferma con Enter.',
      b: [LOGIN(''), LOGIN('0'), LOGIN('00'), LOGIN('000'), LOGIN('0000'), { key: 'ENTER' }, P56MENU(0)] },
    { t: 'Apri il sottomenu Unit Config', d: 'Con le frecce Su e Giù scorri fino a Unit Config e premi Enter.',
      b: [P56MENU(0), { key: 'DOWN' }, P56MENU(1), { key: 'ENTER' }, UC(false, [])] },
    { t: 'Apri la maschera Params Import/Export', d: 'Scorri fino a Params Import/Export e conferma con Enter.',
      b: [UC(false, []), { key: 'DOWN' }, UC(true, []), { key: 'ENTER' }, IMPEXP(mode, 0, 'No', false)] },
    { t: 'Imposta i parametri', d: mode === 'Export'
        ? 'Imposta Import/Export su Export, Memory type su USB e File name su Export_01 (o il primo numero libero, se il file esiste già).'
        : 'Imposta Import/Export su Import, Memory type su USB e File name su Export_01 (o il numero del file da importare).',
      b: [IMPEXP(mode, 0, 'No', false), IMPEXP(mode, 0, 'No'), IMPEXP(mode, 1, 'No'), IMPEXP(mode, 2, 'No')] },
    { t: mode === 'Export' ? 'Avvia l’esportazione' : 'Avvia l’importazione', d: 'Porta Confirm su Yes e premi Enter.', br: { se: 'Cannot access disk', vai: 6 },
      b: [IMPEXP(mode, 3, 'No'), { key: 'UP' }, IMPEXP(mode, 3, 'Yes'), { key: 'ENTER' }, RESULT('Operation done')] },
    { t: 'Se la chiavetta non viene letta', br: { se: 'Operation done', vai: 7, testo: 'Operazione riuscita' }, d: 'Se la chiavetta USB non viene riconosciuta compare il messaggio “Cannot access disk”. Premi Esc e ripeti la procedura.',
      warn: 'Se il problema rimane, controlla che la chiavetta USB funzioni.', b: [RESULT('Cannot access disk'), { key: 'ESC' }, IMPEXP(mode, 3, 'No')] },
    mode === 'Export'
      ? { t: 'Torna alla schermata principale', d: 'A operazione riuscita compare “Operation done”. Premi Esc tre volte per tornare alla schermata principale.',
          note: 'Il file esportato si trova nella cartella principale della chiavetta USB.',
          b: [RESULT('Operation done'), { key: 'ESC' }, IMPEXP(mode, 3, 'No'), { key: 'ESC' }, UC(true, []), { key: 'ESC' }, HOME_P56] }
      : { t: 'Controlla l’esito', d: 'A importazione riuscita compare il messaggio “Operation done”. Premi Esc per tornare indietro.',
          b: [RESULT('Operation done'), { key: 'ESC' }, IMPEXP(mode, 3, 'No')] }
  ];
  P.push({ id: 'export', min: 3, short: 'Esporta parametri', grp: 'aggiornamento', name: 'Esportazione parametri', sub: 'Salvare i parametri della macchina su chiavetta USB',
    video: '(P56) PARAMETERS EXPORT NEW.mp4', intro: 'Salva i parametri prima di aggiornare il software, per poterli ricaricare dopo.',
    need: ['Chiavetta USB inserita nel controllore', 'Password 0000 (se non cambiata)'], steps: impExpSteps('Export') });

  // ════════ 3. Aggiornamento software ════════
  P.push({
    id: 'upgrade', min: 15, short: 'Aggiorna software', grp: 'aggiornamento', name: 'Aggiornamento software', sub: 'Caricare il nuovo software dalla chiavetta USB',
    video: '(P56) SOFTWARE UPGRADE NEW.mp4',
    intro: 'Aggiorna il software del controllore c.pCO con il file copiato nella cartella UPGRADE della chiavetta.',
    need: ['Chiavetta preparata (vedi Operazioni preliminari)', 'Parametri già esportati'],
    steps: [
      { t: 'Apri il menu di sistema', d: 'Tieni premuti insieme i tasti Allarme e Enter per 3 secondi.', b: [HOME_P56, { key: ['ALARM', 'ENTER'], hold: 3 }, SYS(0)] },
      { t: 'Scegli UPGRADE', d: 'Con le frecce Su e Giù scorri fino a UPGRADE e conferma con Enter.',
        b: [SYS(0), { key: 'DOWN' }, SYS(1), { key: 'DOWN' }, SYS(2), { key: 'DOWN' }, SYS(3), { key: 'ENTER' }, { k: 'big', lines: ['Searching…'] }] },
      { t: 'Conferma il software', d: 'Il c.pCO può impiegare fino a un minuto per riconoscere il software sulla chiavetta. Quando compare il nome del file, confermalo con Enter.',
        b: [{ k: 'big', lines: ['Searching…'] }, { k: 'big', lines: ['P56_Master_2025_06_3'], sel: 0 }, { key: 'ENTER' }, { k: 'big', lines: ['APP UPGRADE', '', '', 'Press ENTER to confirm', 'any other key to exit'] }] },
      { t: 'Avvia l’aggiornamento', d: 'Quando il software è stato trasferito dalla chiavetta al controllore, premi Enter per avviare l’aggiornamento.',
        warn: 'Non togliere la chiavetta USB durante l’aggiornamento. L’operazione può durare fino a 10 minuti.',
        b: [{ k: 'big', lines: ['APP UPGRADE', '', '', 'Press ENTER to confirm', 'any other key to exit'] }, { key: 'ENTER' }, { k: 'big', lines: ['Upgrading…'] }, { k: 'big', lines: ['UPGRADE COMPLETE', '', '', '', 'Press ENTER to restart'] }] },
      { t: 'Riavvia il controllore', d: 'A fine aggiornamento compare “UPGRADE COMPLETE”. Premi Enter e attendi il riavvio del software.',
        note: 'Dopo il riavvio importa i parametri salvati.', b: [{ k: 'big', lines: ['UPGRADE COMPLETE', '', '', '', 'Press ENTER to restart'] }, { key: 'ENTER' }, { k: 'blank' }, HOME_P56] }
    ]
  });

  // ════════ 4. Importazione parametri ════════
  P.push({ id: 'import', min: 3, short: 'Importa parametri', grp: 'aggiornamento', name: 'Importazione parametri', sub: 'Ricaricare i parametri dopo l’aggiornamento',
    video: '(P56) PARAMETERS IMPORT NEW.mp4', intro: 'Dopo l’aggiornamento del software ricarica i parametri esportati in precedenza.',
    need: ['Chiavetta USB con il file Export_01', 'Password 0000 (se non cambiata)'], steps: impExpSteps('Import') });

  // ════════ 5. Set point ════════
  const HOME_SP = HOME({ day: 'Thu', out: '19.8°C', inn: '20.0°C', set: '28.0°C', icon: 'flame' });
  const COOL = (v, cur) => SETP('Set - Unit', 'Cooling:', v, 'Heat', '28.0 °C', cur);
  const HEATS = (v, cur) => SETP('Set - Unit', 'Heating:', v, 'Heat', '28.0 °C', cur);
  const MODE = (v, cur) => SETP('Set', 'Mode:', v, v === 'COOL' ? 'Cool' : 'Heat', v === 'COOL' ? '7.0 °C' : '28.0 °C', cur);
  P.push({
    id: 'setpoint', min: 2, short: 'Set point', grp: 'uso', name: 'Regolazione set point', sub: 'Temperature di raffrescamento e riscaldamento, modo di funzionamento',
    video: '(P56) SET POINT (solo progetto, video non esportato)',
    intro: 'Dal menu Set si regolano i set point di raffrescamento e riscaldamento e si sceglie il modo di funzionamento.',
    steps: [
      { t: 'Apri il menu Set', d: 'Dalla schermata principale premi Enter.', b: [HOME_SP, { key: 'ENTER' }, COOL('7.0 °C')] },
      { t: 'Set point di raffrescamento', d: 'Premi Enter per modificare il valore di Cooling, regolalo con le frecce e conferma con Enter.',
        b: [COOL('7.0 °C'), { key: 'ENTER' }, COOL('7.0 °C', true), { key: 'UP' }, COOL('7.1 °C', true), { key: 'ENTER' }, COOL('7.1 °C')] },
      { t: 'Set point di riscaldamento', d: 'Con la freccia Giù passa a Heating. Premi Enter, regola il valore con le frecce e conferma con Enter.',
        b: [COOL('7.1 °C'), { key: 'DOWN' }, HEATS('28.0 °C'), { key: 'ENTER' }, HEATS('28.0 °C', true), { key: 'UP' }, HEATS('28.1 °C', true), { key: 'ENTER' }, HEATS('28.1 °C')] },
      { t: 'Modo di funzionamento', d: 'Con la freccia Giù passa a Mode. Premi Enter, scegli HEAT o COOL con le frecce e conferma con Enter.',
        b: [HEATS('28.1 °C'), { key: 'DOWN' }, MODE('HEAT'), { key: 'ENTER' }, MODE('HEAT', true), { key: 'DOWN' }, MODE('COOL', true), { key: 'DOWN' }, MODE('HEAT', true), { key: 'ENTER' }, MODE('HEAT')] },
      { t: 'Torna alla schermata principale', d: 'Premi la freccia Su per tornare alle impostazioni dell’unità, poi Esc per tornare alla schermata principale.',
        b: [MODE('HEAT'), { key: 'UP' }, HEATS('28.1 °C'), { key: 'ESC' }, HOME_SP] }
    ]
  });

  // ════════ 6. Esportazione allarmi ════════
  P.push({
    id: 'allarmi', min: 3, short: 'Storico allarmi', grp: 'assistenza', name: 'Esportazione storico allarmi', sub: 'Salvare lo storico allarmi su chiavetta USB',
    video: '(P56) Alarm Export.mp4', intro: 'Esporta lo storico degli allarmi del controllore per inviarlo all’assistenza.',
    need: ['Chiavetta USB vuota'],
    steps: [
      { t: 'Inserisci la chiavetta USB', d: 'Prepara una chiavetta USB vuota e inseriscila nella porta USB del controllore.', b: [{ ill: 'plug' }, HOME()] },
      { t: 'Apri il menu principale', d: 'Premi il tasto Prg.', b: [HOME(), { key: 'PRG' }, MENU(0)] },
      { t: 'Apri Unit config', d: 'Con la freccia Su scorri fino a Unit config e premi Enter.',
        b: [MENU(0), { key: 'UP' }, MENU(8), { key: 'UP' }, MENU(7), { key: 'UP' }, MENU(6), { key: 'UP' }, MENU(5), { key: 'ENTER' }, PUMP] },
      { t: 'Vai alla pagina Alarm Export', d: 'Premi una volta la freccia Su per passare dalla pagina della pompa (Evaporator pump 1) alla pagina Alarm Export.',
        b: [PUMP, { key: 'UP' }, ALEXP('INTERNAL FLASH MEMORY')] },
      { t: 'Scegli la memoria USB', d: 'Premi Enter, con la freccia Giù imposta Memory type su USB e conferma con Enter.',
        b: [ALEXP('INTERNAL FLASH MEMORY'), { key: 'ENTER' }, ALEXP('INTERNAL FLASH MEMORY', 'mem'), { key: 'DOWN' }, ALEXP('USB', 'mem'), { key: 'ENTER' }, ALEXP('USB', 'file')] },
      { t: 'Conferma il nome del file', d: 'Premi Enter per confermare il nome del file (AL_EXPORT_00): il cursore passa su Confirm.',
        b: [ALEXP('USB', 'file'), { key: 'ENTER' }, ALEXP('USB', 'conf')] },
      { t: 'Avvia il trasferimento', d: 'Con la freccia Su seleziona YES e premi Enter. Attendi qualche istante il messaggio “Operation done”.',
        b: [ALEXP('USB', 'conf'), { key: 'UP' }, ALEXP('USB', 'conf', 'YES'), { key: 'ENTER' }, { k: 'msg', head: 'Operation result', text: 'Operation done', foot: 'press ESC to back' }] },
      { t: 'Torna alla schermata principale', d: 'Premi Esc due volte per tornare alla schermata principale.', note: 'Ora puoi togliere la chiavetta USB.',
        b: [{ k: 'msg', head: 'Operation result', text: 'Operation done', foot: 'press ESC to back' }, { key: 'ESC' }, MENU(5), { key: 'ESC' }, HOME()] }
    ]
  });

  // ════════ 7. Esportazione log ════════
  const LOGS = sel => ({ k: 'sys', items: ['EXPORT LOGS', 'RESTART LOGS', 'FLUSH LOGS', 'WIPE LOGS'], sel });
  const LOGSEL = sel => ({ k: 'sys', items: ['[export all]', 'EK_Log'], sel, small: true });
  P.push({
    id: 'log', min: 3, short: 'Log di funzionamento', grp: 'assistenza', name: 'Esportazione log di funzionamento', sub: 'Salvare i log del controllore su chiavetta USB',
    video: '(P56) Export Log.mp4', intro: 'Esporta i log di funzionamento (EK_Log) per l’analisi da parte dell’assistenza.',
    need: ['Chiavetta USB vuota'],
    steps: [
      { t: 'Inserisci la chiavetta USB', d: 'Prepara una chiavetta USB vuota e inseriscila nella porta USB del controllore.', b: [{ ill: 'plug' }, HOME()] },
      { t: 'Apri il menu', d: 'Premi il tasto Allarme, poi Enter per aprire il menu.', b: [HOME(), { key: 'ALARM' }, HOME(), { key: 'ENTER' }, SYS(0)] },
      { t: 'Apri LOGGER', d: 'Con la freccia Giù scorri fino a LOGGER e premi Enter.',
        b: [SYS(0), { key: 'DOWN' }, SYS(1), { key: 'DOWN' }, SYS(2), { key: 'DOWN' }, SYS(3), { key: 'DOWN' }, SYS(4), { key: 'ENTER' }, LOGS(0)] },
      { t: 'Scegli EXPORT LOGS', d: 'Premi Enter su EXPORT LOGS, poi ancora Enter per confermare la schermata iniziale.',
        b: [LOGS(0), { key: 'ENTER' }, { k: 'big', lines: ['EXPORT LOGS', '', '', '', 'Press ENTER'] }, { key: 'ENTER' }, LOGSEL(0)] },
      { t: 'Esporta EK_Log', d: 'Con la freccia Giù seleziona EK_Log e premi Enter. Attendi il messaggio “Log operation done successfully”.',
        b: [LOGSEL(0), { key: 'DOWN' }, LOGSEL(1), { key: 'ENTER' }, { k: 'big', lines: ['Export EK_Log…'] }, { k: 'big', lines: ['Log operation done', 'successfully', '', '', 'Press ENTER'] }] },
      { t: 'Torna alla schermata principale', d: 'Premi Esc più volte fino alla schermata principale.', note: 'Ora puoi togliere la chiavetta USB.',
        b: [{ k: 'big', lines: ['Log operation done', 'successfully', '', '', 'Press ENTER'] }, { key: 'ESC' }, LOGSEL(1), { key: 'ESC' }, LOGS(0), { key: 'ESC' }, SYS(4), { key: 'ESC' }, HOME()] }
    ]
  });

  // ════════ 8. Rete e porte seriali ════════
  P.push({
    id: 'rete', min: 5, short: 'Rete e porte seriali', grp: 'assistenza', name: 'Configurazione rete e porte seriali', sub: 'Indirizzo BMS, Device ID BACnet e rete',
    video: '(P56) Network and Serial Configuration.mp4', intro: 'Imposta l’indirizzo BMS, il Device ID BACnet IP e applica la configurazione di rete.',
    steps: [
      { t: 'Apri il menu principale', d: 'Dalla schermata principale premi il tasto Prg.', b: [HOME(), { key: 'PRG' }, MENU(0)] },
      { t: 'Apri Setting', d: 'Con la freccia Su scorri fino a Setting e premi Enter.', b: [MENU(0), { key: 'UP' }, MENU(8), { key: 'UP' }, MENU(7), { key: 'ENTER' }, SETTINGS(0)] },
      { t: 'Apri Network', d: 'Con la freccia Su scorri fino a Network e premi Enter.', b: [SETTINGS(0), { key: 'UP' }, SETTINGS(5), { key: 'UP' }, SETTINGS(4), { key: 'UP' }, SETTINGS(3), { key: 'ENTER' }, SERIAL_BMS('1')] },
      { t: 'Indirizzo BMS', d: 'Nella sezione BMS premi Enter sul parametro Address, impostalo a 2 e conferma con Enter.',
        b: [SERIAL_BMS('1'), { key: 'ENTER' }, SERIAL_BMS('1', true), { key: 'UP' }, SERIAL_BMS('2', true), { key: 'ENTER' }, SERIAL_BMS('2')] },
      { t: 'Device ID BACnet IP', d: 'Scorri fino alla sezione BACnet IP. Premi Enter sul parametro Device ID, impostalo a 1 e conferma con Enter.',
        b: [SERIAL_BMS('2'), { key: 'DOWN' }, SERIAL_BAC('3'), { key: 'ENTER' }, SERIAL_BAC('3', true), { key: 'DOWN' }, SERIAL_BAC('2', true), { key: 'DOWN' }, SERIAL_BAC('1', true), { key: 'ENTER' }, SERIAL_BAC('1')] },
      { t: 'NET Configuration', d: 'Scorri fino a NET Configuration e premi Enter. Nella pagina 1/2 controlla che Enable sia Static.',
        warn: 'Non modificare i parametri IP.',
        b: [SERIAL_BAC('1'), { key: 'UP' }, { k: 'big', head: 'NET Configuration', lines: ['', 'Press “ENTER” for', 'Network Configuration'] }, { key: 'ENTER' }, NET1] },
      { t: 'Applica la configurazione', d: 'Passa alla pagina 2/2, premi Enter su Update Config, imposta Yes e conferma con Enter.',
        b: [NET1, { key: 'DOWN' }, NETQ(false, 'No'), { key: 'ENTER' }, { key: 'UP' }, NETQ(false, 'Yes'), { key: 'ENTER' }, NETQ(true, 'Yes')] },
      { t: 'Riavvio', d: 'Alla domanda sul riavvio premi Enter, imposta No e conferma con Enter.',
        b: [NETQ(true, 'Yes'), { key: 'ENTER' }, { key: 'UP' }, NETQ(true, 'No'), { key: 'ENTER' }, NET1] },
      { t: 'Torna alla schermata principale', d: 'Premi Esc più volte fino alla schermata principale.', b: [NET1, { key: 'ESC' }, SETTINGS(3), { key: 'ESC' }, MENU(7), { key: 'ESC' }, HOME()] }
    ]
  });

  P.forEach(p => p.cmd = 'P56');

  // ════════ Bozze: P30, P45, P51, P53 (terminale pGD1 + controllore c.pCO, come il P56) ════════
  // Fonti: manuale Carel c.pCO (+0300057IT/EN, menu di sistema, UPGRADE, LOGGER) e manuale Euroklimat Hydra,
  // cap. 8 "Pannello di comando" (set point dalla schermata principale, ALARM, data logger). Da verificare sul software di ogni comando.
  const HY = (o = {}) => HOME({ date: '03/02/25', day: 'Mon', time: '15.39', out: '8.0°C', inn: '12.9°C', set: '8.0°C', status: 'STAND BY', ...o });
  const HYSET = (v, cur) => SETP('Set', 'Q001 Cooling:', v, 'Cool', '8.0 °C', cur);
  const HYHEAT = (v, cur) => SETP('Set', 'Q002 Heating:', v, 'Heat', '41.5 °C', cur);
  const NOAL = { k: 'big', head: 'ALARMS', lines: ['NO ALARMS', '', '', 'Press ENTER', 'to data logger'] };
  const AL = { k: 'big', head: 'ALARMS', page: '01/01', lines: ['AL173   15/05 9:28', 'CIRCUIT 1 HP ALARM', 'BY PRESSURE SWITCH', 'Condensing T.  20.1', 'Discharge T.   26.0'] };
  const DLOG = (n, ev) => ({ k: 'big', head: 'DATA LOGGER', page: 'REC ' + n, lines: [ev[0], ev[1], ev[2], '', 'Event: ' + ev[3]] });
  const LOGSEL_G = sel => ({ k: 'sys', items: ['[export all]', 'Log_01'], sel, small: true });
  const bozzaPGD = cmd => {
    const c = cmd.toLowerCase(), H = HY(), file = cmd + '_Master_….ap1';
    return [
      { id: c + '-upgrade', cmd, min: 15, short: 'Aggiorna software', grp: 'aggiornamento', name: 'Aggiornamento software', sub: 'Caricare il nuovo software dalla chiavetta USB',
        intro: 'Aggiorna il software del controllore c.pCO con il file .ap1 fornito da Euroklimat, copiato nella cartella UPGRADE della chiavetta.',
        need: ['Chiavetta USB vuota, fino a 32 GB', 'File del software (.ap1) fornito da Euroklimat'],
        steps: [
          { t: 'Prepara la chiavetta USB', d: 'Sulla chiavetta crea una cartella chiamata UPGRADE e copiaci il file del software (.ap1).', b: [{ ill: 'file' }] },
          { t: 'Inserisci la chiavetta nel controllore', d: 'Inserisci la chiavetta USB nella porta USB del controllore c.pCO.', b: [{ ill: 'plug' }, H] },
          { t: 'Apri il menu di sistema', d: 'Tieni premuti insieme i tasti Allarme e Enter per 3 secondi.', b: [H, { key: ['ALARM', 'ENTER'], hold: 3 }, SYS(0)] },
          { t: 'Scegli UPGRADE', d: 'Con la freccia Giù scorri fino a UPGRADE e conferma con Enter.',
            b: [SYS(0), { key: 'DOWN' }, SYS(1), { key: 'DOWN' }, SYS(2), { key: 'DOWN' }, SYS(3), { key: 'ENTER' }, { k: 'big', lines: ['Searching…'] }] },
          { t: 'Conferma il software', d: 'Quando compare il nome del file, confermalo con Enter e poi ancora Enter per avviare l’aggiornamento.',
            warn: 'Non togliere la chiavetta USB e non spegnere la macchina durante l’aggiornamento.',
            b: [{ k: 'big', lines: [file], sel: 0 }, { key: 'ENTER' }, { k: 'big', lines: ['APP UPGRADE', '', '', 'Press ENTER to confirm', 'any other key to exit'] }, { key: 'ENTER' }, { k: 'big', lines: ['Upgrading…'] }] },
          { t: 'Riavvia il controllore', d: 'A fine aggiornamento compare “UPGRADE COMPLETE”. Premi Enter e attendi il riavvio.',
            note: 'Prima di aggiornare conviene esportare i parametri, per poterli ricaricare dopo.',
            b: [{ k: 'big', lines: ['UPGRADE COMPLETE', '', '', '', 'Press ENTER to restart'] }, { key: 'ENTER' }, { k: 'blank' }, H] }
        ] },
      { id: c + '-rete', cmd, min: 3, short: 'Porte seriali', grp: 'assistenza', name: 'Configurazione porte seriali', sub: 'Indirizzo BMS del controllore',
        intro: 'Imposta l’indirizzo della porta seriale BMS per il collegamento al sistema di supervisione.',
        steps: [
          { t: 'Apri il menu principale', d: 'Dalla schermata principale premi il tasto Prg.', b: [H, { key: 'PRG' }, MENU(0)] },
          { t: 'Apri Setting', d: 'Con la freccia Su scorri fino a Setting e premi Enter.', b: [MENU(0), { key: 'UP' }, MENU(8), { key: 'UP' }, MENU(7), { key: 'ENTER' }, SETTINGS(0)] },
          { t: 'Apri Network', d: 'Con la freccia Su scorri fino a Network e premi Enter.', b: [SETTINGS(0), { key: 'UP' }, SETTINGS(5), { key: 'UP' }, SETTINGS(4), { key: 'UP' }, SETTINGS(3), { key: 'ENTER' }, SERIAL_BMS('1')] },
          { t: 'Imposta l’indirizzo', d: 'Premi Enter sul parametro Address, regolalo con le frecce e conferma con Enter.',
            note: 'Baudrate, bit di stop e parità devono essere uguali a quelli del sistema di supervisione.',
            b: [SERIAL_BMS('1'), { key: 'ENTER' }, SERIAL_BMS('1', true), { key: 'UP' }, SERIAL_BMS('2', true), { key: 'ENTER' }, SERIAL_BMS('2')] },
          { t: 'Torna alla schermata principale', d: 'Premi Esc più volte fino alla schermata principale.', b: [SERIAL_BMS('2'), { key: 'ESC' }, SETTINGS(3), { key: 'ESC' }, MENU(7), { key: 'ESC' }, H] }
        ] },
      { id: c + '-log', cmd, min: 3, short: 'Log di funzionamento', grp: 'assistenza', name: 'Estrazione log di funzionamento', sub: 'Salvare i log del controllore su chiavetta USB',
        intro: 'Esporta i log di funzionamento dal menu di sistema LOGGER, per l’analisi da parte dell’assistenza.',
        need: ['Chiavetta USB vuota'],
        steps: [
          { t: 'Inserisci la chiavetta USB', d: 'Inserisci una chiavetta USB vuota nella porta USB del controllore.', b: [{ ill: 'plug' }, H] },
          { t: 'Apri il menu di sistema', d: 'Tieni premuti insieme i tasti Allarme e Enter per 3 secondi.', b: [H, { key: ['ALARM', 'ENTER'], hold: 3 }, SYS(0)] },
          { t: 'Apri LOGGER', d: 'Con la freccia Giù scorri fino a LOGGER e premi Enter.',
            b: [SYS(0), { key: 'DOWN' }, SYS(1), { key: 'DOWN' }, SYS(2), { key: 'DOWN' }, SYS(3), { key: 'DOWN' }, SYS(4), { key: 'ENTER' }, LOGS(0)] },
          { t: 'Esporta i log', d: 'Premi Enter su EXPORT LOGS, poi Enter per confermare. Scegli [export all] e premi Enter.',
            b: [LOGS(0), { key: 'ENTER' }, { k: 'big', lines: ['EXPORT LOGS', '', '', '', 'Press ENTER'] }, { key: 'ENTER' }, LOGSEL_G(0), { key: 'ENTER' }, { k: 'big', lines: ['Log operation done', 'successfully', '', '', 'Press ENTER'] }] },
          { t: 'Torna alla schermata principale', d: 'Premi Esc più volte fino alla schermata principale.', note: 'Ora puoi togliere la chiavetta USB.',
            b: [{ k: 'big', lines: ['Log operation done', 'successfully', '', '', 'Press ENTER'] }, { key: 'ESC' }, LOGS(0), { key: 'ESC' }, SYS(4), { key: 'ESC' }, H] }
        ] },
      { id: c + '-allarmi', cmd, min: 2, short: 'Storico allarmi', grp: 'assistenza', name: 'Allarmi e storico allarmi', sub: 'Leggere gli allarmi attivi e lo storico (data logger)',
        intro: 'Dal tasto Allarme si leggono gli allarmi attivi e si apre lo storico, che conserva fino a 64 eventi.',
        steps: [
          { t: 'Apri gli allarmi', d: 'Premi il tasto Allarme. Se ci sono allarmi compaiono codice, data, descrizione e valori delle sonde; se no compare “NO ALARMS”.',
            b: [H, { key: 'ALARM' }, AL] },
          { t: 'Scorri gli allarmi attivi', d: 'Con le frecce Su e Giù passi da un allarme all’altro.', b: [AL, { key: 'DOWN' }, AL] },
          { t: 'Apri lo storico', d: 'Premi Enter per aprire il data logger: ogni evento ha codice, data, ora e valori delle sonde.',
            b: [AL, { key: 'ENTER' }, DLOG('01', ['AL173   15/05 9:28', 'CIRCUIT 1 HP ALARM', 'BY PRESSURE SWITCH', 'START']), { key: 'DOWN' }, DLOG('02', ['AL173   15/05 9:41', 'CIRCUIT 1 HP ALARM', 'BY PRESSURE SWITCH', 'STOP'])] },
          { t: 'Reset degli allarmi', d: 'Per il reset manuale torna agli allarmi attivi e tieni premuto Allarme per 3 secondi.',
            warn: 'Se la causa dell’allarme non è risolta, l’allarme compare di nuovo.',
            b: [AL, { key: 'ALARM', hold: 3 }, NOAL] },
          { t: 'Torna alla schermata principale', d: 'Premi Esc.', b: [NOAL, { key: 'ESC' }, H] }
        ] },
      { id: c + '-setpoint', cmd, min: 2, short: 'Set point', grp: 'uso', name: 'Modifica set point', sub: 'Temperatura di raffrescamento e riscaldamento',
        intro: 'Il set point si modifica direttamente dalla schermata principale, selezionando la voce SET.',
        steps: [
          { t: 'Seleziona SET', d: 'Dalla schermata principale, con le frecce Su e Giù seleziona SET e premi Enter.', b: [H, { key: 'DOWN' }, HY({ hl: 'set' }), { key: 'ENTER' }, HYSET('8.0 °C')] },
          { t: 'Set point di raffrescamento', d: 'Premi Enter: il cursore va sul valore. Regolalo con le frecce e conferma con Enter.',
            b: [HYSET('8.0 °C'), { key: 'ENTER' }, HYSET('8.0 °C', true), { key: 'DOWN' }, HYSET('7.5 °C', true), { key: 'DOWN' }, HYSET('7.0 °C', true), { key: 'ENTER' }, HYSET('7.0 °C')] },
          { t: 'Set point di riscaldamento', d: 'Con la freccia Giù passa a Heating e regola il valore allo stesso modo (solo unità in pompa di calore).',
            b: [HYSET('7.0 °C'), { key: 'DOWN' }, HYHEAT('41.5 °C'), { key: 'ENTER' }, HYHEAT('41.5 °C', true), { key: 'UP' }, HYHEAT('42.0 °C', true), { key: 'ENTER' }, HYHEAT('42.0 °C')] },
          { t: 'Torna alla schermata principale', d: 'Premi Esc: il nuovo valore compare accanto a SET.', b: [HYHEAT('42.0 °C'), { key: 'ESC' }, HY({ set: '7.0°C' })] }
        ] }
    ];
  };
  const BOZZA_PGD = 'Bozza ricostruita dal manuale Carel del controllore c.pCO e dal manuale Euroklimat Hydra: menu e testi del display sono da verificare sul software del comando.';

  // ════════ Bozza: Microchiller (controllore Carel µChiller, display LED a due righe e 4 tasti) ════════
  // Fonte: manuale Carel µChiller +0300053IT rel. 1.2, cap. 3 (Applica) e cap. 4 (interfaccia utente).
  // Schermata 'seg': top = riga superiore (valore), bot = riga inferiore (codice), ed = valore in modifica (lampeggia).
  const SG = (top, bot, o = {}) => ({ k: 'seg', top, bot, ...o });
  const STD = SG('12.0', '14.5', { ic: ['cool', 'pump', 'comp'] }), STDOFF = SG('14.0', 'OFF', { ic: ['cool'] });
  const PSD = (v, d) => SG(v, 'PSd', { ed: d != null, dig: d });
  const CAT = c => SG('', c, { cat: 1 });
  const UCH = [
    { id: 'uch-setpoint', cmd: 'Microchiller', min: 2, short: 'Set point', grp: 'uso', name: 'Modifica set point', sub: 'SEtC raffreddamento, SEtH riscaldamento',
      intro: 'I set point sono tra le funzioni ad accesso diretto: si aprono tenendo premuto Giù per 3 secondi, senza password.',
      steps: [
        { t: 'Apri le funzioni ad accesso diretto', d: 'Dalla visualizzazione standard tieni premuto Giù per 3 secondi. Compare SEtA, il set point attuale (solo lettura).',
          b: [STD, { key: 'DOWN', hold: 3 }, SG('7.0', 'SEtA')] },
        { t: 'Set point di raffreddamento', d: 'Premi Giù: compare SEtC. Premi Prg, il valore lampeggia: regolalo con le frecce e conferma con Prg.',
          b: [SG('7.0', 'SEtA'), { key: 'DOWN' }, SG('7.0', 'SEtC'), { key: 'PRG' }, SG('7.0', 'SEtC', { ed: 1 }), { key: 'UP' }, SG('7.5', 'SEtC', { ed: 1 }), { key: 'PRG' }, SG('7.5', 'SEtC')] },
        { t: 'Set point di riscaldamento', d: 'Premi Giù: compare SEtH (solo unità in pompa di calore). Modificalo allo stesso modo con Prg e le frecce.',
          b: [SG('7.5', 'SEtC'), { key: 'DOWN' }, SG('40.0', 'SEtH'), { key: 'PRG' }, SG('40.0', 'SEtH', { ed: 1 }), { key: 'UP' }, SG('40.5', 'SEtH', { ed: 1 }), { key: 'PRG' }, SG('40.5', 'SEtH')] },
        { t: 'Torna alla visualizzazione standard', d: 'Tieni premuto Prg per 3 secondi.', note: 'Senza premere tasti, dopo circa 3 minuti il terminale torna da solo alla visualizzazione standard.',
          b: [SG('40.5', 'SEtH'), { key: 'PRG', hold: 3 }, STD] }
      ] },
    { id: 'uch-onoff', cmd: 'Microchiller', min: 1, short: 'Accensione', grp: 'uso', name: 'Accensione e spegnimento', sub: 'Comando UnSt',
      intro: 'L’unità si accende e si spegne dal comando UnSt, nelle funzioni ad accesso diretto.',
      steps: [
        { t: 'Apri le funzioni ad accesso diretto', d: 'Dalla visualizzazione standard tieni premuto Giù per 3 secondi.', b: [STDOFF, { key: 'DOWN', hold: 3 }, SG('7.0', 'SEtA')] },
        { t: 'Vai a UnSt', d: 'Premi Giù fino al comando UnSt.', b: [SG('7.0', 'SEtA'), { key: 'DOWN' }, SG('7.0', 'SEtC'), { key: 'DOWN' }, SG('40.0', 'SEtH'), { key: 'DOWN' }, SG('OFF', 'UnSt')] },
        { t: 'Accendi o spegni', d: 'Premi Prg, scegli On o OFF con le frecce e conferma con Prg.',
          b: [SG('OFF', 'UnSt'), { key: 'PRG' }, SG('OFF', 'UnSt', { ed: 1 }), { key: 'UP' }, SG('On', 'UnSt', { ed: 1 }), { key: 'PRG' }, SG('On', 'UnSt')] },
        { t: 'Torna alla visualizzazione standard', d: 'Tieni premuto Prg per 3 secondi. A unità accesa la riga inferiore mostra la temperatura di ritorno dell’acqua.',
          b: [SG('On', 'UnSt'), { key: 'PRG', hold: 3 }, STD] }
      ] },
    { id: 'uch-allarmi', cmd: 'Microchiller', min: 3, short: 'Storico allarmi', grp: 'assistenza', name: 'Storico allarmi (Hst)', sub: 'Gli ultimi 20 allarmi con data e ora',
      intro: 'Lo storico allarmi è la categoria Hst del modo programmazione: conserva fino a 20 eventi, con data e ora.',
      need: ['Password del livello Utente (1000) o Assistenza (2000)'],
      steps: [
        { t: 'Allarmi attivi', d: 'Premendo una volta Allarme vedi gli allarmi attivi e spegni il cicalino. Tenendolo premuto 3 secondi resetti gli allarmi.',
          b: [STD, { key: 'ALARM' }, SG('', 'A01', { alarm: 1 }), { key: 'ALARM' }, STD] },
        { t: 'Apri il modo programmazione', d: 'Dalla visualizzazione standard premi Prg: compare la richiesta di password PSd.', b: [STD, { key: 'PRG' }, PSD('0000')] },
        { t: 'Inserisci la password', d: 'Premi Prg: la prima cifra lampeggia. Imposta 1 con la freccia Su e conferma con Prg; conferma le altre cifre con Prg.',
          b: [PSD('0000'), { key: 'PRG' }, PSD('0000', 0), { key: 'UP' }, PSD('1000', 0), { key: 'PRG' }, PSD('1000', 1), { key: 'PRG' }, PSD('1000', 2), { key: 'PRG' }, PSD('1000', 3), { key: 'PRG' }, CAT('PLt')] },
        { t: 'Scegli la categoria Hst', d: 'Con la freccia Giù scorri le categorie (PLt, EEV, CMP, Src, Clc) fino a Hst e premi Prg.',
          b: [CAT('PLt'), { key: 'DOWN' }, CAT('EEV'), { key: 'DOWN' }, CAT('CMP'), { key: 'DOWN' }, CAT('Src'), { key: 'DOWN' }, CAT('CLC'), { key: 'DOWN' }, CAT('HSt'), { key: 'PRG' }, SG('A01', '1205')] },
        { t: 'Leggi gli eventi', d: 'Ogni evento mostra il codice dell’allarme e, alternate, la data (giorno mese) e l’ora. Con le frecce passi agli altri eventi.',
          b: [SG('A01', '1205'), SG('A01', '09:28'), { key: 'DOWN' }, SG('A07', '0305'), SG('A07', '17:12')] },
        { t: 'Esci', d: 'Tieni premuto Prg per 3 secondi per tornare alle categorie, poi seleziona ESC e premi Prg.', b: [SG('A07', '17:12'), { key: 'PRG', hold: 3 }, CAT('HSt'), { key: 'DOWN' }, CAT('ESC'), { key: 'PRG' }, STD] }
      ] },
    { id: 'uch-log', cmd: 'Microchiller', min: 2, short: 'Dati di funzionamento', grp: 'assistenza', name: 'Dati di funzionamento (sinottico)', sub: 'Compressori, evaporazione, surriscaldamento, condensazione',
      intro: 'Il µChiller non salva log su chiavetta: i dati di funzionamento si leggono dal sinottico, oppure si registrano con Applica Desktop.',
      steps: [
        { t: 'Apri il sinottico', d: 'Dalla visualizzazione standard premi Giù: CMP mostra lo stato dei compressori (o = acceso, _ = spento).', b: [STD, { key: 'DOWN' }, SG('o_', 'CMP')] },
        { t: 'Evaporazione e surriscaldamento', d: 'Premi Giù: EuP1 è la temperatura di evaporazione del circuito 1, SSH1 il surriscaldamento.',
          b: [SG('o_', 'CMP'), { key: 'DOWN' }, SG('3.8', 'EuP1'), { key: 'DOWN' }, SG('5.2', 'SSH1')] },
        { t: 'Condensazione e scarico', d: 'Premi Giù: Cnd1 è la temperatura di condensazione del circuito 1, dSt1 quella di scarico del compressore.',
          b: [SG('5.2', 'SSH1'), { key: 'DOWN' }, SG('40.8', 'Cnd1'), { key: 'DOWN' }, SG('62.0', 'dSt1')] },
        { t: 'Torna alla visualizzazione standard', d: 'Scorri fino a ESC e premi Prg.', note: 'Per registrare i dati nel tempo usa Applica Desktop con il convertitore USB/RS485.',
          b: [SG('62.0', 'dSt1'), { key: 'DOWN' }, SG('', 'ESC'), { key: 'PRG' }, STD] }
      ] },
    { id: 'uch-rete', cmd: 'Microchiller', min: 3, short: 'Porta seriale BMS', grp: 'assistenza', name: 'Configurazione porta seriale BMS', sub: 'Indirizzo Hd00, baud rate Hd01, parametri Hd02',
      intro: 'I parametri della porta BMS sono visibili nel sinottico quando si è entrati con la password Assistenza.',
      need: ['Password Assistenza (2000)'],
      steps: [
        { t: 'Entra con la password Assistenza', d: 'Premi Prg e inserisci la password 2000: ogni cifra si regola con le frecce e si conferma con Prg.',
          b: [STD, { key: 'PRG' }, PSD('0000'), { key: 'PRG' }, PSD('0000', 0), { key: 'UP' }, PSD('1000', 0), { key: 'UP' }, PSD('2000', 0), { key: 'PRG' }, PSD('2000', 1), { key: 'PRG' }, PSD('2000', 2), { key: 'PRG' }, PSD('2000', 3), { key: 'PRG' }, CAT('PLt')] },
        { t: 'Torna alla visualizzazione standard', d: 'Tieni premuto Prg per 3 secondi.', b: [CAT('PLt'), { key: 'PRG', hold: 3 }, STD] },
        { t: 'Apri l’indirizzo Hd00', d: 'Premi Giù più volte: dopo i dati dei circuiti compare Hd00, l’indirizzo seriale BMS.',
          b: [STD, { key: 'DOWN' }, SG('o_', 'CMP'), { key: 'DOWN' }, SG('3.8', 'EuP1'), { key: 'DOWN' }, SG('1', 'Hd00')] },
        { t: 'Imposta l’indirizzo', d: 'Premi Prg, regola il valore con le frecce (da 1 a 247) e conferma con Prg.',
          note: 'Hd01 è il baud rate (3 = 9600, 4 = 19200, 5 = 38400, 6 = 57600, 7 = 115200) e Hd02 i parametri di comunicazione.',
          b: [SG('1', 'Hd00'), { key: 'PRG' }, SG('1', 'Hd00', { ed: 1 }), { key: 'UP' }, SG('2', 'Hd00', { ed: 1 }), { key: 'PRG' }, SG('2', 'Hd00'), { key: 'DOWN' }, SG('4', 'Hd01')] },
        { t: 'Esci', d: 'Scorri fino a ESC e premi Prg.', b: [SG('4', 'Hd01'), { key: 'DOWN' }, SG('', 'ESC'), { key: 'PRG' }, STD] }
      ] },
    { id: 'uch-upgrade', cmd: 'Microchiller', min: 10, short: 'Configurazione da PC', grp: 'assistenza', name: 'Configurazione con Applica Desktop', sub: 'Caricare una configurazione da computer',
      intro: 'Il µChiller non si aggiorna da chiavetta: configurazioni e parametri si caricano dal computer con Applica Desktop, collegato alla porta BMS.',
      need: ['Computer con Applica Desktop (da ksa.carel.com)', 'Convertitore USB/RS485 CVSTDUMOR0', 'File di configurazione fornito da Euroklimat'],
      steps: [
        { t: 'Collega il computer', d: 'Collega il convertitore USB/RS485 al computer e alla porta BMS del µChiller, che deve essere alimentato.', b: [{ ill: 'rs485' }, STD] },
        { t: 'Crea il collegamento', d: 'In Applica Desktop scegli Add target, indica la porta COM del convertitore e imposta: 115200 baud, 8 bit, parità None, 2 bit di stop, nodo 1.', b: [{ ill: 'target' }] },
        { t: 'Collegati al controllo', d: 'Premi Connect, poi apri la scheda Configurations.', b: [{ ill: 'connect' }] },
        { t: 'Applica la configurazione', d: 'Con File → Import carica il file di configurazione, selezionalo e scegli Apply Configuration.',
          note: 'A fine operazione Applica Desktop conferma l’avvenuta parametrizzazione.', b: [{ ill: 'apply' }, STD] }
      ] }
  ];
  const BOZZA_UCH = 'Bozza ricostruita dal manuale Carel µChiller (+0300053IT): codici e valori del display sono da verificare sul comando Euroklimat. Il terminale è un’illustrazione.';
  ['P30', 'P45', 'P51', 'P53'].forEach(c => bozzaPGD(c).forEach(p => P.push({ ...p, bozza: BOZZA_PGD })));
  UCH.forEach(p => P.push({ ...p, bozza: BOZZA_UCH }));


  // ════════ Passaggi uniti (17/11/2026): le azioni che si fanno di seguito diventano un solo passo ════════
  // per ogni procedura: gruppi di passi originali (indici da 0) con titolo e testo nuovi; [i] lascia il passo com'è
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function unisci(P, groups) {
    const map = {}, out = groups.map((g, ni) => {
      const [idx, t, d, extra] = Array.isArray(g[0]) ? g : [g, null, null];
      idx.forEach(i => map[i] = ni);
      if (idx.length === 1 && !t) return P.steps[idx[0]];
      const ss = idx.map(i => P.steps[i]), b = [];
      ss.forEach(s => s.b.forEach(x => { if (!(b.length && same(b[b.length - 1], x))) b.push(x); }));
      const o = { t: t || ss[0].t, d: d || ss.map(s => s.d).join(' '), b };
      const warn = ss.map(s => s.warn).filter(Boolean), note = ss.map(s => s.note).filter(Boolean), br = ss.find(s => s.br)?.br;
      if (warn.length) o.warn = warn.join(' '); if (note.length) o.note = note.join(' '); if (br) o.br = { ...br };
      return Object.assign(o, extra);
    });
    out.forEach(s => { if (s.br) s.br = { ...s.br, vai: map[s.br.vai] }; });
    P.steps = out;
  }
  const byId = id => P.find(p => p.id === id);
  const impExp = (mode) => [
    [[0, 1], 'Apri il menu principale', 'Premi Prg e inserisci la password: se non è stata cambiata è 0000. Conferma con Enter.'],
    [[2, 3], 'Apri Params Import/Export', 'Con le frecce Su e Giù scorri fino a Unit Config e premi Enter, poi scorri fino a Params Import/Export e premi Enter.'],
    [[4, 5], mode === 'Export' ? 'Imposta e avvia l’esportazione' : 'Imposta e avvia l’importazione',
      (mode === 'Export'
        ? 'Imposta Import/Export su Export, Memory type su USB e File name su Export_01 (o il primo numero libero).'
        : 'Imposta Import/Export su Import, Memory type su USB e File name su Export_01 (o il numero del file da importare).') + ' Porta Confirm su Yes e premi Enter.'],
    [6], [7]];
  unisci(byId('export'), impExp('Export'));
  unisci(byId('import'), impExp('Import'));
  unisci(byId('upgrade'), [
    [[0, 1], 'Apri il menu di sistema e scegli UPGRADE', 'Tieni premuti insieme Allarme e Enter per 3 secondi. Con le frecce Su e Giù scorri fino a UPGRADE e conferma con Enter.'],
    [[2, 3], 'Conferma e avvia l’aggiornamento', 'Il c.pCO può impiegare fino a un minuto per riconoscere il software. Quando compare il nome del file confermalo con Enter, poi premi ancora Enter per avviare l’aggiornamento.'],
    [4]]);
  unisci(byId('setpoint'), [
    [[0, 1], 'Set point di raffrescamento', 'Dalla schermata principale premi Enter per aprire il menu Set. Premi Enter sul valore di Cooling, regolalo con le frecce e conferma con Enter.'],
    [2], [3], [4]]);
  unisci(byId('allarmi'), [
    [0],
    [[1, 2, 3], 'Apri la pagina Alarm Export', 'Premi Prg. Con la freccia Su scorri fino a Unit config e premi Enter, poi premi ancora una volta Su per passare alla pagina Alarm Export.'],
    [[4, 5], 'Scegli la memoria USB', 'Premi Enter, con la freccia Giù imposta Memory type su USB e conferma con Enter. Premi Enter per confermare il nome del file (AL_EXPORT_00).'],
    [6], [7]]);
  unisci(byId('log'), [
    [0],
    [[1, 2], 'Apri LOGGER', 'Premi Allarme, poi Enter per aprire il menu. Con la freccia Giù scorri fino a LOGGER e premi Enter.'],
    [[3, 4], 'Esporta EK_Log', 'Premi Enter su EXPORT LOGS e ancora Enter per confermare. Con la freccia Giù seleziona EK_Log e premi Enter: attendi il messaggio “Log operation done successfully”.'],
    [5]]);
  unisci(byId('rete'), [
    [[0, 1, 2], 'Apri Network', 'Premi Prg. Con la freccia Su scorri fino a Setting e premi Enter, poi fino a Network e premi Enter.'],
    [3], [4],
    [[5, 6], 'Applica la configurazione di rete', 'Scorri fino a NET Configuration e premi Enter: nella pagina 1/2 controlla che Enable sia Static. Passa alla pagina 2/2, premi Enter su Update Config, imposta Yes e conferma con Enter.'],
    [7], [8]]);
  // preparazione della chiavetta: un passo solo, con l'illustrazione del file nella cartella UPGRADE
  unisci(byId('preliminari'), [
    [[0, 1, 2], 'Prepara la chiavetta USB', 'Su una chiavetta USB vuota (fino a 32 GB) crea una cartella chiamata UPGRADE e copiaci il file del software fornito, quello con estensione .ap1.', { b: [{ ill: 'file' }] }],
    [3]]);
  // e le operazioni preliminari entrano nell'esportazione: si prepara la chiavetta e la si usa subito
  {
    const pre = byId('preliminari'), ex = byId('export');
    ex.steps.forEach(s => { if (s.br) s.br.vai += pre.steps.length; });
    pre.steps[pre.steps.length - 1] = { ...pre.steps[pre.steps.length - 1], note: undefined };
    ex.steps = [...pre.steps, ...ex.steps];
    Object.assign(ex, { name: 'Preparazione ed esportazione parametri', short: 'Prepara ed esporta', min: 8,
      sub: 'Preparare la chiavetta USB e salvarci i parametri della macchina',
      intro: 'Prepara la chiavetta con il nuovo software e salvaci i parametri della macchina, per poterli ricaricare dopo l’aggiornamento.',
      need: ['Chiavetta USB vuota, fino a 32 GB', 'Computer', 'File del software (.ap1)', 'Password 0000 (se non cambiata)'] });
    P.splice(P.indexOf(pre), 1);
    byId('upgrade').need = ['Chiavetta preparata e parametri esportati (procedura 1)'];
  }
  ['p30', 'p45', 'p51', 'p53'].forEach(c => {
    unisci(byId(c + '-upgrade'), [[0], [1],
      [[2, 3], 'Apri il menu di sistema e scegli UPGRADE', 'Tieni premuti insieme Allarme e Enter per 3 secondi. Con la freccia Giù scorri fino a UPGRADE e conferma con Enter.'], [4], [5]]);
    unisci(byId(c + '-rete'), [
      [[0, 1, 2], 'Apri Network', 'Premi Prg. Con la freccia Su scorri fino a Setting e premi Enter, poi fino a Network e premi Enter.'], [3], [4]]);
    unisci(byId(c + '-log'), [[0],
      [[1, 2], 'Apri LOGGER', 'Tieni premuti insieme Allarme e Enter per 3 secondi. Con la freccia Giù scorri fino a LOGGER e premi Enter.'], [3], [4]]);
    unisci(byId(c + '-allarmi'), [
      [[0, 1], 'Apri gli allarmi', 'Premi il tasto Allarme: compaiono codice, data, descrizione e valori delle sonde (se non ci sono allarmi, “NO ALARMS”). Con le frecce Su e Giù passi da un allarme all’altro.'], [2], [3], [4]]);
    unisci(byId(c + '-setpoint'), [
      [[0, 1], 'Set point di raffrescamento', 'Dalla schermata principale seleziona SET con le frecce e premi Enter. Premi ancora Enter sul valore, regolalo con le frecce e conferma con Enter.'], [2], [3]]);
  });
  unisci(byId('uch-setpoint'), [
    [[0, 1], 'Set point di raffreddamento', 'Tieni premuto Giù per 3 secondi (compare SEtA), poi premi Giù: compare SEtC. Premi Prg, regola il valore con le frecce e conferma con Prg.'], [2], [3]]);
  unisci(byId('uch-onoff'), [
    [[0, 1], 'Vai al comando UnSt', 'Tieni premuto Giù per 3 secondi, poi premi Giù fino al comando UnSt.'], [2], [3]]);
  unisci(byId('uch-allarmi'), [[0],
    [[1, 2], 'Inserisci la password', 'Premi Prg: compare PSd. Premi Prg, imposta la prima cifra a 1 con la freccia Su e conferma con Prg; conferma le altre cifre con Prg.'], [3], [4], [5]]);
  unisci(byId('uch-log'), [[0],
    [[1, 2], 'Leggi le temperature dei circuiti', 'Premi Giù per scorrere: EuP1 evaporazione, SSH1 surriscaldamento, Cnd1 condensazione e dSt1 scarico del compressore del circuito 1.'], [3]]);
  unisci(byId('uch-rete'), [
    [[0, 1], 'Entra con la password Assistenza', 'Premi Prg e inserisci la password 2000 (ogni cifra con le frecce, conferma con Prg). Poi tieni premuto Prg per 3 secondi per tornare alla visualizzazione standard.'],
    [[2, 3], 'Imposta l’indirizzo Hd00', 'Premi Giù più volte fino a Hd00, l’indirizzo seriale BMS. Premi Prg, regola il valore con le frecce (da 1 a 247) e conferma con Prg.'], [4]]);
  unisci(byId('uch-upgrade'), [[0],
    [[1, 2], 'Crea il collegamento e collegati', 'In Applica Desktop scegli Add target, indica la porta COM e imposta 115200 baud, 8 bit, parità None, 2 bit di stop, nodo 1. Premi Connect e apri la scheda Configurations.'], [3]]);

  // comandi Euroklimat: per ognuno il terminale e le operazioni della tabella (17/11/2026)
  const OPS = c => [['upgrade', 'Software UPGRADE'], ['rete', 'Configurazione porte seriali'], ['log', 'Estrazione LOG funzionamento'],
    ['allarmi', 'Estrazione LOG allarmi'], ['setpoint', 'Modifica set point']].map(([k, n]) => [c ? c + '-' + k : k, n]);
  const COMANDI = [
    { id: 'P56', term: 'pgd1', ops: OPS('') },
    ...['P30', 'P45', 'P51', 'P53'].map(id => ({ id, term: 'pgd1', ops: OPS(id.toLowerCase()) })),
    { id: 'Microchiller', term: 'uch', ops: [['uch-setpoint', 'Modifica set point'], ['uch-onoff', 'Accensione e spegnimento'], ['uch-allarmi', 'Storico allarmi'],
      ['uch-log', 'Dati di funzionamento'], ['uch-rete', 'Porta seriale BMS'], ['uch-upgrade', 'Configurazione da PC']] }
  ];
  const KEYS_PGD = {
    ALARM: { name: 'Allarme', hint: 'Mostra gli allarmi; con Enter apre il menu di sistema' },
    PRG: { name: 'Prg', hint: 'Apre il menu principale' },
    ESC: { name: 'Esc', hint: 'Torna indietro di un livello' },
    UP: { name: 'Su', hint: 'Scorre in su o aumenta il valore' },
    ENTER: { name: 'Enter', hint: 'Conferma o entra in modifica' },
    DOWN: { name: 'Giù', hint: 'Scorre in giù o diminuisce il valore' }
  };
  const KEYS_UCH = {
    ALARM: { name: 'Allarme', hint: 'Allarmi attivi e cicalino; tenuto 3 s resetta gli allarmi' },
    PRG: { name: 'Prg', hint: 'Programmazione e conferma; tenuto 3 s torna indietro' },
    UP: { name: 'Su', hint: 'Voce precedente o aumenta il valore' },
    DOWN: { name: 'Giù', hint: 'Voce successiva o diminuisce; tenuto 3 s apre set point e accensione' }
  };

  window.EK = {
    comandi: COMANDI,
    terms: { pgd1: { name: 'Terminale pGD1 · controllore c.pCO', keys: KEYS_PGD }, uch: { name: 'Terminale µChiller', keys: KEYS_UCH } },
    groups: {
      aggiornamento: { name: 'Aggiornamento software', sub: 'Da eseguire in quest’ordine' },
      uso: { name: 'Uso', sub: 'Regolazioni di tutti i giorni' },
      assistenza: { name: 'Assistenza', sub: 'Dati per il servizio tecnico e collegamenti' }
    },
    keys: KEYS_PGD,
    procs: P
  };
})();
